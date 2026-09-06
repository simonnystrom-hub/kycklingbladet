# Kycklingbladet

Daglig satirisk alarmtext baserad på dagens högst scorade rubrik från Alarmindex.

**Sajt:** https://www.kycklingbladet.com  
**Studio (admin):** https://kycklingbladet.sanity.studio  
**Kod:** https://github.com/simonnystrom-hub/kycklingbladet

## Live (Vercel)

Importera GitHub-repot på [vercel.com/new](https://vercel.com/new/import?s=https://github.com/simonnystrom-hub/kycklingbladet) och sätt:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` = `go9a4gjd`
- `NEXT_PUBLIC_SANITY_DATASET` = `production`
- `NEXT_PUBLIC_SANITY_API_VERSION` = `2025-01-01`
- `NEXT_PUBLIC_SITE_URL` = `https://www.kycklingbladet.com`

Frontend läser publicerat innehåll utan token. Write-token och Anthropic behövs bara för daily-jobbet (GitHub Actions), inte för att sajten ska synas.

Egen domän: Vercel → Project → Settings → Domains.

## Kom igång

1. Skapa ett Sanity-projekt för Kycklingbladet och sätt samma project id i båda repos’ `.env`: frontend `NEXT_PUBLIC_SANITY_PROJECT_ID` (kopiera från `.env.example`) och Studio `SANITY_STUDIO_PROJECT_ID` plus `SANITY_STUDIO_DATASET` i `../kycklingbladet-studio` (se Studio `.env.example`).
2. Seed:a Studio-schemat och initialt innehåll:

```bash
cd ../kycklingbladet-studio
npm i
npm run seed
```

3. Kopiera Alarmindex project id till `ALARMINDEX_SANITY_PROJECT_ID` från `../alarmindex/.env.local` (variabelnamnet där — skriv inte in själva värdet i README eller git).
4. Installera och starta frontend:

```bash
npm install
npm run dev
```

Öppna http://localhost:3000

5. Manuell daglig generering (kräver write-token + Anthropic):

```bash
npm run daily
```

## Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Kycklingbladets Sanity project id (frontend) |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset (default `production`) |
| `SANITY_STUDIO_PROJECT_ID` | Samma Sanity project id i Studio (`../kycklingbladet-studio`) |
| `SANITY_STUDIO_DATASET` | Studio-dataset (default `production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API-version (default `2025-01-01`) |
| `NEXT_PUBLIC_SITE_URL` | Publik site-URL. Kod och canonical pekar alltid på `https://www.kycklingbladet.com`. |
| `SANITY_API_WRITE_TOKEN` | Token för att skapa alarm-dokument |
| `ALARMINDEX_SANITY_PROJECT_ID` | Alarmindex Sanity project id (läs scored headlines) |
| `ALARMINDEX_SANITY_DATASET` | Alarmindex-dataset (default `production`) |
| `ALARMINDEX_SANITY_API_VERSION` | Alarmindex API-version (default `2025-01-01`) |
| `ALARMINDEX_SANITY_READ_TOKEN` | Valfri read-token om Alarmindex-dataset kräver det |
| `ANTHROPIC_API_KEY` | Claude API-nyckel (daglig generering) |
| `ANTHROPIC_MODEL` | Claude-modell (valfri override) |
| `FACEBOOK_PAGE_ID` | Facebooksida som ska få nya larm och Extra Extra |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Långlivat Page Access Token (inte app-secret) |

## GitHub Actions (daily job)

Schemat körs via `.github/workflows/daily.yml` (vardagar 12:00, helg 14:00 Europe/Stockholm). Sätt dessa repository secrets så de matchar workflowen:

Visdomsord körs separat via `.github/workflows/visdomsord.yml` varje dag 07:00 Europe/Stockholm och postar endast till Facebook. Jobbet hämtar från Studio-poolen och kräver ett visdomsord med en Studio-ritad bild. Det använder samma Facebook-secrets och Sanity write-secrets som daily-jobbet.

Kör visdomsord-jobbet manuellt med `gh workflow run visdomsord.yml`.

| Secret | Används som |
|--------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Kycklingbladet Sanity project id |
| `SANITY_API_WRITE_TOKEN` | Write-token för att skapa alarm |
| `ALARMINDEX_SANITY_PROJECT_ID` | Alarmindex Sanity project id |
| `ALARMINDEX_SANITY_READ_TOKEN` | Valfri Alarmindex read-token |
| `ANTHROPIC_API_KEY` | Claude API-nyckel |
| `ANTHROPIC_MODEL` | Valfri modell-override |
| `GEMINI_API_KEY` | Google-nyckel för larm- och Extra Extra-teckningar |
| `GEMINI_IMAGE_MODEL` | Valfri modell-override (default `gemini-3-pro-image`) |
| `FACEBOOK_PAGE_ID` | Facebooksida |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Page Access Token med `pages_manage_posts`, `pages_read_engagement` och `pages_manage_engagement` |

Samma Facebook-värden ska också sättas i Vercel så Extra Extra-publicering från Studio kan posta. App-id och app-secret används bara för att skapa tokenet, inte i jobbet.

Page token (en gång): i Graph API Explorer, användartoken med sidorättigheterna ovan → byt till långlivat användartoken med app-id + app-secret → `GET /me/accounts` → kopiera sidans `access_token`. Appen ska vara Live, annars syns inläggen bara för app-roller.

## Redigering och publicering

Studio (`../kycklingbladet-studio`) är det enda sättet att avpublicera eller redigera ett alarm. Att köra om daily-jobbet skriver **inte** över ett befintligt alarm för samma datum.
