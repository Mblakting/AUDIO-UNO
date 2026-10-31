# AOTY Explorer

A responsive Album of the Year explorer with a typed client for the API endpoints that passed a live probe. All direct API requests use `cache: "no-store"`.

## Explore

- The home catalog fetches 18 individually verified albums in parallel through the working `/album?artist=…&name=…` lookup. `/album/[slug]` uses the same validated endpoint. Album detail includes the complete response in **Inspect Raw JSON Data**, with syntax highlighting, copy/download, payload size, and fetch timestamp.
- `/search?q=…` filters the live-verified album catalog because the API search endpoints currently fail.
- Artist, song, genre, label, user, chart, news, and search routes show endpoint validation status instead of repeatedly calling endpoints that failed the probe.
- Search autocomplete reports the API's current unavailable status.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To create and run the production build:

```bash
npm run build
npm run start
```

## Data availability

The API host is `https://aoty.prigoana.com`. `/health`, `/album?slug=2915`, and the 18 configured `/album?artist=…&name=…` lookups returned HTTP 200 with valid JSON in validation. `/releases`, `/discover`, `/discover/anticipated`, `/home`, `/discover/top-rated`, `/album/summary`, `/album/tracklist`, `/artist`, `/artist/discography`, `/search/autocomplete`, `/search/all`, `/user`, `/user/stats`, `/ratings`, `/songs/top`, `/top-artists`, `/genre`, and `/news` returned HTTP 500 with upstream HTTP 403. `POST /batch` returned HTTP 200 but its album result was HTTP 500, so the app does not use batch requests.
