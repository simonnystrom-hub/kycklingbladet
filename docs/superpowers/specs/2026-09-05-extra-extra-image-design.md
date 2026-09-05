# EXTRA EXTRA illustration

**Date:** 2026-09-05  
**Status:** Draft for review  
**Goal:** When creating an EXTRA EXTRA in Studio, optionally generate a black-and-white hen-house cartoon (Berglin / Larson), with a newspaper caption, and show it on the site in a layout that works on phone and desktop.

This builds on EXTRA EXTRA as its **own** Sanity document (`extraExtra`), not a field on `alarm`. Text scrape, flash rewrite, one-per-Stockholm-day, and publish-without-replace stay as they are now.

---

## Locked decisions

- Figures are **hens and roosters only**. No humans, no human hands, no photorealistic faces.
- Visual style is **always the same**: simple black-and-white / grayscale ink cartoon, Berglin and Larson. Flat, few details. Not a press photo, not a detailed painting.
- **No text in the image** (no signs, speech bubbles, logos, captions burned in). The caption sits under the drawing.
- Caption is a **newspaper image line**: who, where, what. Example: `Tuppen Gösta vid luckan i går kväll.` Not a Far Side one-liner.
- Claude **proposes** a shot type (interview, incident, other). The editor may change type and **regenerate the image**; the flash text stays.
- **Förhandsgranska** produces text and tries to produce an image. The editor may publish **without** an image.
- Layout **C**: on a phone, stamp → headline → drawing → caption → body → source line. On desktop, stamp and headline full width; body left, drawing + caption right. No empty frame when there is no image.
- Image generation uses **Google Gemini** with the same kind of key as HolyParadox (`GEMINI_API_KEY`, default model `gemini-3-pro-image`). The key is configured in Kycklingbladet env (local and Vercel). It is not read from the HolyParadox repo at runtime.
- The published drawing is stored on the `extraExtra` document in Sanity. Archive keeps it. RSS stays text-only for this change.
- Failed image generation must not block publishing the flash.

---

## Out of scope

- Images on the lead, notices, or week-lead cards
- Colour illustrations or style variation per story
- Text inside the drawing
- Humans in the drawing
- Regenerating images on already published documents from the Publicerade list
- Putting the drawing in RSS
- Sharing `GEMINI_API_KEY` by linking the two git repos
- Scraping Alarmindex or article body images

---

## Architecture

1. Studio **Förhandsgranska** → existing scrape + Claude flash, plus Claude image prompt, caption, and proposed shot type.
2. Next.js calls Gemini. JPEG (or PNG) comes back as bytes. Preview returns the flash plus image (data URL or short-lived payload) so Studio can show it before publish.
3. Studio **Generera om bild** calls a dedicated preview-image route with the current flash, caption context, and selected shot type. Flash fields are not rewritten.
4. **Publicera** writes the `extraExtra` document as today. If a preview image exists, upload it as a Sanity image asset and set caption / shot type / prompt. If not, omit image fields.
5. Site queries the image with the extra and renders layout C. Missing image → current text-only Extra Extra.

---

## Data

On `extraExtra`, optional fields:

| Field | Role |
|-------|------|
| `image` | Sanity image asset |
| `imageCaption` | Swedish newspaper caption |
| `imageShotType` | `intervju` / `incident` / `annat` (or equivalent) |
| `imagePrompt` | Hidden. Prompt sent to Gemini, for regenerate-from-same-brief |

`hasExtraExtra` remains “has headline and body”. Image is not required.

---

## Studio

On **Skapa dagens**, after preview:

- Show headline, body, drawing, caption, and shot type.
- **Generera om bild** hits Gemini again with the selected type. Flash unchanged.
- Changing type without regenerate only updates the choice; the new drawing appears on the next regenerate.
- **Publicera** always sends the flash. Image fields only if a drawing exists.
- Gemini failure: keep the flash, show a clear error, keep Publish and regenerate available.
- Published extras: image visible read-only; no generate action on the document (delete the extra to start over, same as today’s one-per-day rule).

---

## Image prompt (always)

Every Gemini call includes a fixed style block:

- Monochrome ink cartoon, Berglin / Larson, simple panel, few details
- Hens and roosters as the only actors
- No humans
- No letters, signs, or speech in the picture
- Shot type and scene come from Claude (and the editor’s type override)
- Aspect **3:4** (portrait), not 16:9, so the drawing fits a right-hand column and a full-width phone stack

---

## Site

- Same component on home and `/arkiv/{date}`.
- Phone: stacked as locked above.
- Desktop (`sm` and up): two columns under the headline — body | drawing+caption.
- Drawing sits on a light panel against the dark paper, thin rule, no crop into a random focal point (`object-fit: contain`).
- Caption: smaller, italic, brass/muted, under the drawing.
- Without image: no placeholder box.

---

## API

Keep `POST /api/extra-extra/preview` and `publish`. Add image generation on preview (best-effort) and `POST /api/extra-extra/preview-image` (or equivalent) for regenerate.

Both still require `EXTRA_EXTRA_SECRET` and CORS as today.

Missing `GEMINI_API_KEY`, quota, or empty Gemini output → flash preview still 200 with `image: null` and an error message for the drawing only. Do not fail the whole preview solely because the image failed.

Publish uploads the image with the existing Sanity write token, then `client.create` as today. 409 if today’s extra already exists remains.

---

## Env

Kycklingbladet `.env.local` and Vercel Production:

- `GEMINI_API_KEY` — same Google AI Studio key used by HolyParadox
- optional `GEMINI_IMAGE_MODEL` — default `gemini-3-pro-image`

Do not commit the key. Studio does not need the Gemini key; only the Next app talks to Google.

---

## Errors

| Case | Behaviour |
|------|-----------|
| Unknown paper / scrape / Claude | Existing extra preview error, no image |
| Gemini fail / quota / missing key | Flash shown, drawing error, publish without image allowed |
| Empty or invalid image bytes | Treat as Gemini fail, nothing stored |
| Regenerate | Only updates the in-memory preview, never a published document |

---

## Tests

No live Google calls in CI.

- Style prompt asserts: monochrome, no humans, no in-image text, Berglin/Larson lock
- Caption is a who/where/what line, not empty when an image exists in a successful preview fixture
- `IssueExtra` renders layout with image+caption and without image (no empty frame)
- Publish without image does not set image fields
- One-per-day 409 unchanged
- Preview still returns a flash when image generation is stubbed to fail

---

## Success

An editor pastes a tabloid URL, sees a hen cartoon in the locked style with a caption, can change type and redraw, or publish the flash alone. On the site the drawing reads as a newspaper illustration: full width on a phone, beside the body on desktop, gone entirely when absent.
