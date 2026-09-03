# Kycklingbladet

Daglig satirisk alarmtext baserad på dagens högst scorade rubrik från Alarmindex.

## Kom igång

1. Skapa Sanity-projekt och kopiera project ID till `.env` (kopiera från `.env.example`).
2. Starta Studio i `../kycklingbladet-studio`.
3. Starta frontend:

```bash
npm install
npm run dev
```

Öppna http://localhost:3000

## Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Kycklingbladets Sanity project id |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset (default `production`) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API-version (default `2025-01-01`) |
| `NEXT_PUBLIC_SITE_URL` | Publik site-URL (default `http://localhost:3000`) |
| `SANITY_API_WRITE_TOKEN` | Token för att skapa alarm-dokument |
| `ALARMINDEX_SANITY_PROJECT_ID` | Alarmindex Sanity project id (läs scored headlines) |
| `ALARMINDEX_SANITY_DATASET` | Alarmindex-dataset (default `production`) |
| `ALARMINDEX_SANITY_API_VERSION` | Alarmindex API-version (default `2025-01-01`) |
| `ALARMINDEX_SANITY_READ_TOKEN` | Valfri read-token om Alarmindex-dataset kräver det |
| `ANTHROPIC_API_KEY` | Claude API-nyckel (daglig generering) |
| `ANTHROPIC_MODEL` | Claude-modell (valfri override) |
