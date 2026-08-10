#!/usr/bin/env node
/**
 * E2E test: Auth challenge → verify → payment flow
 *
 * Verifies the full authentication-and-payment lifecycle against a running
 * StellarPay API. Generates a testnet keypair, authenticates via the Ed25519
 * challenge-response flow, and creates a payment using the returned JWT.
 *
 * Usage:
 *   # Against a running API
 *   API_URL=http://localhost:4000 node tests/e2e/auth-payment-flow.mjs
 *
 *   # Boot the API automatically (requires Docker for Postgres + Redis)
 *   pnpm --filter @stellar-pay/api build
 *   node tests/e2e/auth-payment-flow.mjs
 *
 * Requirements:
 *   - Node.js 22+
 *   - Running API with Postgres + Redis
 */

import { Keypair, Networks } from '@stellar/stellar-sdk';
import { ApiClient, StellarNetwork } from '../../packages/sdk/dist/index.js';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';
const BOOT_API = !process.env.API_URL;

// ── Test helpers ────────────────────────────────────────────────────────────

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const icon = ok ? '✓' : '✗';
  console.log(`  ${icon}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

function summary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log(`${'═'.repeat(50)}\n`);
}

// ── Boot API if needed ──────────────────────────────────────────────────────

async function bootApi() {
  console.log('Booting API for E2E test…');
  const child = spawn('pnpm', ['--filter', '@stellar-pay/api', 'start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '4100',
      NODE_ENV: 'development',
      JWT_SECRET: 'e2e-test-secret-at-least-16-chars',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/stellar_pay?schema=public',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
      STELLAR_NETWORK: 'testnet',
      ADMIN_EMAIL: 'e2e@test.dev',
      ADMIN_PASSWORD: 'E2eTest123!',
    },
    shell: false,
  });

  // Wait for the API to boot (NestJS takes a few seconds with Prisma + Redis)
  for (let i = 0; i < 30; i++) {
    await delay(1_000);
    try {
      const res = await fetch(`http://localhost:4100/health`);
      if (res.ok) {
        console.log('  API is ready.');
        return { child, baseUrl: 'http://localhost:4100' };
      }
    } catch {
      /* still booting */
    }
  }
  child.kill();
  throw new Error('API failed to start within 30 seconds');
}

// ── Main test flow ──────────────────────────────────────────────────────────

async function run() {
  let child = null;
  let baseUrl = API_URL;

  if (BOOT_API) {
    const booted = await bootApi();
    child = booted.child;
    baseUrl = booted.baseUrl;
  }

  try {
    // -- Step 1: Health check ---------------------------------------------------
    console.log('\n1. Health check');
    const health = await fetch(`${baseUrl}/health`).then((r) => r.json());
    check('API is healthy', health?.status === 'ok', JSON.stringify(health));
    if (health?.status !== 'ok') {
      console.error('  API not healthy — aborting');
      return;
    }

    // -- Step 2: Generate test keypair ------------------------------------------
    console.log('\n2. Generate testnet keypair');
    const kp = Keypair.random();
    check(
      'Keypair generated',
      !!kp.secret() && !!kp.publicKey(),
      `publicKey=${kp.publicKey().slice(0, 8)}…`,
    );

    // -- Step 3: Request auth challenge -----------------------------------------
    console.log('\n3. Request auth challenge');
    const client = new ApiClient({ baseUrl });

    let challenge;
    try {
      challenge = await client.auth.challenge(kp.publicKey());
      check('Challenge received', !!challenge?.nonce && !!challenge?.message);
      check(
        'Challenge has correct format',
        challenge?.message?.startsWith('stellar-pay:auth:'),
        challenge?.message?.slice(0, 40),
      );
    } catch (err) {
      check('Challenge received', false, err.message);
      return;
    }

    // -- Step 4: Sign challenge -------------------------------------------------
    console.log('\n4. Sign challenge message');
    const messageBytes = Buffer.from(challenge.message, 'utf8');
    const signatureBytes = kp.sign(messageBytes);
    const signature = Buffer.from(signatureBytes).toString('hex');
    check('Challenge signed', signature.length >= 128, `sig=${signature.slice(0, 16)}…`);

    // -- Step 5: Verify and get JWT ---------------------------------------------
    console.log('\n5. Verify & get JWT');
    let authResult;
    try {
      authResult = await client.auth.verify({
        publicKey: kp.publicKey(),
        signature,
        message: challenge.message,
        nonce: challenge.nonce,
        provider: 'FREIGHTER',
        deviceName: 'e2e-test',
      });
      check(
        'Auth verified',
        !!authResult?.accessToken,
        `user=${authResult?.user?.id?.slice(0, 8)}…`,
      );
      check('Refresh token present', !!authResult?.refreshToken);
      check('User created/returned', !!authResult?.user?.id);
    } catch (err) {
      check('Auth verified', false, err.message);
      return;
    }

    // -- Step 6: Create payment with JWT ----------------------------------------
    console.log('\n6. Create payment (JWT-authenticated)');

    // Create a fresh client with the JWT
    const authClient = new ApiClient({
      baseUrl,
      getToken: () => authResult.accessToken,
    });

    // Create a destination keypair for the payment
    const destKp = Keypair.random();

    let payment;
    try {
      payment = await authClient.payments.create({
        to: destKp.publicKey(),
        amount: '10',
        assetCode: 'XLM',
        memo: 'e2e-test-payment',
      });
      check('Payment created', !!payment?.id, `id=${payment?.id?.slice(0, 8)}…`);
      check(
        'Payment has transactionXdr',
        !!payment?.transactionXdr,
        `xdr=${payment?.transactionXdr?.slice(0, 20)}…`,
      );
    } catch (err) {
      check('Payment created', false, err.message);
      return;
    }

    // -- Step 7: Retrieve payment by ID -----------------------------------------
    console.log('\n7. Retrieve payment');
    try {
      const retrieved = await authClient.payments.get(payment.id);
      check('Payment found', !!retrieved, `id=${retrieved?.id?.slice(0, 8)}…`);
      check('Payment has correct amount', retrieved?.assetCode === 'XLM');
    } catch (err) {
      check('Payment found', false, err.message);
    }

    // -- Step 8: Logout ---------------------------------------------------------
    console.log('\n8. Logout');
    try {
      await authClient.auth.logout();
      check('Logout succeeded', true);
    } catch (err) {
      check('Logout succeeded', false, err.message);
    }

    // -- Step 9: Verify JWT is invalidated --------------------------------------
    console.log('\n9. Verify JWT is invalidated');
    try {
      await authClient.payments.list({ page: 1, pageSize: 1 });
      check('JWT invalidated (401 expected)', false, 'still accepted');
    } catch (err) {
      if (err.statusCode === 401) {
        check('JWT invalidated (401)', true);
      } else {
        check('JWT invalidated (401)', false, `got ${err.statusCode}: ${err.message}`);
      }
    }

    // -- Step 10: Stellar network connectivity test -----------------------------
    console.log('\n10. Stellar testnet connectivity');
    try {
      const network = StellarNetwork.forTestnet();
      const account = await network.getAccount(
        'GCYOTZR3A4JERO4SRKC2TG3LFVGZZ2AEUIYXXF6KXT2E2YDNPYRMQ5S5',
      );
      check('Testnet Horizon reachable', !!account, `sequence=${account?.sequenceNumber()}`);
    } catch (err) {
      check('Testnet Horizon reachable', false, err.message);
    }
  } finally {
    summary();
    if (child) {
      console.log('Stopping API…');
      child.kill('SIGTERM');
      await delay(1_000);
    }
  }
}

run().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exitCode = 1;
  summary();
});
