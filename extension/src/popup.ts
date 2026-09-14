import { SessionState, BackendStatus } from './types';
import { api } from './api';

document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const sessionLabel = document.getElementById('session-label');
  const sessionInfo = document.getElementById('session-info');
  const captureNote = document.getElementById('capture-note');
  const queueInfo = document.getElementById('queue-info');
  const startSessionDiv = document.getElementById('start-session-div');
  const endSessionDiv = document.getElementById('end-session-div');
  const sessionTitleInput = document.getElementById('session-title') as HTMLInputElement;
  const startBtn = document.getElementById('start-btn');
  const endBtn = document.getElementById('end-btn');
  const dashboardBtn = document.getElementById('dashboard-btn');

  function applyView(sessionState: SessionState | null, backendConnected: boolean, queueLength: number) {
    if (backendConnected) {
      statusIndicator!.className = 'status-dot connected';
      statusText!.textContent = 'PARIET ● CONNECTED';
    } else {
      statusIndicator!.className = 'status-dot disconnected';
      statusText!.textContent = 'PARIET ● OFFLINE';
    }

    if (queueLength > 0) {
      queueInfo!.textContent = `${queueLength} events queued`;
      queueInfo!.style.display = 'block';
    } else {
      queueInfo!.style.display = 'none';
    }

    if (sessionState?.isActive && sessionState.sessionId) {
      sessionLabel!.textContent = 'ACTIVE RESEARCH';
      sessionInfo!.textContent = sessionState.sessionTitle || 'Untitled research session';
      captureNote!.style.display = 'block';
      startSessionDiv!.style.display = 'none';
      endSessionDiv!.style.display = 'block';
    } else {
      sessionLabel!.textContent = '';
      sessionInfo!.textContent = 'No active research session.';
      captureNote!.style.display = 'none';
      startSessionDiv!.style.display = 'block';
      endSessionDiv!.style.display = 'none';
    }
  }

  // Reconcile the extension's local session state against the authoritative
  // backend: clear it if the active session is gone, adopt the ACTIVE session
  // if we have none locally.
  async function reconcile(sessionState: SessionState | null): Promise<SessionState | null> {
    if (sessionState?.isActive && sessionState.sessionId) {
      const session = await api.getSession(sessionState.sessionId);
      if (!session || session.status !== 'ACTIVE') {
        await new Promise<void>((resolve) => chrome.runtime.sendMessage({ type: 'CLEAR_SESSION_STATE' }, () => resolve()));
        return { sessionId: null, sessionTitle: null, isActive: false };
      }
      return sessionState;
    }
    if (!sessionState?.isActive) {
      const sessions = await api.listSessions();
      const active = sessions?.find((s) => s.status === 'ACTIVE');
      if (active) {
        await new Promise<void>((resolve) => chrome.runtime.sendMessage({
          type: 'SET_SESSION_STATE',
          sessionId: active.id,
          sessionTitle: active.title
        }, () => resolve()));
        return { sessionId: active.id, sessionTitle: active.title, isActive: true };
      }
    }
    return sessionState;
  }

  function updateUI() {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (!response) return;

      const { sessionState, backendStatus, queueLength } = response as {
        sessionState: SessionState;
        backendStatus: BackendStatus;
        queueLength: number;
      };

      const connected = Boolean(backendStatus?.connected);

      applyView(sessionState, connected, queueLength);

      if (!connected) return;

      reconcile(sessionState).then((effective) => {
        applyView(effective, connected, queueLength);
      });
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