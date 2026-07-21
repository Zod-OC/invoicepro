# Security Log

## 2026-07-21 — Billify secret rotation (R1 fix)

### What was leaked
Public repo (`Zod-OC/invoicepro`) had the following hardcoded in `docker-compose.yml`:
- `POSTGRES_PASSWORD=795b8e7fcdfb16a55375db63aa8f69a64eaf98ac` (Umami Postgres)
- `DB_PASSWORD=795b8e7fcdfb16a55375db63aa8f69a64eaf98ac` (same value, Umami app)
- `UMAMI_SALT=3df04bbb86d9d1e3d52c637caef82768`

Committed across multiple commits (fc7d0519, 135c3b9, f4b52a0f, and others).
Public repo → assume fully compromised since those commits landed.

### What was NOT in the repo
- `api/.env` (gitignored) had: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `JWT_SECRET`. None in git history.

### Why rotate
Anyone could read the leaked values and connect to the Umami Postgres,
or forge analytics events, or (since `UMAMI_SALT` is used for password
hashing) attempt password cracking against any user's analytics account.

### What was changed
- `docker-compose.yml` now references `${POSTGRES_PASSWORD:?}`,
  `${DB_PASSWORD:?}`, `${UMAMI_SALT:?}` — compose will fail-fast if any
  are unset. The `:?` is a docker-compose 2.x error guard.
- New values to set in Coolify env store (NOT in this file):
  - `POSTGRES_PASSWORD` — new 32+ char random (was leaked)
  - `DB_PASSWORD` — same as POSTGRES_PASSWORD
  - `UMAMI_SALT` — new 32+ char random (was leaked)
  - `JWT_SECRET` — already in api/.env (not in repo) but flagged
    as compromised in the May 2026 audit; rotate anyway
  - `STRIPE_SECRET_KEY` — already in api/.env, switch sk_test → sk_live
  - `STRIPE_WEBHOOK_SECRET` — already in api/.env, get from live mode
  - `STRIPE_PRICE_PRO_MONTHLY` — must be set, R3 fix throws otherwise
  - `STRIPE_PRICE_PRO_YEARLY`
  - `STRIPE_PRICE_TEAM_MONTHLY`
  - `STRIPE_PRICE_TEAM_YEARLY`

### How to rotate the Umami DB password in production
The postgres container holds the data volume. The DB password is the
master password. Two paths:

**A. Migration (safer, brief downtime):**
1. Stop the umami container.
2. `docker exec -it <postgres_container> psql -U umami -c "ALTER USER umami PASSWORD '<new>';"`
3. Update Coolify env vars with the new value.
4. Redeploy umami container.

**B. Reset (loses analytics history):**
1. Stop umami and postgres.
2. `docker volume rm billify-pgdata`
3. Update Coolify env vars.
4. Redeploy; the init script recreates the schema.

### How to rotate JWT_SECRET
1. Generate new: `node -e "console.log(crypto.randomBytes(64).toString('hex'))"`
2. Update Coolify env var for the api container.
3. Restart api container. All existing client JWTs become invalid —
   users will be silently downgraded to free on next page load
   (the `validate-token` route returns 401 → `resetToFree`). They keep
   using free, no action needed on their end. When they re-subscribe,
   the new JWT signs with the new secret.

### How to switch to live Stripe
1. In Stripe dashboard: switch to live mode.
2. Get the live `sk_live_***` secret key.
3. Create 4 prices: Pro monthly, Pro yearly, Team monthly, Team yearly.
4. Add a live webhook endpoint → copy the webhook signing secret.
5. Update Coolify env vars for api container.
6. Restart api container.

### Git history purge (optional, defense-in-depth)
The leaked values are still in `git log` of the public repo. Even after
rotation, anyone with `git clone` history access can recover them. To
scrub:

```bash
# Install bfg (https://rtyley.github.io/bfg-repo-cleaner/)
bfg --replace-text passwords.txt   # one old value per line
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

NOTE: This rewrites history, breaks anyone's local clone, and is a
disruptive operation. Coordinate with any collaborators. The value of
doing it AFTER rotation is purely defensive — once the values are
rotated in prod, the leaked history is no longer useful for attacks.
