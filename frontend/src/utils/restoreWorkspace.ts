export interface RestorablePage {
  url: string;
  title: string | null;
  firstVisited: string;
  lastVisited: string;
}

export interface RestorePlan {
  urls: string[];
  focusUrl: string | null;
}

export function isRestorableUrl(url: string | null | undefined): boolean {
  if (url == null) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const timeOf = (value: string | null | undefined, fallback = 0): number => {
  if (!value) return fallback;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : fallback;
};

/**
 * Builds the deterministic tab-restoration plan for a session.
 *
 * Rules (no new research semantics):
 * - keep pages with a meaningful http(s) URL and a non-blank title
 *   (the same "meaningful research page" notion used by the resume point),
 * - drop chrome://, chrome-extension://, about: and blank/new-tab URLs,
 * - de-duplicate by exact URL (first occurrence wins),
 * - order by study order: ascending firstVisited (research order),
 * - the session's stopping-point page is opened last so it becomes the
 *   active/focused tab after restoration.
 */
export function buildRestorePlan(
  pages: RestorablePage[],
  focusUrl: string | null | undefined
): RestorePlan {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const sorted = [...pages].sort(
    (a, b) =>
      timeOf(a.firstVisited) - timeOf(b.firstVisited) ||
      timeOf(a.lastVisited) - timeOf(b.lastVisited) ||
      a.url.localeCompare(b.url)
  );

  for (const page of sorted) {
    if (!page.title || !page.title.trim()) continue;
    if (!isRestorableUrl(page.url)) continue;
    if (seen.has(page.url)) continue;
    seen.add(page.url);
    ordered.push(page.url);
  }

  const eligibleFocus = focusUrl && isRestorableUrl(focusUrl) ? focusUrl : null;
  if (eligibleFocus && !seen.has(eligibleFocus)) {
    ordered.push(eligibleFocus);
    seen.add(eligibleFocus);
  }

  if (eligibleFocus) {
    const focusIndex = ordered.indexOf(eligibleFocus);
    if (focusIndex >= 0 && focusIndex !== ordered.length - 1) {
      ordered.splice(focusIndex, 1);
      ordered.push(eligibleFocus);
    }
  }

  return { urls: ordered, focusUrl: eligibleFocus };
}