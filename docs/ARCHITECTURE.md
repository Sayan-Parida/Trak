# ResearchMind — Architecture

## Overview

ResearchMind is a local-first application that captures browser research activity and visualizes it as an interactive mind map. The system is composed of three main components that communicate over HTTP on localhost.

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Chrome Browser                     │
│  ┌───────────────────────────────────────────────┐  │
│  │          Chrome Extension (Manifest V3)        │  │
│  │                                                │  │
│  │  background.ts ── Service Worker               │  │
│  │    ├── chrome.tabs.onCreated                   │  │
│  │    ├── chrome.webNavigation.onCompleted         │  │
│  │    ├── chrome.tabs.onActivated                 │  │
│  │    └── chrome.tabs.onRemoved                   │  │
│  │                                                │  │
│  │  popup.html ── Session control UI              │  │
│  │  api.ts ── HTTP client + event queue           │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │ HTTP POST (JSON)                  │
└──────────────────┼──────────────────────────────────┘
                   │ localhost:8080
┌──────────────────┼──────────────────────────────────┐
│    Spring Boot Application (Backend)                 │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │            API Layer (Controllers)             │  │
│  │  EventController  SessionController  Health    │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │            Service Layer                       │  │
│  │  EventIngestionService                        │  │
│  │  ResearchSessionService                       │  │
│  │  PageVisitService                             │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │         Processing Engine                      │  │
│  │  SearchDetector ── URL → search query          │  │
│  │  SessionDetector ── Events → sessions          │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │         Repository Layer (Spring Data JPA)     │  │
│  │  BrowserEventRepository                       │  │
│  │  ResearchSessionRepository                    │  │
│  │  PageVisitRepository                          │  │
│  │  SearchQueryRepository                        │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │                                   │
└──────────────────┼──────────────────────────────────┘
                   │
┌──────────────────┼──────────────────────────────────┐
│  SQLite          │                                   │
│  ┌───────────────▼───────────────────────────────┐  │
│  │  researchmind.db                              │  │
│  │   browser_event | research_session            │  │
│  │   page_visit    | search_query                │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  React Dashboard (localhost:5173)                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  SessionList ── Session overview & selection   │  │
│  │  Timeline ── Chronological event view          │  │
│  │  MindMap ── Interactive 2D graph (React Flow)  │  │
│  │  NodeDetail ── Click-to-inspect metadata       │  │
│  └───────────────┬───────────────────────────────┘  │
│                  │ REST API calls                    │
│                  │ localhost:8080                     │
└──────────────────┘──────────────────────────────────┘
```

## Data Flow

### Event Capture Flow

1. User navigates to a page in Chrome
2. Extension's service worker receives `chrome.webNavigation.onCompleted`
3. Service worker constructs a `BrowserEventRequest` with URL, title, tab ID, timestamp
4. Event is POSTed to `localhost:8080/api/events`
5. If backend is unreachable, event is queued in `chrome.storage.local`
6. Backend validates event, checks for duplicates
7. `SearchDetector` checks if URL matches a known search engine → creates `SearchQuery`
8. `PageVisitService` creates or updates the `PageVisit` for this URL+session
9. Event and derived entities are persisted to SQLite

### Research Session Flow

1. User clicks "Start Session" in extension popup (or creates via dashboard)
2. Extension sends `POST /api/sessions` with optional title
3. Backend creates a `ResearchSession` with status `ACTIVE`
4. Subsequent browser events include the `sessionId`
5. User clicks "End Session" → `PUT /api/sessions/{id}` with status `COMPLETED`

### Mind Map Generation Flow

1. Frontend requests `GET /api/sessions/{id}/mindmap`
2. Backend retrieves all `PageVisit` and `SearchQuery` records for the session
3. Backend retrieves raw `BrowserEvent` records for relationship detection
4. Relationships are derived from:
   - Temporal ordering (event timestamps)
   - Tab lineage (opener tab → opened tab)
   - Search → result (navigation after search)
   - Referrer chain (transition types)
5. Response contains nodes (pages, searches) and edges (relationships)
6. React Flow renders the graph with interactive zoom/pan/click

## Key Design Decisions

### Why HTTP REST, not WebSocket?

For Milestone 1, HTTP POST is sufficient. Browser events are relatively low-frequency (a few per minute during active research). The extension POSTs each event individually. The dashboard polls or refreshes on user action.

WebSocket would be useful for real-time dashboard updates (seeing new events appear live) and can be added in a later phase.

### Why SQLite, not PostgreSQL/MySQL?

- Zero configuration: no separate database server to install
- Single file: easy backup, easy to inspect
- Sufficient performance for a single-user local application
- WAL mode enables concurrent reads while writing
- Spring Data JPA abstracts the database layer, so migration to another DB is straightforward later

### Why manual sessions first?

Automatic session detection (detecting when a user switches research topics) is a hard problem. Starting with manual sessions ("Start/Stop Research") provides clean session boundaries and lets us focus on event capture and visualization first.

Automatic detection (idle timeout, topic change) will be added in Phase 4+.

### Why separate raw events from derived data?

The `browser_event` table stores exactly what happened. The `page_visit`, `search_query`, and future `topic`, `relationship` tables store derived intelligence. This separation means:

1. Processing logic can evolve without losing raw data
2. We can reprocess events with improved algorithms
3. Debugging is easier — you can always check the raw event stream
4. Privacy review is simpler — raw events are a clear audit trail

### Extension permissions

The extension requests minimal permissions:

- `tabs` — Access tab metadata (URL, title)
- `webNavigation` — Get navigation events with transition types
- `storage` — Queue events when backend is offline
- `host_permissions: http://localhost:8080/*` — Communicate with backend

NOT requested: `<all_urls>`, `cookies`, `history`, `bookmarks`, `clipboardRead`, `activeTab` (content script injection).

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Backend not running | Extension queues events locally, shows "disconnected" status |
| Backend restarts | Extension detects via health check, flushes queued events |
| Duplicate events | Backend deduplicates by (tabId, url, timestamp) |
| Malformed URL | Stored as-is, search detection skipped |
| Tab disappears before metadata read | Event stored with available data, missing fields null |
| Database write fails | Returns 500, extension retries with backoff |
| Session not found | Returns 404, extension creates new session |
| Frontend can't reach backend | Shows error state with retry button |
