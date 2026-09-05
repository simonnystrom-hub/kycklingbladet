# Facebook: post new leads and Extra Extra to the page

**Date:** 2026-09-05  
**Status:** Approved  
**Goal:** When a new lead (larm) or Extra Extra is published for the first time, post it to the Kycklingbladet Facebook Page with the cartoon when one exists, the full on-site copy, and the article URL as a comment.

App id and app secret are **not** used at publish time. They are only for minting a long-lived **Page Access Token**. Runtime secrets are `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN`.

---

## Locked decisions

- **Trigger:** first publish only. Skip when the daily job finds an existing alarm. Skip Extra Extra when the date already has one (409). Redraws, copy edits, notice backfills on old days, and humor scoring do not post.
- **Lead timing:** Facebook runs **after** image attach **and** `fillNoticesForDate` in `runDaily`, only when `publishAlarm` returned `'created'`. Notices that failed or were empty are omitted; the rest of the post still goes out.
- **Extra Extra timing:** Facebook runs after a successful `create` in `POST /api/extra-extra/publish`. Extra Extra has no expert box and no notices.
- **With cartoon:** Graph `POST /{page-id}/photos` with the public Sanity image URL and the message as `caption`. Then `POST /{post-id}/comments` with the article URL as the comment body (nothing else in the comment).
- **Without cartoon:** Graph `POST /{page-id}/feed` with the same message, then the same URL comment.
- **Article URLs:** `https://www.kycklingbladet.com/arkiv/{date}` for leads, `https://www.kycklingbladet.com/extra-extra/{date}` for Extra Extra.
- **Failure isolation:** Facebook errors are logged. They must not fail Sanity publish, image attach, scoring, or notice fill. Missing Facebook env vars → skip and log, same as a soft fail.
- **No Sanity field** for Facebook post ids in this pass. Idempotency is the existing “already published” guards.
- **No Studio UI.** No Meta SDK. `fetch` to Graph v21+ is enough.

---

## Message body

Blank line between blocks. Trim empty blocks. Do not include Alarmindex source lines (“Ursprungligen …”).

**Lead**

1. Headline  
2. Cartoon caption, if `imageCaption` is non-empty  
3. Full `body` (paragraphs kept; `\n\n` stays `\n\n`)  
4. Expert: `{expertVoice} {expertHeadline}` then `expertText` (always present on a generated lead)  
5. Notices, only if `notices` has length: heading **Notiser** (the on-site “annat”-block), then each notice as headline + body  
6. Last line: `Se länk i kommentar`

**Extra Extra**

1. Stamp `EXTRA EXTRA`  
2. Headline  
3. Cartoon caption, if present  
4. Full `body`  
5. Last line: `Se länk i kommentar`

---

## Out of scope

- Posting when an editor redraws or edits in Studio  
- Re-posting a day whose Facebook call failed (manual post or a later retry tool)  
- Instagram, Threads, or link-preview posts as the primary format  
- Storing `facebookPostId` on the document  
- Automatic Page token refresh (document how to mint a never-expiring page token once)

---

## Architecture

```
runDaily
  publishAlarm → created
  attachLeadImage
  score + fillNotices
  shareToFacebook(lead)     // photos or feed, then comment

POST /api/extra-extra/publish
  create extraExtra
  shareToFacebook(extra)    // photos or feed, then comment
```

`src/lib/facebook/share.ts` builds the message and calls Graph. GitHub Actions daily job and Vercel Extra Extra route both read the same env vars.

Image URL: Sanity asset `url` after upload (`uploaded.url` from `assets.upload`, or a one-field fetch). Facebook `url=` must be publicly fetchable.

---

## Secrets and Meta setup

| Secret | Where |
|--------|--------|
| `FACEBOOK_PAGE_ID` | GitHub Actions `daily.yml` + Vercel |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | GitHub Actions `daily.yml` + Vercel |

Page token needs `pages_manage_posts`, `pages_read_engagement`, and commenting (`pages_manage_engagement` or equivalent). Mint once from a long-lived user token via `/me/accounts`. App **Live** so Page followers see the posts (Development mode hides them from the public).

Do not commit tokens. Do not print them in logs.

---

## Errors

| Case | Behaviour |
|------|-----------|
| Facebook env missing | Skip, log, site publish OK |
| Photo upload / feed fails | Log, no comment, site OK |
| Photo OK, comment fails | Log; post exists without the URL comment |
| No cartoon | Feed post + comment |
| Notices empty or fill failed | Lead post without Notiser block |
| Graph rate limit / 4xx / 5xx | Log body/status, do not throw out of daily/publish |

---

## Tests

- Message builder: lead with caption, expert, two notices, CTA line; extra with stamp and no expert/notices  
- Message builder omits caption and Notiser when missing  
- `shareToFacebook` posts photos when image URL present, otherwise feed; then comments with the canonical article URL  
- Missing env: no fetch  
- Graph error: does not throw  
- Daily: Facebook helper called only on `'created'`, after notice fill  
- Extra Extra publish: helper called only after successful create  

No live Facebook or Sanity in CI.

---

## Success

A newly created lead appears on the Page with cartoon (if drawn), full lead + expert + notices when those exist, and the archive URL in a comment. A newly created Extra Extra does the same against `/extra-extra/{date}`. Re-running the daily job or Extra Extra publish for an existing date does not create a second Facebook post.
