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
- `http://10.10.10.14:3847` (LAN-only bind; proxy/forward from here)

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
- App is bound to `10.10.10.14:3847` for LAN access.
- For local/LAN direct access, use relative frontend URLs (for example `/login`), not absolute URLs.
- Set `ORIGIN` in `.env` to the exact browser URL (for example `http://10.10.10.14:3847`). Update it to your public `https://...` origin when you move behind VPS/Caddy.

## Local Dev (without Docker)

```sh
pnpm install
pnpm run dev
```
# ShoeBox
