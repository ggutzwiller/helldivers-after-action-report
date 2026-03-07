# Helldivers: After-Action Report

A Discord bot that analyzes Helldivers 2 end-of-mission screenshots via the Mistral Pixtral vision API and generates immersive lore-flavored reports as Discord embeds.

---

## Table of contents

- [Context and overview](#context-and-overview)
- [Usage and deployment](#usage-and-deployment)
- [Architecture and code](#architecture-and-code)

---

## Context and overview

### The concept

After each mission in Helldivers 2, the game displays a results screen with statistics for all squad members (up to 4 players): kills, deaths, samples collected, objectives completed, etc. This Discord bot takes a screenshot of that screen and generates a narrative report written in the game's universe, featuring the entire squad.

The report is written in one of 5 styles:

| Style | Description |
|-------|-------------|
| **Heroique** | Epic chronicle, martial tone, celebration of the squad's exploits |
| **Tragique** | Letter from the front, dark tone, human cost of the mission |
| **Propagande** | Ministry of Truth bulletin, everything is a glorious victory |
| **Cynique** | Jaded veteran, sarcasm, mocking Super Earth bureaucracy |
| **Statistique** | Cold analysis, performance ratios, mission grade |

### The pipeline

When a player sends `/report` with a screenshot:

```
Screenshot (JPG/PNG)
    |
    v
[Validation] -- format + size (max 10 MB)
    |
    v
[Pixtral] -- vision model, extracts stats for all players as structured JSON
    |
    v
[Mistral Small] -- generates narrative text featuring the squad in the chosen style
    |
    v
[Discord Embed] -- visual formatting with per-player stats + narrative
```

Two separate API calls are made to Mistral:
1. **Pixtral** (vision model, more expensive): reads the image and extracts structured data for all visible players
2. **Mistral Small** (text model, cheap): writes the narrative report from the extracted stats, mentioning each player by name

This separation minimizes costs: the vision model only does data extraction, while creative writing is delegated to the lighter text model.

### Budget

For roughly 5 users and ~100 screenshots per month:

| Item | Cost |
|------|------|
| Mistral API (Pixtral + Small) | ~1.50 EUR/month |
| Scaleway Stardust VPS | ~0.10 EUR/month |
| **Total** | **~1.60 EUR/month** |

### Discord commands

- `/report <image> [style] [lang]` — Analyze a screenshot and generate a report (supports up to 4 players per screenshot)
- `/stats [lang]` — View aggregated stats across all reports you submitted (total kills, deaths, samples across all players)
- `/usage` — Bot usage statistics (total players, reports generated, errors, invalid images)

Both `/report` and `/stats` support language selection (`fr` or `en`). French is the default.

---

## Usage and deployment

### Prerequisites

- Node.js 20+
- A Discord bot with its token (via the [Discord Developer Portal](https://discord.com/developers/applications))
- A Mistral API key (via [console.mistral.ai](https://console.mistral.ai/))

### Local setup

```bash
git clone <repo-url>
cd helldivers-after-action-report
npm install
```

Create a `.env` file at the project root:

```
DISCORD_TOKEN=your_discord_token
DISCORD_CLIENT_ID=your_client_id
MISTRAL_API_KEY=your_mistral_key
DATABASE_URL=./data/helldivers.db
```

### Development

```bash
npm run dev          # Start the bot with hot-reload (tsx watch)
npx tsc --noEmit     # Type-check without compiling
```

### Build and production

```bash
npm run build        # Bundle with tsup (output in dist/)
npm start            # Run the production build
```

### Database

The SQLite database is created automatically on first launch. To apply schema changes:

```bash
npm run db:push      # Apply the Drizzle schema to the DB
npm run db:generate  # Generate migration files
```

### Deploying to a VPS

#### Infrastructure with Terraform

The `infra/` directory contains the Terraform configuration to provision a Scaleway VPS:

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Scaleway project ID

export SCW_ACCESS_KEY=your_access_key
export SCW_SECRET_KEY=your_secret_key

terraform init
terraform plan
terraform apply
```

This creates:
- A Stardust instance (1 vCPU, 1 GB RAM) with a dynamic public IP
- A cloud-init bootstrap that installs Node.js 20, rsync, and sets up the systemd service

#### Server security

The cloud-init configuration applies the following hardening at first boot:

- **SSH hardening**: root login disabled, password authentication disabled (key-only), max 5 auth attempts
- **fail2ban**: bans IPs after 5 failed SSH attempts for 1 hour
- **Firewall**: default Scaleway security group. The bot only makes outbound connections (WebSocket to Discord, HTTPS to Mistral) so no inbound ports need to be open beyond SSH
- **Automatic security updates**: `unattended-upgrades` keeps the OS patched
- **Environment file**: `.env` is created with `600` permissions (owner-only read/write)

#### First-time server setup

After `terraform apply`, SSH in and create the environment file:

```bash
ssh helldivers@<SERVER_IP>
cat > /opt/helldivers/.env << 'EOF'
DISCORD_TOKEN=your_discord_token
DISCORD_CLIENT_ID=your_client_id
MISTRAL_API_KEY=your_mistral_key
DATABASE_URL=/opt/helldivers/data/helldivers.db
EOF
```

Then deploy and initialize the database:

```bash
./deploy.sh <SERVER_IP>
ssh helldivers@<SERVER_IP> "cd /opt/helldivers/app && npm install --no-save drizzle-kit && DATABASE_URL=/opt/helldivers/data/helldivers.db npx drizzle-kit push && npm prune --omit=dev"
```

#### CI/CD with GitHub Actions

Two workflows in `.github/workflows/`:

- **CI** (`ci.yml`) — Runs on every push and PR to `main`: installs deps, type-checks (`tsc --noEmit`), and builds
- **Deploy** (`deploy.yml`) — Runs on push to `main` only: waits for CI to pass, builds the project, rsyncs to the server via SSH, installs production deps, and restarts the systemd service

Required GitHub Secrets (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Private SSH key authorized on the server (the public key must be in cloud-init) |
| `SERVER_IP` | Public IP of the VPS |

Once configured, every push to `main` automatically deploys to the server. Deploys are serialized (`concurrency` group) so only the latest push is deployed if multiple are queued.

#### Manual deployment

You can also deploy manually without GitHub Actions:

```bash
./deploy.sh <SERVER_IP>
```

This script:
1. Builds the project locally (`npm run build`)
2. Syncs `dist/`, `drizzle.config.ts`, `src/db/schema.ts`, `package.json`, and `package-lock.json` to the server via rsync
3. Installs production dependencies on the server
4. Restarts the systemd service

#### systemd service

The bot runs as a systemd service named `helldivers-bot`:

```bash
sudo systemctl status helldivers-bot    # Status
sudo systemctl restart helldivers-bot   # Restart
journalctl -u helldivers-bot -f         # Live logs
```

The service restarts automatically on crash (with a 5-second delay).

---

## Architecture and code

### Project structure

```
helldivers-after-action-report/
├── src/
│   ├── index.ts              # Bot entrypoint
│   ├── types.ts              # Shared types (PlayerStats, MissionStats, Style, Language)
│   ├── commands/
│   │   ├── report.ts         # /report command
│   │   ├── stats.ts          # /stats command
│   │   └── usage.ts          # /usage command
│   ├── services/
│   │   ├── pixtral.ts        # Pixtral API call (vision)
│   │   ├── templates.ts      # Narrative prompts per style
│   │   └── queue.ts          # p-queue request queue
│   ├── db/
│   │   ├── schema.ts         # SQLite schema (Drizzle ORM)
│   │   └── index.ts          # Database connection
│   └── utils/
│       ├── locale.ts         # Localized strings (FR/EN)
│       ├── validation.ts     # Image validation
│       └── embeds.ts         # Discord embed builder
├── .github/workflows/
│   ├── ci.yml                # CI: type-check + build on every push/PR
│   └── deploy.yml            # CD: auto-deploy to VPS on push to main
├── infra/                    # Terraform configuration (Scaleway)
├── deploy.sh                 # Manual deployment script
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

### `src/index.ts` — Entrypoint

Initializes the Discord client with the `Guilds` intent (the only one needed for slash commands). On startup:
1. Registers slash commands via the Discord REST API
2. Listens for interactions and routes them to the appropriate handler

The interaction handler includes a global try/catch that handles cases where a command crashes after having already called `deferReply()`.

### `src/commands/report.ts` — /report command

The bot's main flow. Steps:

1. Validates the image (format, size) — tracks `invalid_image` event on failure
2. Calls `deferReply()` to avoid Discord's 3-second interaction timeout
3. Queues the processing task (`p-queue`, concurrency 1)
4. Inside the queue: Pixtral extraction (all players) → Mistral narrative → upsert player in DB → save report + per-player stats → send embed
5. On success, tracks `report_success`; on failure, tracks `report_error` or `not_helldivers`

The queue is critical: without it, if 3 players send a screenshot at the same time, all 3 API calls fire in parallel. With `concurrency: 1`, they are processed one at a time, preventing API overload and budget spikes.

### `src/commands/stats.ts` — /stats command

Queries the database to display:
- Aggregated totals (missions, kills, deaths, samples) across all players in reports the user submitted, via SQL `sum()` with a join on `report_player_stats`
- The 5 most recent missions

### `src/commands/usage.ts` — /usage command

Displays bot-wide usage statistics as an ephemeral embed:
- Total players and total reports generated
- Reports generated in the last 24 hours
- Breakdown by event type: successful reports, errors, non-Helldivers images, invalid image uploads

All data comes from the `events` table, which is populated by the `/report` command at each step.

### `src/services/pixtral.ts` — Stats extraction

Sends the image to Pixtral with a prompt requesting strict JSON output containing shared mission fields and a `players` array with up to 4 entries:

```json
{
  "shipName": "...",
  "players": [
    {
      "name": "PlayerName",
      "kills": 0,
      "accuracy": 0,
      "deaths": 0,
      "stimsUsed": 0,
      "samples": 0,
      "meleeKills": 0,
      "friendlyFireDamage": 0
    }
  ]
}
```

If the image is not an end-of-mission screen, Pixtral responds with `{"error": "not_helldivers"}` and the bot returns a clean error message.

The `extractJson()` function handles the case where Pixtral wraps the JSON in markdown code blocks (\`\`\`json...\`\`\`), which would otherwise break `JSON.parse()`.

### `src/services/templates.ts` — Narrative generation

Each style corresponds to a different **system prompt** that defines the narrator's personality. The **user prompt** contains the actual mission stats for all players and a language instruction (`"Redige en francais."` or `"Write in English."`). The narrative mentions each player by name.

The model used is `mistral-small-latest`, much cheaper than Pixtral since it's text-only generation.

### `src/services/queue.ts` — Request queue

Two lines: a `PQueue` with `concurrency: 1`. When `reportQueue.add(fn)` is called, the function waits its turn if another task is running. The `await` only resolves once the task completes.

### `src/db/schema.ts` — Database schema

Four SQLite tables via Drizzle ORM:

- **players** — `id`, `discord_id` (unique), `username`, `created_at`
- **reports** — mission-level data: `submitted_by` (FK to players), `ship_name`, `style`, `narrative`, `image_url`, `created_at`
- **report_player_stats** — per-player stats for each report: `report_id` (FK to reports), `player_name`, `kills`, `accuracy`, `deaths`, `stims_used`, `samples`, `melee_kills`, `friendly_fire_damage`
- **events** — tracks bot usage: `type` (report_success, report_error, not_helldivers, invalid_image), `discord_id`, `detail`, `created_at`

### `src/db/index.ts` — Connection

Creates the `data/` directory if it doesn't exist, opens the SQLite database, enables WAL mode (concurrent reads without blocking) and foreign keys (disabled by default in SQLite).

### `src/utils/locale.ts` — Localization

All user-facing strings (embed labels, error messages, titles) are centralized in one object per language. The `t(lang)` function returns the correct set of strings. To add a language, just add a new block in this file and a value to the `Language` type.

### `src/utils/validation.ts` — Image validation

Checks the Discord attachment's `contentType` (JPG/PNG only) and size (max 10 MB). Returns a TypeScript discriminated union: `{ valid: true }` or `{ valid: false, reason: string }`.

### `src/utils/embeds.ts` — Discord embeds

Builds a rich embed with:
- Title and color based on the style (gold for heroique, dark red for tragique, etc.)
- The narrative text as the description
- Ship name as a header field
- One field per player showing their stats (kills, deaths, samples, accuracy)
- The screenshot as a thumbnail
- A themed footer

### `infra/` — Terraform

Provisions the Scaleway infrastructure:
- `main.tf`: Scaleway provider
- `vm.tf`: Stardust instance with dynamic public IP + SSH key
- `network.tf`: uses default security group
- `cloud-init.yaml`: first-boot bootstrap (Node.js 20 via NodeSource, rsync, `helldivers` user, systemd service, SSH hardening, fail2ban, automatic security updates)
- `outputs.tf`: server public IP and SSH command

### `deploy.sh`

One-command deployment script: local build, rsync to server (including `dist/`, drizzle config, and DB schema), production dependency install, systemd service restart.
