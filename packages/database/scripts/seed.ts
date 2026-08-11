/**
 * Idempotent seed for local development and CI:
 *  - roles & permissions
 *  - admin account
 *  - demo assets (XLM, USDC, custom)
 *  - demo merchant + products + payment link
 *  - demo users with wallets & contacts
 *
 * Run with: pnpm db:seed  (from repo root)
 */

import { createHash, randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function demoKey(seed: string): string {
  // Deterministic pseudo-key for demo data (not a real Stellar account).
  const h = createHash('sha256').update(seed).digest();
  const key = Array.from({ length: 56 }, (_, i) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return chars[h[i % h.length] % 32];
  });
  key[0] = 'G';
  return key.join('');
}

async function seedRolesAndPermissions(): Promise<void> {
  const permissions = [
    'payments:create',
    'payments:read',
    'payments:admin',
    'users:read',
    'users:write',
    'users:admin',
    'merchants:read',
    'merchants:write',
    'merchants:admin',
    'invoices:read',
    'invoices:write',
    'transactions:read',
    'transactions:admin',
    'assets:read',
    'assets:admin',
    'analytics:read',
    'settings:admin',
    'audit:read',
    'webhooks:write',
  ];

  for (const name of permissions) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: `Grants ${name} access` },
    });
  }

  const roleMap: Record<string, string[]> = {
    USER: ['payments:create', 'payments:read', 'users:read', 'users:write', 'assets:read'],
    MERCHANT: [
      'payments:create',
      'payments:read',
      'merchants:read',
      'merchants:write',
      'invoices:read',
      'invoices:write',
      'webhooks:write',
    ],
    SUPPORT: ['payments:read', 'users:read', 'transactions:read', 'merchants:read'],
    ADMIN: permissions,
  };

  for (const [roleName, perms] of Object.entries(roleMap)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });
    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: (await prisma.permission.findUnique({ where: { name: perm } }))!.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: (await prisma.permission.findUnique({ where: { name: perm } }))!.id,
        },
      });
    }
  }
}

async function seedSettings(): Promise<void> {
  const settings = [
    { key: 'maintenance_mode', value: false, description: 'Blocks new payments when true' },
    { key: 'min_payment_amount', value: '0.0000001', description: 'Minimum XLM payment' },
    { key: 'max_batch_size', value: 100, description: 'Max destinations per batch payment' },
    { key: 'fee_share_percent', value: 0, description: 'Platform fee percentage on settlements' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@stellar-pay.dev';
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(16).toString('hex');
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`⚠ Generated random admin password: ${password}`);
  }
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashPassword(password),
      displayName: 'Platform Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      preferences: { create: { currency: 'USD' } },
    },
  });
  console.log(`Seeded admin: ${email}`);
}

async function seedAssets(): Promise<void> {
  const usdcIssuer = demoKey('usdc-issuer');
  // XLM has a null issuer — Prisma 6 compound-unique where doesn't accept null,
  // so use findFirst + create for nullable-issuer assets.
  const existingXlm = await prisma.asset.findFirst({
    where: { code: 'XLM', issuer: null },
  });
  if (!existingXlm) {
    await prisma.asset.create({
      data: {
        code: 'XLM',
        issuer: null,
        type: 'NATIVE',
        name: 'Stellar Lumens',
        description: 'Native asset of the Stellar network',
        decimals: 7,
        isNative: true,
        isEnabled: true,
      },
    });
  }
  await prisma.asset.upsert({
    where: { code_issuer: { code: 'USDC', issuer: usdcIssuer } },
    update: {},
    create: {
      code: 'USDC',
      issuer: usdcIssuer,
      type: 'STELLAR',
      name: 'USD Coin',
      description: 'USD-pegged stablecoin (demo issuer)',
      decimals: 7,
      isCrossBorder: true,
      isEnabled: true,
    },
  });
  await prisma.asset.upsert({
    where: { code_issuer: { code: 'EURT', issuer: usdcIssuer } },
    update: {},
    create: {
      code: 'EURT',
      issuer: usdcIssuer,
      type: 'STELLAR',
      name: 'Euro Token',
      description: 'EUR-pegged stablecoin (demo issuer)',
      decimals: 7,
      isCrossBorder: true,
      isEnabled: true,
    },
  });
}

async function seedDemoUsers(): Promise<void> {
  const keys = ['demo-user-1', 'demo-user-2'];
  for (let i = 0; i < keys.length; i++) {
    const pub = demoKey(keys[i]);
    const email = `user${i + 1}@stellar-pay.dev`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        displayName: `Demo User ${i + 1}`,
        status: 'ACTIVE',
        role: 'USER',
        preferences: { create: { currency: 'USD' } },
        wallets: {
          create: {
            publicKey: pub,
            provider: i === 0 ? 'FREIGHTER' : 'XBULL',
            network: 'testnet',
            isPrimary: true,
          },
        },
      },
    });
  }
  console.log('Seeded demo users');
}

async function seedDemoMerchant(): Promise<void> {
  const merchantUser = await prisma.user.findUnique({ where: { email: 'user1@stellar-pay.dev' } });
  if (!merchantUser) {
    return;
  }
  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    update: {},
    create: {
      userId: merchantUser.id,
      name: 'Demo Coffee Co.',
      slug: 'demo-coffee-co',
      description: 'A demo merchant selling coffee beans & merch',
      currency: 'USD',
      settlementAssetCode: 'USDC',
      settlementPublicKey: demoKey('settlement-key'),
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      webhookUrl: 'https://example.com/webhooks/payments',
      webhookSecret: randomBytes(24).toString('hex'),
    },
  });

  const products = [
    { name: 'Ethiopia Single Origin (250g)', priceAmount: '14.5' },
    { name: 'Colombia Decaf (250g)', priceAmount: '13.0' },
    { name: 'Ceramic Travel Mug', priceAmount: '24.0' },
    { name: 'Gift Card $25', priceAmount: '25.0' },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `${merchant.id}-${p.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `${merchant.id}-${p.name.replace(/\s+/g, '-').toLowerCase()}`,
        merchantId: merchant.id,
        name: p.name,
        priceAmount: p.priceAmount,
        assetCode: 'USDC',
      },
    });
  }

  await prisma.paymentLink.upsert({
    where: { code: 'demo-coffee' },
    update: {},
    create: {
      merchantId: merchant.id,
      code: 'demo-coffee',
      title: 'Buy me a coffee',
      description: 'Support Demo Coffee Co.',
      amount: '5',
      assetCode: 'USDC',
      fixedAmount: true,
    },
  });

  console.log('Seeded demo merchant');
}

async function main(): Promise<void> {
  console.log('Seeding database…');
  await seedRolesAndPermissions();
  await seedSettings();
  await seedAdmin();
  await seedAssets();
  await seedDemoUsers();
  await seedDemoMerchant();
  console.log('Seed complete ✔');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
