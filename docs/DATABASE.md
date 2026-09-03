# Trak — Database Schema

## Overview

Trak uses SQLite in WAL (Write-Ahead Logging) mode for concurrent read access. The database file is stored at `backend/data/trak.db`.

## Tables

### `browser_event`

Raw, immutable event log. Every browser action captured by the extension is stored exactly as received. This is the "source of truth" layer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PK, auto-increment | Unique event identifier |
| `event_type` | VARCHAR(50) | NOT NULL | TAB_CREATED, NAVIGATION, TAB_ACTIVATED, TAB_CLOSED |
| `url` | VARCHAR(2048) | | Page URL (null for TAB_CLOSED) |
| `title` | VARCHAR(1024) | | Page title |
| `tab_id` | INTEGER | NOT NULL | Chrome tab identifier |
| `window_id` | INTEGER | | Chrome window identifier |
| `transition_type` | VARCHAR(50) | | Chrome transition type (link, typed, etc.) |
| `referrer_url` | VARCHAR(2048) | | Previous page URL |
| `timestamp` | TIMESTAMP | NOT NULL | When the event occurred (from browser) |
| `session_id` | VARCHAR(36) | FK → research_session.id | Associated research session |
| `page_visit_id` | VARCHAR(36) | FK → page_visit.id | Associated page visit |
| `processed` | BOOLEAN | DEFAULT FALSE | Whether processing engine has analyzed this event |
| `created_at` | TIMESTAMP | NOT NULL | When the record was created in the database |

**Indexes:**
- `idx_event_session` on `session_id`
- `idx_event_timestamp` on `timestamp`
- `idx_event_tab` on `tab_id`
- `idx_event_processed` on `processed`
- `idx_event_dedup` on `(tab_id, url, timestamp)` — deduplication

### `research_session`

Groups related browser events into a coherent research session.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID |
| `title` | VARCHAR(500) | | User-defined or auto-generated title |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE, COMPLETED, ABANDONED |
| `start_time` | TIMESTAMP | NOT NULL | Session start time |
| `end_time` | TIMESTAMP | | Session end time (null while active) |
| `created_at` | TIMESTAMP | NOT NULL | Record creation time |
| `updated_at` | TIMESTAMP | NOT NULL | Last update time |

**Indexes:**
- `idx_session_status` on `status`
- `idx_session_start` on `start_time`

### `page_visit`

Aggregated view of a URL within a session. Multiple navigations to the same URL consolidate into one record.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID |
| `url` | VARCHAR(2048) | NOT NULL | Page URL |
| `domain` | VARCHAR(500) | | Extracted domain (e.g., docs.oracle.com) |
| `title` | VARCHAR(1024) | | Page title (latest) |
| `first_visited` | TIMESTAMP | NOT NULL | First visit time in this session |
| `last_visited` | TIMESTAMP | NOT NULL | Most recent visit time |
| `visit_count` | INTEGER | NOT NULL, DEFAULT 1 | Number of times visited in session |
| `duration_ms` | BIGINT | DEFAULT 0 | Estimated time spent (milliseconds) |
| `session_id` | VARCHAR(36) | FK → research_session.id, NOT NULL | Parent session |
| `created_at` | TIMESTAMP | NOT NULL | Record creation time |

**Indexes:**
- `idx_pagevisit_session` on `session_id`
- `idx_pagevisit_domain` on `domain`
- `idx_pagevisit_url_session` on `(url, session_id)` — uniqueness within session

### `search_query`

Extracted search queries from navigation events to known search engines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID |
| `query_text` | VARCHAR(1024) | NOT NULL | Extracted search terms |
| `engine` | VARCHAR(50) | NOT NULL | google, bing, duckduckgo, youtube, github, stackoverflow |
| `source_url` | VARCHAR(2048) | NOT NULL | Full search URL |
| `timestamp` | TIMESTAMP | NOT NULL | When the search was performed |
| `session_id` | VARCHAR(36) | FK → research_session.id | Parent session |
| `page_visit_id` | VARCHAR(36) | FK → page_visit.id | Associated page visit |
| `created_at` | TIMESTAMP | NOT NULL | Record creation time |

**Indexes:**
- `idx_search_session` on `session_id`
- `idx_search_timestamp` on `timestamp`

## Entity Relationships

```
research_session (1) ──── (N) browser_event
research_session (1) ──── (N) page_visit
research_session (1) ──── (N) search_query
page_visit       (1) ──── (N) browser_event
page_visit       (1) ──── (N) search_query
```

## SQLite Configuration

```properties
# WAL mode for concurrent reads
spring.jpa.properties.hibernate.connection.pragma.journal_mode=WAL

# Foreign keys enabled
spring.jpa.properties.hibernate.connection.pragma.foreign_keys=ON
```

## Migration Strategy

Schema is managed by Hibernate's `ddl-auto=update` during development. For production, Flyway or Liquibase migrations should be introduced.
