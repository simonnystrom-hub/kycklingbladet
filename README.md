# Kycklingbladet

Daglig satirisk alarmtext baserad på dagens högst scorade rubrik från Alarmindex.

**Studio (admin):** https://kycklingbladet.sanity.studio  
**Kod:** https://github.com/simonnystrom-hub/kycklingbladet

## Live (Vercel)

Importera GitHub-repot på [vercel.com/new](https://vercel.com/new/import?s=https://github.com/simonnystrom-hub/kycklingbladet) och sätt:

- `NEXT_PUBLIC_SANITY_PROJECT_ID` = `go9a4gjd`
- `NEXT_PUBLIC_SANITY_DATASET` = `production`
- `NEXT_PUBLIC_SANITY_API_VERSION` = `2025-01-01`
- `NEXT_PUBLIC_SITE_URL` = den URL Vercel ger (uppdatera efter första deploy)

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
| `NEXT_PUBLIC_SITE_URL` | Publik site-URL (default `http://localhost:3000`) |
| `SANITY_API_WRITE_TOKEN` | Token för att skapa alarm-dokument |
| `ALARMINDEX_SANITY_PROJECT_ID` | Alarmindex Sanity project id (läs scored headlines) |
| `ALARMINDEX_SANITY_DATASET` | Alarmindex-dataset (default `production`) |
| `ALARMINDEX_SANITY_API_VERSION` | Alarmindex API-version (default `2025-01-01`) |
| `ALARMINDEX_SANITY_READ_TOKEN` | Valfri read-token om Alarmindex-dataset kräver det |
| `ANTHROPIC_API_KEY` | Claude API-nyckel (daglig generering) |
| `ANTHROPIC_MODEL` | Claude-modell (valfri override) |

## GitHub Actions (daily job)

Schemat körs via `.github/workflows/daily.yml` (vardagar 12:00, helg 14:00 Europe/Stockholm). Sätt dessa repository secrets så de matchar workflowen:

| Secret | Används som |
|--------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Kycklingbladet Sanity project id |
| `SANITY_API_WRITE_TOKEN` | Write-token för att skapa alarm |
| `ALARMINDEX_SANITY_PROJECT_ID` | Alarmindex Sanity project id |
| `ALARMINDEX_SANITY_READ_TOKEN` | Valfri Alarmindex read-token |
| `ANTHROPIC_API_KEY` | Claude API-nyckel |
| `ANTHROPIC_MODEL` | Valfri modell-override |

## Redigering och publicering

Studio (`../kycklingbladet-studio`) är det enda sättet att avpublicera eller redigera ett alarm. Att köra om daily-jobbet skriver **inte** över ett befintligt alarm för samma datum.
