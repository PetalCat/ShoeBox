# ShoeBox

## Docker Compose (Production)

Prereqs:
- Docker + Docker Compose plugin installed
- `.env` file present (copy from `.env.example` if needed)

Run:

```sh
docker compose up -d --build
```

App URL:
- `http://localhost:3847` (or `http://<your-lan-ip>:3847`)

Useful commands:

```sh
# logs
docker compose logs -f app

# stop
docker compose down

# stop and remove app container + network (keep local data files)
docker compose down --remove-orphans
```

Notes:
- SQLite DB and uploaded media are persisted in `./data` on your host.
- The container includes `ffmpeg` so video poster/probe features continue to work.
- App is bound to port `3847` on all host interfaces for LAN access.
- For local/LAN direct access, use relative frontend URLs (for example `/login`), not absolute URLs.
- Set `ORIGIN` in `.env` to your preferred local URL (default `http://localhost:3847`).
- CSRF trusted origins are currently set to `['*']` in `svelte.config.js` for flexible local/proxy testing.

## Local Dev (without Docker)

```sh
pnpm install
pnpm run dev
```
# ShoeBox
