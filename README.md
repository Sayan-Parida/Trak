# Trak

Trak is a local-first research activity tracker. Its Chrome extension captures browser activity during manually started research sessions, a Spring Boot API stores and processes the events, and a React dashboard presents the resulting timeline, visited pages, searches, and interactive Research Map.

The application is named `Trak`.

## Why Trak?

Browser history tells you where you went. Trak aims to tell you how you got there — preserving the path between searches, pages, and research sessions.

Research often moves through multiple searches, tabs, and sources before reaching a useful conclusion. Trak captures that activity within manually started sessions so the route through the research can be revisited, rather than leaving only a list of disconnected pages behind.

## Features

- Start and end titled research sessions from the Chrome extension.
- Capture non-incognito tab creation, navigation, activation, and closure events.
- Queue events locally when the backend is unavailable and retry them when connectivity returns.
- Deduplicate incoming events by tab, URL, and timestamp.
- Detect searches from Google, Bing, DuckDuckGo, YouTube, GitHub, and Stack Overflow URLs.
- Aggregate repeated visits to the same URL within a session.
- Estimate time spent on pages from browser activity.
- Explore each session through:
	- an interactive deterministic Research Map;
	- a chronological timeline;
	- an aggregated pages view with domains, visit counts, and estimated time.
- Store data in a single SQLite database with WAL mode and foreign-key support.

## Roadmap

### Current

- Manual research sessions
- Browser event capture
- Search detection
- Page aggregation
- Timeline
- Pages view
- Deterministic research graph and Research Map
- Deterministic research retrieval at `/api/research/search?q=...`
- Local SQLite persistence

### Planned

The following features are planned and are **not currently implemented**:

- Automatic topic extraction
- Semantic relationships between research concepts
- Intelligent research clustering
- Better automatic mind-map generation
- "Why did I open this?"
- Research reconstruction
- "Resume Research"
- Research-gap detection
- Natural-language querying of previous research
- Optional local LLM integration

## Architecture

Trak is composed of three local components:

```text
Chrome Extension
			 |
			 | browser events
			 v
Spring Boot API (localhost:8080)
			 |
			 +------> SQLite (backend/data/trak.db)
			 |
			 | REST API
			 v
React Dashboard (localhost:5173)
```

The Chrome extension sends browser events to the Spring Boot API. The API validates, deduplicates, and derives page/search data before persisting it to SQLite. The React dashboard communicates with the Spring Boot API over REST; it does not connect directly to SQLite.

### Backend

The backend uses Spring Boot, Spring Web, Spring Data JPA, Bean Validation, and SQLite. `EventIngestionService` persists raw browser events and coordinates derived page visits and search queries. `SearchDetector` extracts queries from supported search-engine URLs, while `PageVisitService` aggregates visits and calculates durations.

Mind-map data currently represents page and search nodes with relationships created from search-to-page activity within the implemented time window. Sessions are manually controlled; automatic topic or session detection is not implemented.

### Frontend

The React and TypeScript dashboard uses Vite, Tailwind CSS, React Flow, and Dagre. It polls session and timeline data and loads the selected session's mind map, timeline, or pages view through the backend API.

### Browser extension

The Manifest V3 extension uses a service worker to observe Chrome tab and main-frame navigation events. It stores session state, backend status, and a bounded queue of up to 1,000 failed events in `chrome.storage.local`. It communicates only with the local backend at `http://localhost:8080`.

For more detail, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DATABASE.md](docs/DATABASE.md).

## Project Structure

```text
.
├── backend/
│   ├── pom.xml
│   ├── data/                         SQLite database directory
│   └── src/
│       ├── main/java/com/trak/
│       │   ├── api/                  REST controllers, DTOs, and mappers
│       │   ├── config/               Database and web configuration
│       │   ├── domain/               JPA models and repositories
│       │   ├── processing/           Search and session processing
│       │   └── service/              Ingestion and session services
│       └── test/                     Backend tests
├── extension/
│   ├── manifest.json                 Chrome Manifest V3 manifest
│   └── src/                          Service worker, popup, API, and types
├── frontend/
│   ├── src/
│   │   ├── api/                      Backend client
│   │   ├── components/               Session, timeline, mind-map, and detail views
│   │   └── types/                    Shared frontend types
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   └── DATABASE.md
└── README.md
```

## Requirements

- Java 17
- Maven
- Node.js and npm
- Google Chrome

## Getting Started

### 1. Start the backend

From the repository root:

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`. The SQLite database is created at `backend/data/trak.db` when the backend is run from the `backend` directory.

Check that the service is available:

```bash
curl http://localhost:8080/api/health
```

### 2. Start the dashboard

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome. The Vite development server proxies `/api` requests to the backend.

### 3. Build and load the extension

In a third terminal:

```bash
cd extension
npm install
npm run build
```

Then load the generated `extension/dist` directory in Chrome:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the `extension/dist` directory.

Use the extension popup to start a titled session. Browse normally, then end the session from the popup and open the dashboard to inspect it.

## REST API

The backend exposes the following endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check backend health |
| `POST` | `/api/events` | Ingest one browser event |
| `POST` | `/api/events/batch` | Ingest a batch of browser events |
| `POST` | `/api/sessions` | Create a session |
| `GET` | `/api/sessions` | List sessions, newest first |
| `GET` | `/api/sessions/{id}` | Get one session |
| `PUT` | `/api/sessions/{id}` | Update session title or status |
| `GET` | `/api/sessions/{id}/timeline` | Get chronological activity |
| `GET` | `/api/sessions/{id}/pages` | Get aggregated page visits |
| `GET` | `/api/sessions/{id}/searches` | Get detected searches |
| `GET` | `/api/sessions/{id}/mindmap` | Get mind-map nodes and edges |

## Data Model

SQLite contains four main tables:

- `research_session` stores manually controlled session boundaries and status.
- `browser_event` stores the raw captured event stream.
- `page_visit` stores URL visits aggregated within a session.
- `search_query` stores searches detected from supported search-engine URLs.

The schema is managed during development by Hibernate with `ddl-auto=update`; no Flyway or Liquibase migrations are currently included.

## Testing

Run the backend test suite with:

```bash
cd backend
mvn test
```

The tests cover session controller behavior, search detection, event ingestion, derived page/search data, and duplicate handling.

## Privacy and Permissions

The extension ignores incognito tabs for tab creation, navigation, and activation events, and ignores Chrome-internal pages. Tab closure events cannot reliably determine whether the removed tab was incognito. It requests `tabs`, `webNavigation`, `storage`, and `alarms` permissions, plus host access to `http://localhost:8080/*`. It does not request broad `<all_urls>` access, cookies, history, bookmarks, clipboard access, or content-script injection permissions.
