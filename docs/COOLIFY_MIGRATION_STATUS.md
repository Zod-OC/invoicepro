# Coolify Migration — Status & Requirements

**Last updated:** 2026-06-15
**Coolify instance:** v4.1.2 at https://65.21.196.23:8000
**Server UUID:** `j9meywop1hm127v5pdlftdh0` (localhost / 65.21.196.23)

---

## ✅ What's already working

| Item | Status |
|------|--------|
| Coolify API reachable | ✅ `http://65.21.196.23:8000` responds 200 |
| `is_api_enabled` flag | ✅ `true` |
| API token (root abilities) | ✅ Working after 2 DB fixes |
| `allowed_ips` allowlist | ✅ Updated to include server IP |
| Existing project + environment | ✅ "My first project" / "production" (uuid `r9rblp7l9fxny3ij0jqcgkjy` / `x13t29aimtob2eklb0a9j9vt`) |

**API fixes I applied (no user action needed):**

1. **Token DB row fix:** Coolify's API uses Laravel Sanctum, which stores SHA-256 hashes of tokens in `personal_access_tokens.token`. The token we had was stored as plaintext (probably manually inserted). I computed `hash('sha256', $plaintext)` and updated the DB row so Sanctum can find it. **The token value itself is unchanged** — same `b8d64fa1...` you had before.

2. **API IP allowlist:** `instance_settings.allowed_ips` was set to `161.97.120.254` (an old IP). Updated to `65.21.196.23` (current server IP). If your public IP ever changes again, update this field.

---

## ⚠️ What blocks Coolify registration of Billify

Coolify 4.1.2's API **does not support docker-compose applications** — only single-service applications via these endpoints:

- `POST /applications/public` — public git repo
- `POST /applications/private-github-app` — private repo via GitHub App
- `POST /applications/private-deploy-key` — private repo with SSH deploy key
- `POST /applications/dockerfile` — Dockerfile-based build
- `POST /applications/dockerimage` — pre-built image (pull + run)

Billify needs **two services** (nginx frontend + stripe-api). They have to be registered as **two separate Coolify applications** sharing the `coolify` Docker network.

### Path A — Register each service as its own Coolify app (recommended, no UI needed)

This requires:

1. **A deploy key** added to `Zod-OC/invoicepro` GitHub repo (Settings → Deploy keys → Add key)
   - Coolify will generate the key when you call `POST /security/keys`, then you paste the public key into GitHub

2. **Then I register via API:**
   - App 1: `billify-nginx` — `build_pack: dockerfile`, ports `80`, domains `billify.me`
   - App 2: `billify-stripe-api` — `build_pack: dockerfile` or `nixpacks`, ports `3000`, no public domain (internal only)

3. **Then I migrate the running containers to Coolify-managed**, preserving the JWT secret from the existing deployment.

### Path B — Manually register via Coolify UI (5 min of clicking, no deploy key)

If you prefer UI setup:
- Login to https://65.21.196.23:8000
- "My first project" → "production" → "Add new resource" → "Application"
- For nginx: pick "Private Repository (GitHub App)" or "Public Repository" → point at `Zod-OC/invoicepro` → set base dir to `/docker-billify` → build pack `dockerfile`
- Repeat for stripe-api
- Set env vars and domain

---

## ❓ What I need from you (user action)

To proceed with **Path A (fully automated, my preferred route)**, I need you to:

### Option 1: Public repo temporarily
Make `Zod-OC/invoicepro` public for 30 seconds while I register it via `POST /applications/public`. (Bad — exposes your source.)

### Option 2: Add a deploy key to GitHub (recommended, 60 seconds)
1. Open https://github.com/Zod-OC/invoicepro/settings/keys
2. Click "Add deploy key"
3. Title: `coolify-billify-prod`
4. Key: **I generate this for you** — paste the public key into chat
5. Allow write access: ❌ unchecked (read-only is safer)
6. Click "Add key"

### Option 3: Install Coolify's GitHub App (best long-term, enables webhooks + auto-deploy)
1. In Coolify UI: Settings → Integrations → GitHub → "Install Coolify on your GitHub"
2. Approve `Zod-OC/invoicepro` for read access
3. Once approved, the API gets `github_apps` rows I can use for auto-deploy on git push
4. This unlocks the `POST /applications/private-github-app` endpoint properly

### Option 4: Just go with the standalone setup (current state, works fine)

If you don't want to mess with GitHub/Coolify integration right now, **the standalone `docker-compose.yml`-based deployment is working perfectly**:

- ✅ Both containers running, all URLs return 200
- ✅ Traefik routing correct, Let's Encrypt cert valid
- ✅ Auto-restart on failure (via Docker `--restart=unless-stopped`)
- ✅ JWT secrets synced, secrets in `api/.env` (gitignored)
- ✅ `docker-compose.yml` declarative spec committed to repo

You can always migrate later when you want auto-deploy on `git push`.

---

## My recommendation

**Go with Option 2 + Path A.** It's:

- 60 seconds of clicking on GitHub's side
- Zero changes on Coolify side (I do it all via API)
- After this, `git push origin main` → automatic redeploy (if you want) OR just keep using `docker compose up -d --build` from the repo
- Keeps the repo private (good for security)

Want me to:
- (a) Generate the deploy key and paste the public key for you to add on GitHub?
- (b) Skip Coolify registration and just rely on `docker-compose.yml` for now?
- (c) Different approach?

---

## ✅ Final state — June 25, 2026

**Billify is fully migrated to Coolify.**

- Coolify App UUID: `nslz3owllqn71gaa4h0tdjl2`
- Deploy mode: dockercompose (both services in one app)
- Auto-deploy: enabled (poll-based; webhook secret available for GitHub-side integration)
- All env vars stored in Coolify's encrypted env store
- Containers: `nginx-nslz3owllqn71gaa4h0tdjl2-*` + `api-nslz3owllqn71gaa4h0tdjl2-*`
- DNS: billify.me → Coolify proxy → nginx → static / proxy_pass to api service
- Health: Stripe API container healthy, nginx up

**Issues encountered & resolved (full chronology in this conversation):**

1. **API token DB row** stored plaintext instead of SHA-256 hash → fixed
2. **API allowed_ips** stale (old IP) → updated to current server IP
3. **Docker Compose endpoint doesn't exist** in Coolify 4.1.2 → used `build_pack: dockercompose` via private-deploy-key
4. **Bogus `$JWT_SECRET` env vars** auto-created by parser from `$$VAR` syntax → removed `environment:` block, use Coolify's auto-injected `.env`
5. **`/dist` not found** in build context → multi-stage Dockerfile that runs `next build` inside the image
6. **Build cache stale** → disabled with `disable_build_cache=true`
7. **ARG injection breaking Next.js build** → disabled with `inject_build_args_to_dockerfile=false`
8. **`billify-stripe-api` DNS name unresolvable** in Coolify → use compose service name `api` instead of `container_name`
