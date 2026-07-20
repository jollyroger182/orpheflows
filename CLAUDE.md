# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **Bun**. All scripts run via `bun run <script>`.

- `bun run dev` — Vite dev server
- `bun run build` / `bun run preview` — production build (uses `svelte-adapter-bun`)
- `bun run check` — svelte-check type check
- `bun run lint` — `prettier --check` + `eslint`
- `bun run format` — prettier write
- `bun run db:push` / `db:generate` / `db:migrate` / `db:studio` — drizzle-kit against Postgres (`DATABASE_URL` required)
- `bun run scripts/add_config_token.ts` — one-off scripts run directly with Bun

There is no test suite.

## Architecture

Orpheflows is a SvelteKit app that lets users build Slack workflows visually with Blockly. Each published workflow becomes its own Slack app (created via Slack's app manifest API using a config token) that is installed into user workspaces. The main Orpheflows Slack app is separate from the per-workflow apps and handles auth/discovery.

### The Blockly → JSON → executor pipeline

1. **Editor** — `src/lib/blockly/` defines blocks (`blocks/blocks.json` + `blocks/index.ts` for programmatic blocks like `trigger`), the toolbox (`toolbox.ts`), and a custom code generator (`generator.ts`) that serializes the workspace to a JSON array of `WorkflowStep` objects (`{ id, type, params, ... }`). Workflow "code" stored in the DB is this JSON string.
2. **Execution** — `src/lib/server/workflows/execution/index.ts` (`startWorkflow`) loads the latest version, finds the matching trigger step, and walks the JSON tree. Each block type has a handler in `execution/steps/*.ts` (channels, messaging, form, control, users, etc.), aggregated in `steps/index.ts` as `stepHandlers`. Handlers receive a `StepExecutionContext` with `params`, an `evaluate(step)` to recursively evaluate value inputs, per-execution `data.variables`, and a `getToken()` that returns the workflow's bot token. Rate limits and step limits are enforced in `startWorkflow`.
3. **Persistence** — Executions can suspend and resume via a `continuationToken` stored in `execution.data`; the `form` step and similar interactive blocks use this to wait for user input.

When adding a new block, the change usually spans four places: the block definition (`blocks.json` or `blocks/index.ts`), the toolbox entry (`toolbox.ts`), the executor handler (`execution/steps/*.ts`), and — if it's a trigger — the Slack event wiring (see below).

### Triggers and Slack event routing

The trigger block is a single Blockly block with a dropdown (`MANUAL`, `WEBSITE`, `API`, `EDITOR`, `GLOBAL`, `SHORTCUT`, `REACTION`, `JOIN`, `LEAVE`, `MESSAGE`, `DM`, `BUTTON`, `SLASH`) and dynamic sub-fields per selection. Publishing a workflow (`services/workflows.ts`) walks its triggers and:

- Regenerates the per-workflow Slack app manifest via `services/slack.ts::generateManifest` — only the event subscriptions and shortcuts actually used by triggers are included.
- Writes `listeners` rows keyed by `(event, param, triggersWorkflowId)`.

Incoming Slack events hit `src/routes/api/slack/{events,interaction,slash,callback}/`. Core Slack handling (signature verify, event dispatch) is in `src/lib/server/core/slack/`. Per-workflow dispatch lives in `src/lib/server/workflows/slack/{events,interactions,slash}.ts` — these look up listeners and call `startWorkflow` with a `findTrigger` predicate that either matches the stored `data.trigger` step ID or falls back to matching on the trigger's `params`.

Adding a new event-based trigger requires: dropdown option in `blocks/index.ts`, toolbox entry, listener registration in `services/workflows.ts`, bot event in `services/slack.ts::generateManifest`, and a dispatch branch in `workflows/slack/events.ts`. Slack scopes are in `src/lib/consts.ts::WORKFLOW_APP_SCOPES`.

### API surface

- **Public API** — capnweb RPC at `src/routes/api/rpc/` backed by `src/lib/server/rpc/`. `RPCSession` exposes anonymous read + `authorize(apiToken)` for authenticated ops. Public/self views of DB rows are shaped by `src/lib/server/convert.ts`.
- **Private API** — `src/routes/priv-api/` (`editor-trigger`, `publish`, `save`) is used by the in-browser editor.
- **REST** — a few endpoints under `src/routes/api/{me,users,variables,workflows}/`.

### Data model

Drizzle schema in `src/lib/server/db/schema.ts`. Key tables:
- `workflows` (owned by a user, has one `installation` = the Slack app credentials for that workflow's app)
- `versions` (the JSON `code` blob is versioned; `startWorkflow` uses `getLatestVersion`)
- `executions` (with `continuationToken` + `data` for resumable steps)
- `listeners` (event → workflow routing table, populated on publish)
- `variables` (persistence blocks; scoped per workflow)
- `whitelists` (user/workflow/global outbound domain allowlists for `integration_request`)
- `configTokens` (Slack app-config tokens used to create/update per-workflow app manifests — rotated; see `services/config_tokens.ts` and `scripts/add_config_token.ts`)

### Auth

`@auth/sveltekit` with Slack OAuth (`src/auth.ts`, `src/hooks.server.ts`). The main Slack app in `manifest.json` is only used for sign-in and the info/run slash commands; each published workflow is a distinct Slack app.
