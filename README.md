# dashboard-mcp

MCP (Model Context Protocol) server that exposes the
`mrichard33/reece-dashboard` GitHub repository to Claude.ai as a set of
read/write tools. Lets a single Claude chat session edit the dashboard
repo without leaving the conversation.

Single-repo scope is intentional. Do not expand to other repos here —
spin up a sibling MCP server with its own threat review instead.

## What it exposes

Five tools, all prefixed `dashboard_`:

- `dashboard_list_files` — list a directory in the repo. `path` (optional, default repo root), `branch` (optional, default repo default).
- `dashboard_get_file` — fetch a file's contents and SHA. `path` (required), `branch` (optional). Truncates content at 500KB.
- `dashboard_create_or_update_file` — commit a file. `path`, `content`, `message`, `branch` required. `sha` required when the file exists (fetch via `dashboard_get_file` first). Writing to `main` is rejected unless `allow_main: true` is set explicitly. Any path matching `.env*` is refused outright.
- `dashboard_create_branch` — create a new branch from another. `branch` required, `from_branch` defaults to `dev`.
- `dashboard_search_code` — GitHub code search restricted to the dashboard repo. `query` required, `path` optional. GitHub indexing lags; recently-pushed files may not appear yet — fall back to `dashboard_get_file` if you know the path.

Deliberately absent: no delete, no PR creation, no code execution, no cross-repo access.

## Threat model

The server holds a GitHub fine-grained PAT scoped to `mrichard33/reece-dashboard` with `contents:read+write` and `metadata:read`. Anyone who obtains `MCP_AUTH_TOKEN` can:

- Read any file in the dashboard repo.
- Write any non-`.env*` file to any non-`main` branch.
- Create new branches.
- Run GitHub code search restricted to the dashboard repo.

They **cannot**:

- Touch any other repo (PAT is scoped to this one).
- Write to `main` without explicitly setting `allow_main: true` per call.
- Write `.env*` files (path filter rejects them).
- Delete files, delete branches, or execute code on the server.
- Modify repo settings, collaborators, or branch protection.

Defense in depth: bearer-token auth on every `/mcp` call (constant-time compare), express-rate-limit (60 req/min/IP), no secret values are ever logged.

## Deploy to Railway

1. Push this repo to GitHub (private).
2. Railway → `AI Proxy Servers` project → **New Service** → Deploy from GitHub → select `claude-mcp`.
3. Railway → service → **Variables**, set:
   - `GITHUB_PAT` — fine-grained PAT, scoped to `mrichard33/reece-dashboard` only, with `Contents: Read and write` and `Metadata: Read-only`. **Do not use a classic PAT.**
   - `GITHUB_OWNER` — `mrichard33`
   - `GITHUB_REPO` — `reece-dashboard`
   - `MCP_AUTH_TOKEN` — generate with `openssl rand -hex 32` (PowerShell: `-join ((1..64) | ForEach-Object {'{0:x}' -f (Get-Random -Max 16)})`)
   - `NODE_ENV` — `production`
4. Deploy. Logs should show `dashboard-mcp listening on port …`.
5. Railway → service → **Settings → Networking → Generate Domain**. Note the public URL.
6. Smoke-test:
   ```sh
   curl https://<your-url>/health
   # → {"status":"ok","name":"dashboard-mcp",…}
   ```
   And an authenticated call:
   ```sh
   curl -X POST https://<your-url>/mcp \
     -H "Authorization: Bearer $MCP_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'
   ```
   Unauthenticated calls return `401`.

## Add to Claude.ai

1. claude.ai → **Settings → Connectors → Add custom connector**.
2. URL: `https://<your-railway-domain>/mcp`
3. Authentication: Bearer → paste the value of `MCP_AUTH_TOKEN`.
4. Save. Start a new chat — the `dashboard_*` tools should appear alongside any existing MCP connectors.

## Rotate secrets (every 90 days)

- **MCP_AUTH_TOKEN**: regenerate with `openssl rand -hex 32`, update Railway variable, then update the Claude.ai connector with the new token. The Railway service restarts automatically when variables change.
- **GITHUB_PAT**: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → regenerate. Update the Railway variable. Old PAT becomes invalid immediately.

Never commit either to git. `.env*` is in `.gitignore` and write-refused by `dashboard_create_or_update_file`.

## Local dev

```sh
cp .env.example .env
# fill in values
npm install
npm run dev
```

Then `curl http://localhost:3000/health`.

## Why not just use the official `github` MCP?

The official GitHub MCP server is broadly scoped and the auth model is per-user/per-org. This server is single-purpose: one repo, one token, narrow tool surface. Easier to reason about; one-line audit for what an attacker who steals the token can do.
