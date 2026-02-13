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
- `http://localhost:3000`

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

## Local Dev (without Docker)

```sh
pnpm install
pnpm run dev
```
# ShoeBox
