# Facebook Page Posts Implementation Plan

> **For agentic workers:** Execute inline in this session. Spec is binding.

**Goal:** On first publish of a lead or Extra Extra, post full copy to the Facebook Page (photo when a cartoon exists) and comment the article URL.

**Architecture:** Pure message builders plus a Graph `fetch` client. Daily job calls it after notices; Extra Extra publish calls it after Sanity create. Failures log only.

**Tech Stack:** Next.js 16, Vitest, Facebook Graph v21 `fetch`, existing Sanity write client.

**Spec:** `docs/superpowers/specs/2026-09-05-facebook-page-design.md`

## Global Constraints

- First publish only; no Studio redraw posts
- Secrets: `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_ACCESS_TOKEN` — never log tokens
- Last message line: `Se länk i kommentar`
- Comment body is only the canonical article URL
- Do not throw out of daily job or Extra Extra publish
- Canonical host is `https://www.kycklingbladet.com`

## Files

- Create: `src/lib/facebook/message.ts`, `message.test.ts`, `share.ts`, `share.test.ts`, `published.ts`, `published.test.ts`
- Modify: `scripts/run-daily.ts`, `src/app/api/extra-extra/publish/route.ts`, `.github/workflows/daily.yml`, `.env.example`, `README.md`

---

### Task 1: Message builders

Lead: headline, optional caption, body, expert voice+headline then expertText, optional Notiser list, CTA. Extra: EXTRA EXTRA stamp, headline, optional caption, body, CTA. Omit empty blocks. No source lines.

### Task 2: Graph share client

`shareToFacebook({message, imageUrl, articleUrl})`. Missing env: no fetch. Image URL → `/photos` then comment; else `/feed` then comment. Use `post_id ?? id`. Swallow Graph errors.

### Task 3: Load published lead and wire jobs

`sharePublishedLead(date)` fetches headline/body/expert/caption/imageUrl/notices and shares to `/arkiv/{date}`. `sharePublishedExtra` shares in-memory extra to `/extra-extra/{date}`. Daily: only when `created`, after fill notices. Extra Extra route: after successful create.

### Task 4: Env docs

GitHub Actions + README + `.env.example`. How to mint a page token once. No live Facebook in CI.
