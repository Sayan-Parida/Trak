const FRONTEND_SOURCE = 'pariet-frontend';
const EXTENSION_SOURCE = 'pariet-extension';

export interface RestoreResult {
  ok: boolean;
  count?: number;
  error?: string;
}

interface BridgeReply {
  source?: string;
  type?: string;
  requestId?: string;
  ok?: boolean;
  count?: number;
  error?: string;
}

function postToContent(payload: Record<string, unknown>) {
  window.postMessage({ source: FRONTEND_SOURCE, ...payload }, '*');
}

function waitForReply<T extends BridgeReply>(requestId: string, type: string, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve(null);
    }, timeoutMs);

    const onMessage = (event: MessageEvent) => {
      const data = event.data as BridgeReply | undefined;
      if (!data || data.source !== EXTENSION_SOURCE) return;
      if (event.origin !== window.location.origin) return;
      if (data.type !== type || data.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      resolve(data as T);
    };

    window.addEventListener('message', onMessage);
  });
}

let pingSequence = 0;

/** True when the Trak/Pariet extension content-script bridge is reachable. */
export async function isExtensionAvailable(timeoutMs = 800): Promise<boolean> {
  if (typeof window === 'undefined' || !window.postMessage) return false;

  const attempts = 2;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const requestId = `ping-${Date.now()}-${pingSequence++}`;
    const pending = waitForReply<BridgeReply>(requestId, 'TRAK_PONG', timeoutMs);
    postToContent({ type: 'TRAK_PING', requestId });
    if ((await pending) !== null) return true;
  }
  return false;
}

let restoreSequence = 0;

/**
 * Asks the extension to open the given URLs as browser tabs.
 * `focusUrl`, when present, is opened last so it becomes the active tab.
 */
export async function restoreTabsViaExtension(
  urls: string[],
  focusUrl?: string | null
): Promise<RestoreResult> {
  if (typeof window === 'undefined' || !window.postMessage) {
    return { ok: false, error: 'TRAK_EXTENSION_UNAVAILABLE' };
  }

  const requestId = `restore-${Date.now()}-${restoreSequence++}`;
  const pending = waitForReply<BridgeReply>(requestId, 'TRAK_RESTORE_TABS_RESULT', 20000);
  postToContent({ type: 'TRAK_RESTORE_TABS', requestId, urls, focusUrl: focusUrl ?? null });

  const reply = await pending;
  if (!reply) {
    return { ok: false, error: 'TRAK_EXTENSION_UNAVAILABLE' };
  }
  return { ok: reply.ok === true, count: reply.count, error: reply.error };
}