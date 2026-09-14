const FRONTEND_SOURCE = 'pariet-frontend';
const EXTENSION_SOURCE = 'pariet-extension';

interface BridgeMessage {
  source?: string;
  type?: string;
  requestId?: string;
  urls?: string[];
  focusUrl?: string | null;
}

interface BridgeReply {
  ok?: boolean;
  count?: number;
  error?: string;
}

function respond(requestId: string, type: string, payload: BridgeReply = {}) {
  window.postMessage({ source: EXTENSION_SOURCE, type, requestId, ...payload }, '*');
}

// Relays typed messages from the Research Mind web app (window.postMessage)
// to the extension background service worker, using the existing
// chrome.runtime message channel, and posts the reply back to the page.
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;

  const data = event.data as BridgeMessage | undefined;
  if (!data || data.source !== FRONTEND_SOURCE) return;

  if (data.type === 'TRAK_PING') {
    respond(data.requestId ?? '', 'TRAK_PONG');
    return;
  }

  if (data.type === 'TRAK_RESTORE_TABS') {
    const urls = Array.isArray(data.urls) ? data.urls.filter((u): u is string => typeof u === 'string') : [];
    const focusUrl = typeof data.focusUrl === 'string' ? data.focusUrl : null;
    chrome.runtime.sendMessage({ type: 'RESTORE_TABS', urls, focusUrl }, (response) => {
      if (chrome.runtime.lastError) {
        respond(data.requestId ?? '', 'TRAK_RESTORE_TABS_RESULT', {
          ok: false,
          error: chrome.runtime.lastError?.message ?? 'Background unavailable'
        });
        return;
      }
      respond(data.requestId ?? '', 'TRAK_RESTORE_TABS_RESULT', response ?? { ok: false, error: 'No response from background' });
    });
  }
});