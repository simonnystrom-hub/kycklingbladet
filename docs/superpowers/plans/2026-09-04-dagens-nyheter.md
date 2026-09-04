# Dagens nyheter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each day’s paper is one Alarmindex lead plus two short hen-house notices, including backfill of old dates.

**Architecture:** Keep one `alarm` document per date. Claude picks two remaining headlines for hen-house fit, then writes short notices. Patch `notices` only; never overwrite the lead. Week leads and RSS stay lead-only.

**Tech Stack:** Next.js, Sanity, Claude Sonnet, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-dagens-nyheter-design.md`

## Global Constraints

- Public copy: **Dagens nyheter**, never laugh at the accident, do not call it satire in public UI.
- `_id` remains `alarm-{YYYY-MM-DD}`; pipeline never overwrites an existing lead.
- Notices: max two; unique `sourceHeadlineId`; not the lead.
- Humor score and week-lead cards: lead only.

---

### Task 1: Notice selection helpers

**Files:**
- Create: `src/lib/select/notice-picks.ts`
- Test: `src/lib/select/notice-picks.test.ts`

- [x] Pure functions `remainingHeadlines` and `sanitizePickedIds`
- [x] Tests for dropping the lead, duplicates, unknown ids, max two

### Task 2: Claude pick + short generate

**Files:**
- Create: `src/lib/generate/notice-prompt.ts`, `src/lib/generate/notices.ts`, `src/lib/generate/claude-notices.ts`
- Test: `src/lib/generate/notices.test.ts`, `src/lib/generate/notice-prompt.test.ts`

- [x] JSON `{headlineIds: string[]}` and `{headline, body}` validation
- [x] Prompts: hen-house lexicon, short notice, no expert, pick for comic fit not score

### Task 3: Patch notices + daily/backfill

**Files:**
- Create: `src/lib/sanity/fill-notices.ts`, `scripts/fill-notices.ts`, `.github/workflows/fill-notices.yml`
- Modify: `scripts/run-daily.ts`, `package.json`

- [x] `fillNoticesForDate(date)` idempotent if two notices exist
- [x] Daily fills notices after lead create/skip; failures log, do not unpublish the lead

### Task 4: Schema, types, UI, copy

**Files:**
- Modify: studio `schemaTypes/alarm.ts`, `src/lib/sanity/types.ts`, `queries.ts`, `nav.ts`, `copy.ts`, home + archive date pages
- Create: `src/components/IssueNotices.tsx`

- [x] Nav + section **Dagens nyheter**
- [x] Notices under the lead; archive index and RSS unchanged
