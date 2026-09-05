# Dagens nummer: illustration and EXTRA EXTRA first

**Date:** 2026-09-05  
**Status:** Draft for review  
**Goal:** Put EXTRA EXTRA above today’s lead on the site. Give the lead (not notices) the same hen cartoon as EXTRA EXTRA: locked Berglin/Larson style, signature `Kycklingbladet.com`, newspaper caption, layout C, optional if Gemini fails. Daily pipeline draws going forward. Studio can change shot type and redraw. EXTRA EXTRA and the lead stay independent.

This extends `docs/superpowers/specs/2026-09-05-extra-extra-image-design.md`. Where that spec listed “images on the lead” as out of scope, this spec replaces that line.

---

## Locked decisions

- **Order on the site:** week-lead strip (unchanged), then EXTRA EXTRA if present, then “Dagens nyheter” (date, lead, notices, nav). Archive `/arkiv/{date}`: EXTRA EXTRA first if that date has one, then the lead, then notices.
- **Who gets a drawing:** only the lead (`alarm`). Notices, week-lead cards, and RSS stay text-only.
- **Same cartoon rules as EXTRA EXTRA:** hens/roosters only, no humans, monochrome Berglin/Larson ink, layout C, caption who/where/what under the drawing, never burned in except the locked corner signature `Kycklingbladet.com`. Never sign Larson, Berglin, Far Side, or any person/studio name.
- **How it is created:** Claude proposes shot type, caption, and English scene with the lead text. Gemini draws with the shared `EXTRA_IMAGE_STYLE`. Editor may change type and regenerate the image; lead copy does not change on redraw.
- **Daily job:** after a **new** alarm is created, best-effort draw and attach. If Gemini fails, the alarm still publishes without an image. If today’s alarm already exists, skip create **and** skip drawing (same skip as today).
- **EXTRA EXTRA does not create or refresh the lead.** Pasting a URL and publishing an extra never writes `alarm`.
- **Forward only.** Do not backfill the archive. A one-off rewrite of Stockholm-today’s existing lead (text + cartoon) is an **operator script after ship**, not a product trigger and not tied to EXTRA EXTRA.
- **Studio:** no new “skapa dagens nummer” pane. On the published alarm document: show drawing, shot select, **Generera om bild**. Image fields readOnly. Expert box unchanged.
- Failed Gemini must not fail the daily job, rewrite, or redraw HTTP call (200 + `imageError`, document kept).

---

## Out of scope

- Illustrations on notices or week-lead teasers
- Colour, style variation, humans, or extra in-image text beyond `Kycklingbladet.com`
- Drawings in RSS
- Auto-generating the lead when creating EXTRA EXTRA
- Regenerating every historical alarm
- Scraping Alarmindex for photos
- Changing EXTRA EXTRA one-per-day, scrape, or publish-without-image rules

---

## Architecture

```
Daily (new alarm only):
  Alarmindex winner → Claude lead (+ image brief) → Sanity create → Gemini → upload asset or omit

Studio redraw (existing alarm):
  POST site API with secret + document id + optional shotType
  → Gemini with locked style → patch image fields (text fields untouched)

Site:
  GROQ image.asset->url + imageCaption
  extraIllustration / leadIllustration: both url and caption or null
  IssueExtra before AlarmArticle
  AlarmArticle layout C + expert box under body + source
```

Shared with EXTRA EXTRA: `EXTRA_IMAGE_STYLE`, `buildGeminiImagePrompt`, `drawExtraImage`, `generateExtraJpeg`, shot types, caption rules, `cdn.sanity.io` remote pattern, `GEMINI_API_KEY`.

Not shared: document type, create path, Studio pane. Extra stays `extraExtra`. Lead stays `alarm`.

---

## Data

On `alarm`, same optional fields as `extraExtra`:

| Field | Role |
|-------|------|
| `image` | Sanity image asset |
| `imageCaption` | Swedish newspaper caption |
| `imageShotType` | `intervju` / `incident` / `annat` |
| `imagePrompt` | Hidden. Scene sent to Gemini |

`hasExtraExtra` unchanged. An alarm remains valid without an image.

Claude `GeneratedAlarm` gains optional `imageBrief` (`ExtraImageBrief | null`), same validation as EXTRA EXTRA. Missing or invalid brief → publish text, no draw.

Prompt version for the lead bumps when the system prompt asks for the image JSON fields.

---

## Site

Home (`src/app/page.tsx`):

1. `WeekLeads` (current `sm:order` behaviour)
2. `IssueExtra` for Stockholm today (if any), **outside** and **above** the “Dagens nyheter” heading
3. Section “Dagens nyheter”: date, `AlarmArticle`, notices, nav

If there is no alarm yet: EXTRA EXTRA still above the empty state.

Archive: `IssueExtra` then `AlarmArticle` then notices.

`AlarmArticle` layout C (same grid as `IssueExtra`):

- Phone: kicker → headline → figure+caption → body → expert box → source
- Desktop: kicker+headline full width; body left, drawing+caption right; expert box and source in the text column under the body
- No illustration → current text-only tree (no extra grid, no empty frame)

Query `alarm` with `"imageUrl": image.asset->url` and `imageCaption`. Helper `leadIllustration(alarm)` returns `{url, caption}` only when both are non-empty strings (same contract as `extraIllustration`).

---

## Daily job

`scripts/run-daily.ts` after successful `publishAlarm` `'created'`:

1. Draw from `generated.imageBrief` via `drawExtraImage`.
2. If JPEG bytes exist, upload `lead-{date}.jpg` and patch the new alarm with image fields.
3. If draw returns null, log the error and continue to humor score + notices.

Existing-alarm skip path: no create, no image patch.

`publishAlarm` create payload may omit image keys. Upload is a follow-up patch so a Gemini delay cannot block the create, and a failed upload cannot roll back the text.

---

## API (Studio redraw)

`POST /api/alarm/preview-image`

- Same `EXTRA_EXTRA_SECRET` and CORS as extra-extra routes.
- Body: `{id, shotType?}` where `id` is the published alarm `_id`.
- Loads headline/body/caption/prompt from Sanity (not from Studio-edited JSON as source of truth for text).
- Builds brief from stored prompt + caption + shot (override if valid).
- Missing brief → 200 `{image: null, imageError: 'Saknar bildunderlag'}` and no patch.
- On success: upload, patch image fields, return `{image, imageError, imageCaption, imageShotType}` (and a data-URL payload like extra preview so Studio can show it).
- Gemini fail → 200, no patch, `imageError` set, previous asset left in place (do not wipe a good drawing on a failed redraw).
- `maxDuration = 60`. Quota sleeps stay the short EXTRA EXTRA values.

Do not add alarm create/preview-from-URL. The daily job remains the only creator.

---

## Studio

`schemaTypes/alarm.ts`: image fields as on `extraExtra` (Teckning, Bildtext visible readOnly; shot/prompt hidden readOnly).

On the alarm document, a custom input on `image`: current drawing, shot `<select>`, **Generera om bild**. Disabled while busy. Does not rewrite kicker, headline, body, or expert box.

Published extras: still no generate-on-document; extras are replaced by delete + Skapa dagens.

---

## One-off today (operator, not product)

After the pipeline exists, run **once** against Stockholm today’s existing `alarm`:

- Rewrite text from `sourceHeadline` / `sourceNewspaper` (same as `rewriteLead`).
- Draw and patch image fields.
- Unset `humorScore` so it can be scored again.
- Leave `notices` as they are.
- Do not loop the archive. Do not hook this to EXTRA EXTRA.

A dedicated script (e.g. `scripts/refresh-today-lead.ts`) is enough. It is not part of `run-daily` skip path and not part of Extra Extra publish.

---

## Env

Unchanged: `GEMINI_API_KEY` and optional `GEMINI_IMAGE_MODEL` on the Next app only. Daily job and the one-off script run in the site repo with the write token. Studio never talks to Google.

---

## Errors

| Case | Behaviour |
|------|-----------|
| Daily Gemini fail | Alarm created, no image, job continues |
| Daily alarm already exists | Skip create and skip draw |
| Studio redraw Gemini fail | 200 + error, previous image kept, text unchanged |
| Studio redraw missing brief | 200 + `Saknar bildunderlag`, no patch |
| Extra Extra preview/publish | Unchanged; never writes `alarm` |
| Bad alarm id | 400 |

---

## Tests

No live Google in CI.

- Home/archive render order: Extra before lead heading / before `AlarmArticle`
- `leadIllustration` requires url and caption; empty → null
- `AlarmArticle` without illustration has no figure
- `validateGeneratedAlarm` accepts optional valid brief and rejects partial brief the same way extra does
- `publishAlarm` without asset omits image keys
- Daily created path calls draw; skip-existing path does not
- Redraw route: auth, 200 on Gemini fail without clearing a prior image
- EXTRA EXTRA publish/preview tests still never touch `alarm`
- Style lock still forbids artist-name signatures and requires `Kycklingbladet.com`

---

## Success

A reader opening the site sees EXTRA EXTRA (if any) above today’s lead. Today’s lead has a hen cartoon in the locked style with a Kycklingbladet.com corner signature, or no frame if Gemini failed. Creating an EXTRA EXTRA does not spawn or rewrite the lead. New days get a drawing from the daily job. An editor can redraw the lead in Studio. Old archive issues stay as they were until a human chooses otherwise.
