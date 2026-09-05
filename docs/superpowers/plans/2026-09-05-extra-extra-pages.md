# Extra Extra pages Implementation Plan

> **For agentic workers:** Execute this plan task-by-task (inline is fine). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canonical Extra Extra pages at `/extra-extra/{date}`, teasers on home and archive day, mixed archive rows, RSS permalinks.

**Architecture:** Pure helpers for path, first paragraph, archive mix, and page guard. `IssueExtra` stays the full flash. New `IssueExtraTeaser` wraps the teaser in one link. Archive query fetches extras + alarms, mixes, then paginates with existing `archivePageWindow`.

**Tech Stack:** Next.js App Router, Vitest, existing Sanity fetches, `IssueExtra` layout C.

**Spec:** `docs/superpowers/specs/2026-09-05-extra-extra-pages-design.md`

## Global Constraints

- Canonical URL `/extra-extra/{date}` (`YYYY-MM-DD`). Invalid date or `hasExtraExtra` false → 404.
- Teaser: stamp EXTRA EXTRA, headline, first `\n\n` paragraph, cartoon if `extraIllustration` non-null. Whole teaser is one link. `id="extra-extra"` on the teaser.
- Archive mixed list, 7 per page. Same date: Extra Extra row before lead. Extra row stamp **EXTRA EXTRA**, href `/extra-extra/{date}`.
- RSS extra link/guid `{siteUrl}/extra-extra/{date}`. Alarm stays `/arkiv/{date}`.
- Studio, daily job, week-lead strip, site nav: unchanged.
- Never scrape alarmindex.com. Do not print secrets.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/copy.ts` | `EXTRA_EXTRA_STAMP = 'EXTRA EXTRA'` |
| `src/lib/extra-extra/path.ts` | `extraExtraPath(date)` |
| `src/lib/extra-extra/first-paragraph.ts` | `firstExtraParagraph(body)` |
| `src/lib/extra-extra/page-guard.ts` | `canShowExtraExtraPage(date, extra)` |
| `src/lib/archive-items.ts` | `mixArchiveItems` → `ArchiveItem[]` |
| `src/lib/sanity/types.ts` | `ArchiveItem` |
| `src/lib/sanity/queries.ts` | `getExtraArchive`, `getArchivePage` |
| `src/lib/rss.ts` | Extra permalink via `path` |
| `src/components/IssueExtraTeaser.tsx` | Home/archive-day teaser |
| `src/components/IssueExtra.tsx` | Full flash only; drop `id` (moves to teaser) |
| `src/components/ArchiveList.tsx` | `item.href` |
| `src/app/extra-extra/[date]/page.tsx` | Full page + metadata |
| `src/app/page.tsx` | Teaser |
| `src/app/arkiv/[date]/page.tsx` | Teaser |
| `src/app/arkiv/page.tsx` | `getArchivePage` |

---

### Task 1: Path, paragraph, mix, RSS, page guard

Tests then implementation as in the spec’s test list for mix/RSS/404 guard.

Commit: `Give Extra Extra a canonical path, mixed archive rows, and RSS permalinks.`

### Task 2: Teaser, dedicated page, wire home/archive

`IssueExtraTeaser`; `/extra-extra/[date]`; home/archive day use teaser; archive list uses `href`. Update `issue-order.test.ts` to `IssueExtraTeaser`.

Commit: `Show Extra Extra as its own page and a teaser everywhere else.`
