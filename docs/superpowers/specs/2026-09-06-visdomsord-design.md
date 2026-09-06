# Daily hen wisdom (visdomsord) for Facebook

**Date:** 2026-09-06  
**Status:** Draft for review  
**Goal:** In Sanity Studio, generate and curate a pool of hen-voice wisdom quotes with optional cartoons. Each morning at 07:00 Europe/Stockholm, post one unused quote that has a cartoon to the Kycklingbladet Facebook Page. Nothing appears on kycklingbladet.com.

---

## Locked decisions

- **Surface:** Facebook only. No homepage box, no archive page, no RSS item, no nav.
- **Pool:** Sanity documents `_type == "visdomsord"` in the Kycklingbladet dataset. One document per quote. Not a settings-array, not a git file, not HolyParadox documents at runtime.
- **HolyParadox:** prompt flavour only (paradoxical core, lighter, farmyard). No live read of HolyParadox Sanity.
- **Studio:** generate up to 100 unused quotes per click; delete one or many; rewrite one or many (clears the image); draw cartoon one or many for rows without an image.
- **Facebook time:** every day 07:00 Europe/Stockholm, separate GitHub Actions workflow (not the noon/14:00 daily issue job).
- **Pick:** oldest unused document (`usedDate` empty) that **has** an image. If none, log and exit 0.
- **One per calendar day:** if any `visdomsord` already has `usedDate` equal to Stockholm today, skip.
- **Caption:** photo post, no URL comment (there is no article URL).
- **Idempotency:** set `usedDate` only after Facebook returns shared. Re-running the same morning no-ops.

---

## Out of scope

- Showing visdomsord on the website
- Auto-drawing 100 images at generate time
- Auto-generating more quotes when the queue is empty (Studio refill is manual)
- Facebook comments, threads, or auto-replies
- Changing larm / Extra Extra Facebook format
- Speed Insights or analytics for this feature

---

## Document

Schema in `kycklingbladet-studio`, type `visdomsord`, title **Visdomsord**.

| Field | Role |
| --- | --- |
| `quote` | One or two sentences. Required. |
| `henName` | Fictional hen/rooster name. Required. |
| `image` | Sanity image, empty until Rita. |
| `imageCaption` | Who/where/what line for the cartoon, same idea as larm. |
| `imageShotType` | `intervju` \| `incident` \| `annat` |
| `imagePrompt` | Scene prompt stored after draw |
| `usedDate` | `YYYY-MM-DD` or empty. Set by the 07:00 job only. Read-only in Studio. |

Sanity default `_id` is fine. Do not key ids on the quote text.

**Duplicate rule:** before create or rewrite, normalize existing `quote` values (trim, lowercase, collapse whitespace, strip wrapping quotes and trailing `!?.`). If the new quote normalizes to an existing one, skip that row. Near-duplicates that only differ by punctuation or wrapping quotes count as the same. **Hen names may repeat.** At most one document may have a given `usedDate`.

---

## Studio

Structure: top-level **Visdomsord** with:

1. **Kö** — custom component (same secret/site pattern as Extra Extra: `SANITY_STUDIO_SITE_URL` + `SANITY_STUDIO_EXTRA_EXTRA_SECRET` / existing extra-extra header). Actions:
   - **Generera 100** → `POST /api/visdomsord/generate` `{count: 100}`
   - Checkbox select on the unused list
   - **Skriv om** selected → `POST /api/visdomsord/rewrite` `{ids: [...]}`
   - **Rita** selected (only those without `image.asset`) → `POST /api/visdomsord/draw` `{ids: [...]}` (sequential or small batches; one Gemini failure does not abort the rest)
   - **Radera** selected → Studio client `delete` (no Next API required)
2. **Alla** — ordinary document list, unused without image first (filter/order in structure), then unused with image, then used by `usedDate` desc.

Single-document pane: same rewrite / rita / delete for that id.

Rewrite **unsets** `image`, `imageCaption`, `imageShotType`, `imagePrompt`. Used rows (`usedDate` set) are not rewritten or redrawn by the bulk tools; delete remains allowed.

Generate prompt (Claude, same model env as daily): Swedish hen lexicon, light HolyParadox-style insight, spoken as the hen, not a proverb poster. Return JSON array `{quote, henName}[]`. Filter duplicates server-side; create only the survivors (may be fewer than 100). Do not call Gemini here.

Draw: build an `ExtraImageBrief` from quote + henName (shot type `annat` unless Claude also returns a brief), `EXTRA_IMAGE_STYLE`, `attachLeadImage`-style upload onto that document. `maxDuration` 60; Studio may call draw per id.

Auth: same `x-extra-extra-secret` as Extra Extra routes. CORS same as those routes.

---

## Facebook caption

Graph `POST /{page-id}/photos` with the public Sanity image URL. **No** `/{post-id}/comments` (no site URL).

Message, blank line between blocks:

```
KUCKELIKUUUU!

"quote"

henName
```

`quote` is wrapped in ASCII `"..."` even if the stored string already has quotes (do not double-wrap: if it already starts and ends with `"` or `“”`, use as-is). `henName` is a line of its own, no em dash required. Do not append `Se länk i kommentar`.

Extend `shareToFacebook` (or a sibling `shareWisdomToFacebook`) so `articleUrl` is optional; omit the comment when absent. Photo-only still: no image → skip, leave `usedDate` empty.

---

## 07:00 job

New workflow `.github/workflows/visdomsord.yml`:

- `cron: "0 7 * * *"` with `timezone: Europe/Stockholm`
- `workflow_dispatch`
- concurrency group `visdomsord` (not `daily-issue`)
- env: Sanity write + Facebook (no Anthropic, no Gemini — image already on the document)

Script `scripts/run-visdomsord.ts`:

1. `today = stockholmToday()`
2. If any visdomsord has `usedDate == today` → log hoppar över, exit 0
3. Fetch oldest unused with `defined(image.asset)`, order `_createdAt` asc
4. None → log tom kö, exit 0
5. `shareToFacebook` / wisdom helper with image URL + caption
6. If `shared` → patch `usedDate: today`. If skipped/failed → do not patch; log; exit 0 for skip (missing token), exit 1 for Graph failure so it is visible

Do not generate quotes or draw in this job.

---

## Code shape

- Studio: `schemaTypes/visdomsord.ts`, structure item, `actions/VisdomsordQueue.tsx` (or equivalent)
- Site: `src/app/api/visdomsord/generate/route.ts`, `rewrite/route.ts`, `draw/route.ts`
- `src/lib/visdomsord/normalize.ts` — duplicate key
- `src/lib/visdomsord/message.ts` — Facebook caption helper + tests
- `src/lib/facebook/share.ts` — optional comment
- `scripts/run-visdomsord.ts` + workflow
- Tests for normalize, caption wrapping, pick-oldest-with-image, skip-if-today-used
- README: workflow + secrets already listed for Facebook/Sanity; mention 07:00 visdomsord

Sajten’s public pages, `layout`, RSS, and daily issue selection stay unchanged.

---

## Errors

| Case | Behaviour |
| --- | --- |
| Generate returns dups / parse fail | Skip bad rows; create the rest; Swedish error if zero created |
| Rewrite hits a duplicate | Leave that id unchanged; continue others |
| Draw fails | Leave image empty; continue others; show `imageError` in Studio |
| 07:00 empty queue | Exit 0 |
| 07:00 already posted today | Exit 0 |
| Facebook skip (no token / no image) | No `usedDate`; exit 0 if no token, else log |
| Facebook Graph fail | No `usedDate`; exit 1 |
| Used row in rewrite/draw bulk | Skip that id |

---

## Self-review

- No website surface (locked A).
- Duplicate rule is punctuation-normalized, not Claude-similarity.
- Draw is Studio-only; cron never calls Gemini.
- Facebook has no article comment because there is no page.
- Queue refill is manual (100 button), not an implicit second cron.
