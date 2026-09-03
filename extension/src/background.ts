import { api } from './api';
import { BrowserEventRequest, SessionState, QueuedEvent, BackendStatus, EventType } from './types';

// Constants
const QUEUE_LIMIT = 1000;

// Initialize state if missing
async function initState() {
  const data = await chrome.storage.local.get(['sessionState', 'eventQueue', 'backendStatus']);
  if (!data.sessionState) {
    await chrome.storage.local.set({ sessionState: { sessionId: null, sessionTitle: null, isActive: false } as SessionState });
  }
  if (!data.eventQueue) {
    await chrome.storage.local.set({ eventQueue: [] as QueuedEvent[] });
  }
  if (!data.backendStatus) {
    await chrome.storage.local.set({ backendStatus: { connected: false, lastCheck: Date.now() } as BackendStatus });
  }
}

initState();

// Queue and processing
async function processEvent(event: BrowserEventRequest) {
  const data = await chrome.storage.local.get(['sessionState', 'eventQueue']);
  const sessionState: SessionState = data.sessionState;
  
  if (sessionState.isActive && sessionState.sessionId) {
    event.sessionId = sessionState.sessionId;
  }

  const success = await api.sendEvent(event);
  
  if (success) {
    // Update backend status
    await updateBackendStatus(true);
    // Try to flush queue
    flushQueue();
  } else {
    // Add to queue
    const queue: QueuedEvent[] = data.eventQueue || [];
    if (queue.length < QUEUE_LIMIT) {
      queue.push({ event, retryCount: 0 });
      await chrome.storage.local.set({ eventQueue: queue });
    }
    await updateBackendStatus(false);
  }
}

async function flushQueue() {
  const data = await chrome.storage.local.get(['eventQueue']);
  let queue: QueuedEvent[] = data.eventQueue || [];
  
  if (queue.length === 0) return;

  const successfulEvents: number[] = [];
  
  for (let i = 0; i < queue.length; i++) {
    const success = await api.sendEvent(queue[i].event);
    if (success) {
      successfulEvents.push(i);
    } else {
      break; // Stop flushing on first failure
    }
  }

  if (successfulEvents.length > 0) {
    // Remove successful events
    queue = queue.filter((_, idx) => !successfulEvents.includes(idx));
    await chrome.storage.local.set({ eventQueue: queue });
  }
}

async function updateBackendStatus(connected: boolean) {
  await chrome.storage.local.set({
    backendStatus: { connected, lastCheck: Date.now() }
  });
}

// Alarms for periodic tasks
chrome.alarms.create('flushQueue', { periodInMinutes: 0.5 }); // 30 seconds
chrome.alarms.create('healthCheck', { periodInMinutes: 0.5 }); // 30 seconds

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'flushQueue') {
    flushQueue();
  } else if (alarm.name === 'healthCheck') {
    const isHealthy = await api.checkHealth();
    const data = await chrome.storage.local.get(['backendStatus']);
    const wasConnected = data.backendStatus?.connected;
    
    await updateBackendStatus(isHealthy);
    
    if (isHealthy && !wasConnected) {
      flushQueue();
    }
  }
});

// Helper to check incognito
async function isIncognito(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return tab.incognito;
  } catch {
    return false;
  }
}

// Event Listeners

chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.incognito) return;
  const event: BrowserEventRequest = {
    eventType: 'TAB_CREATED',
    url: tab.url || tab.pendingUrl,
    title: tab.title,
    tabId: tab.id!,
    windowId: tab.windowId,
    timestamp: Date.now()
  };
  await processEvent(event);
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return; // Main frame only
  
  const url = details.url;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) return;

  const incognito = await isIncognito(details.tabId);
  if (incognito) return;

  try {
    const tab = await chrome.tabs.get(details.tabId);
    const event: BrowserEventRequest = {
      eventType: 'NAVIGATION',
      url: url,
      title: tab.title,
      tabId: details.tabId,
      timestamp: Date.now(),
      // webNavigation.onCompleted doesn't give transitionType, but this is a rough approximation
    };
    await processEvent(event);
  } catch (e) {
    // Ignore if tab is already gone
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.incognito) return;

    const event: BrowserEventRequest = {
      eventType: 'TAB_ACTIVATED',
      url: tab.url,
      title: tab.title,
      tabId: activeInfo.tabId,
      windowId: activeInfo.windowId,
      timestamp: Date.now()
    };
    await processEvent(event);
  } catch {
    // Ignore
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // We can't check incognito here reliably since tab is gone, but we only have tabId anyway
  const event: BrowserEventRequest = {
    eventType: 'TAB_CLOSED',
    tabId: tabId,
    windowId: removeInfo.windowId,
    timestamp: Date.now()
  };
  await processEvent(event);
});

// Messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    chrome.storage.local.get(['sessionState', 'backendStatus', 'eventQueue']).then(data => {
      sendResponse({
        sessionState: data.sessionState,
        backendStatus: data.backendStatus,
        queueLength: (data.eventQueue || []).length
      });
    });
    return true; // keep channel open
  } else if (message.type === 'START_SESSION') {
    api.createSession(message.title).then(async (id) => {
      if (id) {
        const sessionState: SessionState = { sessionId: id, sessionTitle: message.title, isActive: true };
        await chrome.storage.local.set({ sessionState });
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    });
    return true;
  } else if (message.type === 'END_SESSION') {
    chrome.storage.local.get(['sessionState']).then(async data => {
      const sessionId = data.sessionState?.sessionId;
      if (sessionId) {
        const success = await api.endSession(sessionId);
        if (success) {
          await chrome.storage.local.set({ sessionState: { sessionId: null, sessionTitle: null, isActive: false } });
        } else {
          console.error(`Failed to end session ${sessionId}; preserving local session state`);
        }
        sendResponse({ success });
        return;
      }
      sendResponse({ success: true });
    });
    return true;
  }
});
