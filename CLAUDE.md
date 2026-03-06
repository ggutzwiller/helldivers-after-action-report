# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Discord bot that analyzes Helldivers 2 end-of-mission screenshots via the Mistral Pixtral vision API and generates lore-flavored after-action reports as Discord embeds.

Target: ~5 users, ~2 EUR/month budget (Pixtral API + small VPS).

## Architecture

```
src/
  index.ts          # Bot entrypoint, Discord client setup
  commands/          # Slash command handlers (/report, /stats, /usage)
  services/
    pixtral.ts       # Mistral Pixtral API integration (image -> structured JSON)
    templates.ts     # 5 writing styles: Heroique, Tragique, Propagande, Cynique, Statistique
    queue.ts         # In-memory request queue (p-queue)
  db/                # SQLite schema + queries (drizzle-orm)
  utils/             # Image validation, embed builder, error handling
```

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Discord**: discord.js v14 (slash commands, embeds)
- **AI/Vision**: Mistral Pixtral API via `@mistralai/mistralai` SDK
- **Database**: SQLite via `better-sqlite3` + `drizzle-orm`
- **Queue**: `p-queue` (in-memory, sufficient for 5 users)
- **Build**: `tsup` for bundling, `tsx` for dev

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start bot in dev mode (tsx watch)
npm run build        # Build for production (tsup)
npm start            # Run production build
npm run db:push      # Apply DB schema changes (drizzle-kit push)
```

## Key Features

- `/report <image> [style] [lang]` - Analyze a mission screenshot, generate a lore report embed
- `/stats [lang]` - View personal history and "democratie repandue" stats
- `/usage` - Bot usage statistics (total players, reports, errors, invalid images)
- Image validation: JPG/PNG only, size-limited before sending to Pixtral
- Queue system to avoid Discord interaction timeouts (deferReply + process in order)
- Localization: French (default) and English

## Environment Variables

```
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
MISTRAL_API_KEY=
DATABASE_URL=./data/helldivers.db
```

## Design Decisions

- SQLite over Postgres: single-file DB is ideal for a small VPS with 5 users, zero ops overhead
- p-queue over Redis/BullMQ: no need for a separate Redis process at this scale
- Pixtral prompt returns structured JSON (mission stats extraction), then a second Mistral call (mistral-small) generates the lore text in the chosen style
- All Discord interactions use deferReply() immediately, then editReply() after processing to avoid the 3-second timeout
- Slash commands are registered globally on bot startup via REST API

## Code Style

- All code and comments must be written in English
- User-facing strings (Discord messages, embed text, Mistral prompts) stay in French

## Infrastructure

- Deployment target: Scaleway Stardust VPS
- Terraform config in `infra/` (Scaleway provider)
- `cloud-init.yaml` bootstraps the VM: Node.js 20, systemd service, data volume mount, SSH hardening, fail2ban, automatic security updates
- `deploy.sh` at project root: builds locally, rsyncs to server, restarts systemd service
- SQLite DB lives on a separate volume at `/opt/helldivers/data/`

## Type Check

```bash
npx tsc --noEmit    # Type-check without emitting
```
