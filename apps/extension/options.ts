import { getApiUrl, setApiUrl, setToken, setPublicKey } from './lib/api';

const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
const saveBtn = document.getElementById('save-btn')!;
const logoutBtn = document.getElementById('logout-btn')!;
const saveStatus = document.getElementById('save-status')!;

document.addEventListener('DOMContentLoaded', async () => {
  apiUrlInput.value = await getApiUrl();

  saveBtn.addEventListener('click', async () => {
    await setApiUrl(apiUrlInput.value.trim());
    saveStatus.style.display = 'block';
    setTimeout(() => (saveStatus.style.display = 'none'), 2000);
  });

  logoutBtn.addEventListener('click', async () => {
    await setToken(null);
    await setPublicKey(null);
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    saveStatus.textContent = 'Disconnected. Close this tab.';
    saveStatus.style.display = 'block';
  });
});
