# Dagens nyheter: en huvudnyhet och två notiser

**Date:** 2026-09-04  
**Status:** Draft for review  
**Goal:** Each Kycklingbladet issue is a day’s paper: one lead story (highest Alarmindex) plus two short hen-house notices picked for comic fit, including backfill of existing dates.

---

## Locked decisions

- Public label **Dagens nummer** becomes **Dagens nyheter** (nav, footer, homepage section head).
- One Sanity `alarm` per date. `_id` stays `alarm-{YYYY-MM-DD}`. The pipeline still never overwrites an existing lead.
- **Lead** = today’s Alarmindex winner (unchanged: newspapers with the day’s highest `dailyScore`, then that paper’s highest `displayScore`). Full article: kicker, headline, body, expert box, source line, humor score.
- **Two notices** under the lead. Shorter than the lead. No expert box. Claude picks which remaining Alarmindex headlines of that date will work best in the hen-house — not the next-highest panic scores.
- Notices may come from any newspaper. They must not be the same headline as the lead or as each other (`headlineId`).
- **Huvudnyheter senaste veckan** still uses only the lead’s `humorScore`. Notices are never week-lead cards.
- Already published dates may receive two notices in a backfill. The existing lead is left untouched.

---

## Out of scope

- Three separate documents per day
- Rescoring or rewriting existing leads
- Notices in the week-lead strip
- Changing Alarmindex itself
- Human pick of the two notices

---

## Data

On `alarm`, add `notices`: an array of at most two objects, each:

| Field | Role |
|-------|------|
| `headline` | Kycklingbladet notice headline |
| `body` | Short notice text (one or two short paragraphs) |
| `sourceHeadline` | Original Alarmindex headline |
| `sourceNewspaper` | Newspaper name |
| `sourceNewspaperSlug` | Newspaper slug |
| `sourceAlarmindexUrl` | `https://alarmindex.com/dag/{date}/{slug}` |
| `sourceScore` | That headline’s `displayScore` |
| `sourceHeadlineId` | Alarmindex headline id (dedupe + debug) |

Studio: notices editable in an emergency. Not required on old documents until backfill.

---

## Daily job (new dates)

1. Stockholm date as today (or `FORCE_DATE`).
2. If no `alarm` for that date: current flow creates the lead (generate + publish). Then run notice fill for that date.
3. If the lead already exists: do not recreate it. If `notices` is missing or empty, run notice fill only (same as backfill for one day). Humor scoring of the lead stays as now (`scoreAlarmIfMissing`).

### Notice fill

1. Load that date’s published Alarmindex scored headlines (same query as today).
2. Drop the lead’s source (`headlineId` if stored; else match newspaper slug + original headline text).
3. If fewer than two remain, write as many notices as possible (one or zero). Do not invent headlines.
4. Send Claude the remaining headlines (id, paper, text, score). Ask for exactly two `headlineId`s (or fewer if the list is shorter) that will make the best hen-house notices. Same voice rules as the paper: craft of the rewrite, never laughing at the accident. Temperature low. JSON only.
5. For each chosen id, generate a **short** notice (headline + short body, no expert). Same hen-house lexicon as `kb-v4`. Distinct from the lead.
6. Patch `notices` on the existing `alarm`. Never patch lead fields.

Lead generation and notice generation stay separate Claude calls so the lead prompt does not change.

---

## Backfill

Script (same pattern as `score-humor`): every `alarm` with empty `notices`, oldest date first. For each date, notice fill. Skip dates where Alarmindex has no other headlines. Idempotent: skip if two notices already exist.

Runnable locally with `.env.local` and as a `workflow_dispatch` Action using the same secrets as daily.

---

## Site

- **Home:** section **Dagens nyheter**. Lead as today (date, kicker, full article). Under it, two notices: Kycklingbladet headline + short body + original-source line. Then prev/next day.
- **Archive index:** still one row per date (the lead).
- **`/arkiv/{date}`:** lead + that day’s notices.
- **RSS:** one item per date (the lead). Notices are on the issue page, not extra feed items.
- **Week leads:** unchanged query on leads with `humorScore`.

If notices are empty (not yet backfilled), the lead still publishes alone.

---

## Copy and selection tests

- Nav label and `TODAY_ISSUE_HEADING` → `Dagens nyheter`.
- Unit tests: winner unchanged; notice picker rejects the lead id and duplicate ids; array length 0–2.
- Prompt tests: notice JSON shape; selection prompt asks for hen-house fit, not score rank.

---

## Failure

- Lead publish succeeds and notice fill fails: keep the lead, log the error, fill later via backfill. The paper still exists.
- Claude returns a lead id or a duplicate: drop it and retry once; then take unique valid ids only.
- Missing Anthropic/Sanity write token: same fail-fast as daily today.
