import { SessionState, BackendStatus } from './types';

document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const sessionInfo = document.getElementById('session-info');
  const queueInfo = document.getElementById('queue-info');
  const startSessionDiv = document.getElementById('start-session-div');
  const endSessionDiv = document.getElementById('end-session-div');
  const sessionTitleInput = document.getElementById('session-title') as HTMLInputElement;
  const startBtn = document.getElementById('start-btn');
  const endBtn = document.getElementById('end-btn');
  const dashboardBtn = document.getElementById('dashboard-btn');

  function updateUI() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (!response) return;

      const { sessionState, backendStatus, queueLength } = response as {
        sessionState: SessionState;
        backendStatus: BackendStatus;
        queueLength: number;
      };

      // Backend status
      if (backendStatus?.connected) {
        statusIndicator!.className = 'status-dot connected';
        statusText!.textContent = 'Connected';
      } else {
        statusIndicator!.className = 'status-dot disconnected';
        statusText!.textContent = 'Disconnected';
      }

      // Queue status
      if (queueLength > 0) {
        queueInfo!.textContent = `${queueLength} events queued`;
        queueInfo!.style.display = 'block';
      } else {
        queueInfo!.style.display = 'none';
      }

      // Session status
      if (sessionState?.isActive) {
        sessionInfo!.textContent = `Active: ${sessionState.sessionTitle || 'Unnamed Session'}`;
        startSessionDiv!.style.display = 'none';
        endSessionDiv!.style.display = 'block';
      } else {
        sessionInfo!.textContent = 'No active session';
        startSessionDiv!.style.display = 'block';
        endSessionDiv!.style.display = 'none';
      }
    });
  }

  startBtn?.addEventListener('click', () => {
    const title = sessionTitleInput.value.trim();
    chrome.runtime.sendMessage({ type: 'START_SESSION', title }, () => {
      sessionTitleInput.value = '';
      updateUI();
    });
  });

  endBtn?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'END_SESSION' }, () => {
      updateUI();
    });
  });

  dashboardBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173' });
  });

  // Initial update
  updateUI();

  // Periodic refresh
  setInterval(updateUI, 5000);
});
