# X-only quote tweets from Studio (citat på X)

**Date:** 2026-09-10  
**Status:** Draft for review  
**Goal:** In Sanity Studio, paste an X/Twitter URL and/or tweet text, hen-ify it as Kycklingbladet, preview the copy, then draw a cartoon, then publish a quote tweet to @Kycklingbladet. Nothing goes to Facebook or kycklingbladet.com.

---

## Locked decisions

- **Surface:** X only. No site page, no RSS, no Facebook, no nav.
- **Mechanic:** quote tweet. Our hen text plus cartoon; the source tweet nested underneath. Not a native retweet, not a reply, not a standalone tweet with a URL.
- **Input:** both a tweet URL (`x.com/…/status/…` or `twitter.com/…/status/…`) and/or pasted original text. URL fetch is preferred when it works; paste is the backup.
- **Publish requires a tweet id.** If the URL cannot be resolved to a status id, Studio must say so. Do not silently post a normal tweet.
- **Studio:** new tool beside Extra Extra, same shape (preview text → edit → knobs → image → publish).
- **Persistence:** none. No Sanity document, no Studio log. After a successful post the form resets.
- **Generation:** Claude picks the first henification (tone and length) from the source joke. Dumhet and Uppskruvning sliders (1–5, Extra Extra’s labels) appear after that first draft. Regenerating with knobs overwrites the text field.
- **Length:** the model decides how much to squeeze from the satire. No fixed headline/body template. One editable text field in Studio.
- **Extra mentions:** a separate field. Appended at publish time. Survive text regenerations. Do not send them to Claude.
- **Image after approved text**, same hen cartoon rules as Extra Extra/larm (colour, signature, no extra readable language). Publish is disabled until an image exists.
- **Auth:** same Studio → site secret and CORS as Extra Extra (`x-extra-extra-secret`).

---

## Out of scope

- Facebook, website, RSS, or a public archive of these posts
- Sanity schema or a Studio list of past citat
- Native retweets, replies, or standalone tweets
- Auto-publish without preview
- Auto-replies to comments on the quote tweet
- Changing daily larm / Extra Extra / visdomsord posting

---

## Studio

Repo: `kycklingbladet-studio`.

Structure: top-level **Citat på X** → custom component (same `SANITY_STUDIO_SITE_URL` + extra-extra secret header as Extra Extra).

1. Fields: tweet URL, original text (textarea), extra `@` (one line).
2. **Hönsa** → `POST /api/x-citat/preview` with `{url?, text?, dumhet?, uppskruvning?}`. First click omits knobs so Claude chooses. Later clicks send the sliders.
3. Show fetched `@user` + original text (read-only once fetched) and an editable hen text area.
4. Knobs appear after the first successful preview. Changing knobs does not auto-fetch; user clicks Hönsa again. That replaces hen text. Extra `@` and source fields stay.
5. **Rita bild** → `POST /api/x-citat/preview-image` with the current hen text (and caption/shot fields if we follow Extra Extra’s image payload).
6. **Publicera på X** → `POST /api/x-citat/publish` with hen text, extra mentions, image, `quoteTweetId`. On success, reset the form.

Disabled states:

- Hönsa: neither URL nor pasted text
- Rita: no hen text
- Publicera: no hen text, no image, or no `quoteTweetId`

---

## Source tweet

Parse status id from URL path `/status/{id}`. Accept `x.com` and `twitter.com`, with or without `www`.

Fetch via X API user context (same OAuth 1.0a env as posting: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` or `X_ACCESS_SECRET`). Request tweet text and author username. Store `quoteTweetId` and `sourceUsername` in the preview JSON only.

Fetch failure: Swedish error in the dialog; pasted text remains usable for Claude, but `quoteTweetId` stays empty and Publicera stays locked.

Do not scrape `x.com` HTML as the primary path.

---

## Copy

Dedicated prompt (not Extra Extra, not larm, not visdomsord). Shared hen lexicon and humor rules. Input is the source tweet (and username if known). Output is a single string: the quote-tweet body, no EXTRA EXTRA stamp, no “se länk i kommentar”, no article URL.

First generation: the model picks the sharpest hen angle and as much or as little text as the joke supports.

Regeneration: Dumhet and Uppskruvning 1–5 with the same meaning as Extra Extra. Default slider values after first generate: 3 and 3 (display only; they were not used on the first call).

Studio may edit the hen text freely before image and before publish.

---

## Mentions

Separate field, comma or whitespace separated. At publish:

- Trim, ensure a leading `@`, drop empties
- Drop the source username if it is already the quoted author
- Append remaining handles at the end of the hen text, separated by spaces
- Do not invent mentions in Claude output

---

## API (Kycklingbladet)

All `POST`, JSON, extra-extra secret, Studio CORS.

**`/api/x-citat/preview`**

1. Validate URL and/or text.
2. If URL present, resolve tweet. On success set `quoteTweetId`, `sourceUsername`, `sourceText`.
3. Henify `sourceText` or pasted text with Claude (knobs optional).
4. Return preview JSON. Do not post, do not write Sanity.

**`/api/x-citat/preview-image`**

Same idea as Extra Extra image preview: hen text in, jpeg base64 out. Do not post.

**`/api/x-citat/publish`**

1. Require hen text, image, `quoteTweetId`.
2. Normalize extra mentions, append.
3. Upload media and `POST /2/tweets` with `text`, `media.media_ids`, `quote_tweet_id`.
4. Extend existing `shareToX` (or a thin wrapper) with optional `quoteTweetId`. Still never call Facebook.
5. 200 `{ok: true}`. Failures: Swedish `error`, keep no server-side draft.

Log X config shape only (lengths), never token values.

---

## Errors

| Case | Studio |
|------|--------|
| Missing X env on the site | Clear error, no post |
| Bad or unfetchable URL | Error; paste still works for preview; publish locked without id |
| Claude/image failure | Error; keep form |
| Publish failure | Error; keep text and image |
| Garbage extra `@` | Dropped; do not fail the post |

---

## Tests

- Parse `x.com` / `twitter.com` status URLs; reject junk
- Preview returns hen text; knobs are forwarded on regenerate
- Mentions: add `@`, drop duplicates of the source user
- Publish sends `quote_tweet_id` and media; refuses without tweet id
- Publish does not call Facebook or Sanity `create`
- Claude, Gemini, and X are mocked

---

## Files (expected)

Studio: `actions/XCitatCreate.tsx`, structure entry.

Site: `src/lib/x/citat/` (url parse, mentions, prompt), `src/lib/x/share.ts` quote-tweet field, `src/app/api/x-citat/{preview,preview-image,publish}/route.ts` plus tests.
