/**
 * Popup script for the StellarPay Hub Chrome extension.
 * Handles wallet connection, balance display, quick-send, and transaction history.
 */

import * as api from './lib/api';

// ── DOM refs ────────────────────────────────────────────────

const connectedView = document.getElementById('connected-view')!;
const disconnectedView = document.getElementById('disconnected-view')!;
const connectBtn = document.getElementById('connect-btn')!;
const sendForm = document.getElementById('send-form') as HTMLFormElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const recipientInput = document.getElementById('recipient') as HTMLInputElement;
const amountInput = document.getElementById('amount') as HTMLInputElement;
const assetSelect = document.getElementById('asset-select') as HTMLSelectElement;
const balanceAmount = document.getElementById('balance-amount')!;
const balanceAsset = document.getElementById('balance-asset')!;
const txList = document.getElementById('tx-list')!;
const statusDiv = document.getElementById('status')!;
const networkBadge = document.getElementById('network-badge')!;
const openAppLink = document.getElementById('open-app') as HTMLAnchorElement;
const openOptionsLink = document.getElementById('open-options') as HTMLAnchorElement;
let isOffline = false;

// ── Init ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupLinks();
  const token = await api.getToken();
  if (token) {
    showConnected();
    await refreshData();
    startAutoRefresh();
  } else {
    showDisconnected();
  }

  connectBtn.addEventListener('click', handleConnect);
  sendForm.addEventListener('submit', handleSend);
}

function setupLinks() {
  api.getApiUrl().then((url) => {
    openAppLink.href = url.replace(':4000', ':3000');
  });
  openOptionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// ── Auth ────────────────────────────────────────────────────

async function handleConnect() {
  try {
    // Check if Freighter is available
    const freighter = (window as unknown as Record<string, unknown>).freighterApi as
      | { getPublicKey: () => Promise<string>; signMessage: (msg: string, key: string) => Promise<string> }
      | undefined;

    if (!freighter) {
      showStatus('Freighter wallet not detected. Install it from freighter.app', 'error');
      return;
    }

    const publicKey = await freighter.getPublicKey();

    // Get challenge from API
    const challenge = await api.getChallenge(publicKey);

    // Sign the challenge with Freighter
    const signature = await freighter.signMessage(challenge.message, publicKey);

    // Verify and get JWT
    const auth = await api.verifySignature({
      publicKey,
      signature,
      message: challenge.message,
      nonce: challenge.nonce,
      provider: 'FREIGHTER',
    });

    // Save auth data
    await api.setToken(auth.accessToken);
    await api.setPublicKey(publicKey);

    // Notify background worker
    await chrome.runtime.sendMessage({
      type: 'LOGIN_SUCCESS',
      payload: { token: auth.accessToken, publicKey },
    });

    showConnected();
    await refreshData();
    startAutoRefresh();
  } catch (err) {
    showStatus((err as Error).message || 'Authentication failed', 'error');
  }
}

// ── Data ────────────────────────────────────────────────────

async function refreshData() {
  const publicKey = await api.getPublicKey();
  if (!publicKey) return;

  try {
    const [balances, txResponse] = await Promise.all([
      api.getBalances(publicKey),
      api.getRecentTransactions({ pageSize: 5 }),
    ]);

    isOffline = false;
    networkBadge.textContent = 'testnet';
    networkBadge.style.color = '';

    // Display native balance first
    const xlm = balances.find((b) => b.isNative);
    if (xlm) {
      balanceAmount.textContent = formatAmount(xlm.balance);
      balanceAsset.textContent = 'XLM';
    } else if (balances.length > 0) {
      balanceAmount.textContent = formatAmount(balances[0].balance);
      balanceAsset.textContent = balances[0].assetCode;
    }

    // Populate asset dropdown
    assetSelect.innerHTML = '';
    for (const b of balances) {
      const opt = document.createElement('option');
      opt.value = b.assetCode;
      opt.textContent = b.assetCode;
      assetSelect.appendChild(opt);
    }

    // Render transaction list
    renderTransactions(txResponse.data ?? []);
  } catch (err) {
    if (!isOffline) {
      console.warn('API unreachable:', (err as Error).message);
      showOfflineState();
    }
  }
}

function renderTransactions(txs: Array<{
  id: string;
  amount: string;
  assetCode: string;
  direction: string;
  createdAt: string;
}>) {
  txList.innerHTML = '';

  if (txs.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No recent transactions';
    li.style.cssText = 'color: var(--text-muted); font-size: 12px; padding: 8px 0;';
    txList.appendChild(li);
    return;
  }

  for (const tx of txs.slice(0, 5)) {
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.innerHTML = `
      <div>
        <span class="tx-dir ${tx.direction === 'SENT' ? 'sent' : 'received'}">
          ${tx.direction === 'SENT' ? '↑ Sent' : '↓ Received'}
        </span>
        <span class="tx-date">${formatDate(tx.createdAt)}</span>
      </div>
      <span class="tx-amount">${formatAmount(tx.amount)} ${tx.assetCode}</span>
    `;
    txList.appendChild(li);
  }
}

// ── Send ────────────────────────────────────────────────────

async function handleSend(e: Event) {
  e.preventDefault();
  const recipient = recipientInput.value.trim();
  const amount = amountInput.value.trim();
  const assetCode = assetSelect.value;

  if (!recipient || !amount) {
    showStatus('Please fill in recipient and amount.', 'error');
    return;
  }

  sendBtn.disabled = true;
  showStatus('Creating payment...', 'success');

  try {
    const payment = await api.createPayment({ to: recipient, amount, assetCode });

    // Sign the XDR with Freighter
    const freighter = (window as unknown as Record<string, unknown>).freighterApi as
      | { signTransaction: (xdr: string, network: string, publicKey: string) => Promise<string> }
      | undefined;

    if (!freighter) {
      throw new Error('Freighter not available');
    }

    const publicKey = await api.getPublicKey();
    const signedXdr = await freighter.signTransaction(
      payment.unsignedXdr,
      'TESTNET',
      publicKey!,
    );

    // Submit signed transaction
    await api.submitPayment({ signedXdr, paymentId: payment.id });

    showStatus('Payment sent! 🎉', 'success');
    recipientInput.value = '';
    amountInput.value = '';

    await refreshData();
  } catch (err) {
    showStatus((err as Error).message || 'Payment failed', 'error');
  } finally {
    sendBtn.disabled = false;
    setTimeout(() => statusDiv.classList.add('hidden'), 4000);
  }
}

// ── UI helpers ──────────────────────────────────────────────

function showConnected() {
  connectedView.classList.remove('hidden');
  disconnectedView.classList.add('hidden');
}

function showDisconnected() {
  connectedView.classList.add('hidden');
  disconnectedView.classList.remove('hidden');
}

function showOfflineState() {
  isOffline = true;
  networkBadge.textContent = 'offline';
  networkBadge.style.color = 'var(--text-muted)';
  balanceAmount.textContent = '—';
  balanceAsset.textContent = '';
  txList.innerHTML = '';
  const li = document.createElement('li');
  li.textContent = 'API not reachable — check Settings';
  li.style.cssText = 'color: var(--text-muted); font-size: 12px; padding: 8px 0;';
  txList.appendChild(li);
}

function showStatus(msg: string, type: 'success' | 'error') {
  statusDiv.textContent = msg;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

function startAutoRefresh() {
  if (refreshInterval) return;
  refreshInterval = setInterval(refreshData, 15000); // every 15s
}

// ── Formatters ──────────────────────────────────────────────

function formatAmount(value: string): string {
  const n = parseFloat(value);
  if (isNaN(n)) return value;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(n < 1 ? 4 : 2);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}
