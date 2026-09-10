# X mention replies from Studio (X-svar)

**Date:** 2026-09-10  
**Status:** Draft for review  
**Goal:** When someone mentions @Kycklingbladet on X, hen-ify a short text reply. A Studio queue holds every mention. A global Auto/Kö switch decides whether the GitHub job posts immediately or waits for the editor. No image, no Facebook, no site page.

---

## Locked decisions

- **Surface:** X only. No kycklingbladet.com page, no RSS, no Facebook, no extra `@` in the reply body, no URL, no hashtag, no emoji, no cartoon.
- **Trigger:** X mentions of the authenticated @Kycklingbladet account. Native quote-tweet and unsolicited replies stay out of scope; this path is legal on the current API because the author already mentioned us.
- **Mechanic:** `POST /2/tweets` with `reply.in_reply_to_tweet_id` = the mention’s status id. Reuse existing `shareToX` / `inReplyToTweetId`.
- **Persistence:** Sanity documents of type `xReply`, unique on `sourceTweetId`. Not a throwaway Studio form.
- **Mode:** `siteSettings.xReplyMode` is `'auto'` or `'queue'`. Default **`'queue'`** so nothing auto-posts until an editor flips it. Same Dumhet and Uppskruvning (1–5, Extra Extra labels, default 3/3) live on `siteSettings` and apply to both the job and Studio regen.
- **Studio:** top-level **X-svar** beside Citat på X. Queue UI like visdomsord (list + actions), plus Auto/Kö and the two knobs. Optional **Alla** document list under it. Editors do not create `xReply` by hand; hide it from new-document templates.
- **Auth for site APIs:** same `x-extra-extra-secret` and CORS as Extra Extra / Citat.
- **Caps:** ingest every new mention each run; auto-post at most **5** pending rows per run. Remaining pending rows wait for the next run or for Studio **Skicka**.

---

## Out of scope

- Images, quote tweets, DMs, likes, follows, polls
- Replies to accounts that have not mentioned @Kycklingbladet
- Facebook, website, RSS
- Changing daily larm / Extra Extra / visdomsord / Citat på X posting
- Showing `xMentionsSinceId` as an editor field

---

## Documents

### `xReply`

| Field | Type | Notes |
|--------|------|--------|
| `sourceTweetId` | string | Required. Unique among non-draft `xReply`. |
| `sourceUsername` | string | Without leading `@`. |
| `sourceText` | text | Original mention. |
| `sourceUrl` | url | `https://x.com/{user}/status/{id}` |
| `replyText` | text | Claude draft; editor may edit. |
| `status` | string | `'pending'` \| `'posted'` \| `'skipped'` |
| `error` | string | Last Swedish failure, empty when healthy. |
| `postedTweetId` | string | Our reply id after a successful post. |
| `promptVersion` | string | |
| `modelVersion` | string | |

Preview title: `@{sourceUsername}` · subtitle: status + truncated `replyText`.

### `siteSettings` additions

| Field | Type | Notes |
|--------|------|--------|
| `xReplyMode` | string | `'auto'` \| `'queue'`. Default `'queue'`. |
| `xReplyDumhet` | number | 1–5, default 3. |
| `xReplyUppskruvning` | number | 1–5, default 3. |
| `xMentionsSinceId` | string | Hidden. Newest mention id fully ingested. |

---

## Ingest

`scripts/run-x-reply.ts` (GitHub Actions) and `POST /api/x-reply/sync` (Studio **Hämta mentions**) share one function.

1. Resolve the authenticated user with X `GET /2/users/me` (same OAuth 1.0a env as posting).
2. `GET /2/users/:id/mentions` with `since_id` = `xMentionsSinceId` when set. Request tweet text, author username, `in_reply_to_user_id`, referenced tweets / replied-to status ids. Paginate with `next_token` until exhausted or five pages, so a burst of mentions is not truncated by the first page (newest-first).
3. For each mention, **skip** (do not create a document) when:
   - author username is `Kycklingbladet` (case-insensitive), or author id is us
   - text is empty
   - a non-draft `xReply` already has this `sourceTweetId`
   - `in_reply_to` status id equals any existing `xReply.postedTweetId` (no loop on our own replies)
4. Otherwise create `xReply` with `status: 'pending'`, source fields, then Claude → `replyText` (and versions). If Claude fails, still create the row: empty `replyText`, Swedish `error`.
5. After every mention in the fetched pages has been skipped or created, set `xMentionsSinceId` to the **maximum** mention id seen in those pages. If the X fetch itself fails, leave `since_id` unchanged and fail the job / return 400.
6. If mode is `'auto'`, take pending rows with non-empty `replyText` and empty `error`, oldest first, at most 5, and publish each (same path as Studio Skicka). Failures stay `pending` with `error`; do not count as posted.

Missing X keys: log and skip the run (`skipped`), do not crash Studio with a stack.

---

## Copy

Dedicated prompt (not Extra Extra, not citat-as-quote, not visdomsord). Shared hen lexicon and humor rules.

Input: source username + source text + Dumhet/Uppskruvning currently stored on `siteSettings`. Studio writes the knobs to settings when the editor moves them in the X-svar header; generate always reads settings (no per-row knobs).

Output: one JSON object `{"text": "string"}` — one or two sentences, hen-house reply to that mention. No EXTRA EXTRA stamp, no “se länk”, no URL, no extra @mentions, no hashtags, no emoji.

Parse failure: Swedish `error` on the document, no post.

---

## Site APIs

All `POST`, JSON, extra-extra secret, Studio CORS, `maxDuration = 60`.

| Route | Body | Success |
|--------|------|---------|
| `/api/x-reply/sync` | `{}` | `{ingested: number, posted: number, skipped: number}` after running ingest (+ auto-post if mode auto). |
| `/api/x-reply/generate` | `{id: string}` | `{replyText, promptVersion, modelVersion}` replacing draft; clears `error` on success. Uses current settings knobs. |
| `/api/x-reply/publish` | `{id: string}` | `{ok: true, postedTweetId}` after X reply. Requires pending + non-empty `replyText`. Sets `status: 'posted'`, clears `error`. |

401 `Ej behörig`. 400 Swedish for bad id, missing text, X failure (`Kunde inte posta till X: …` via existing `xErrorMessage`). Publish does not create Facebook posts or Sanity documents other than patching the `xReply`.

Skip is a Studio Sanity patch to `status: 'skipped'` (no site route required).

---

## Studio

Repo: `kycklingbladet-studio`.

Structure: **X-svar** → custom queue (same `SANITY_STUDIO_SITE_URL` + extra-extra secret as Extra Extra). Child **Alla** lists `_type == "xReply"`.

Queue header:

- Auto / Kö control bound to `siteSettings.xReplyMode`
- Dumhet / Uppskruvning bound to `siteSettings`
- **Hämta mentions** → `POST /api/x-reply/sync`

Each pending row: `@{sourceUsername}`, source text, editable `replyText`, `error` if set.

Actions:

- **Hönsa om** → generate API, then refresh row
- **Skicka** → publish API (disabled without `replyText`)
- **Hoppa över** → patch skipped

Do not draw images. Posted and skipped rows disappear from the pending queue; they remain under Alla.

---

## GitHub Actions

New workflow `.github/workflows/x-reply.yml`:

- cron every 15 minutes (`*/15 * * * *`) plus `workflow_dispatch`
- concurrency group `x-reply`, `cancel-in-progress: false`
- env: Sanity write + X OAuth secrets (same names as visdomsord / daily)
- `npx tsx scripts/run-x-reply.ts`

No Anthropic key omission: Claude needs `ANTHROPIC_API_KEY` (and optional `ANTHROPIC_MODEL`) on this job.

---

## Testing

- Skip rules (self, empty, duplicate id, reply-to-our-reply)
- Prompt JSON parse; reject extra @ / empty text
- Ingest does not duplicate `sourceTweetId`; advances `since_id` only after a successful fetch+persist
- Auto posts at most 5; queue mode posts 0
- Generate/publish/sync 401 without secret; publish does not call Facebook
- `shareToX` reply path unchanged besides being used here

---

## Ops

Vercel Production already has Extra Extra secret and X keys for Citat. GitHub needs the same X + Sanity + Anthropic secrets on the new workflow. Hosted Studio needs `sanity deploy` after the Studio UI lands.
