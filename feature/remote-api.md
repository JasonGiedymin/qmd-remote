# Remote API branch strategy (`remote-api`)

## Ethos and intent

The `remote-api` line of work exists to keep QMD usable in environments where local GGUF inference is not practical or not desired.

Design goals:

- Preserve QMD's core local-first architecture and UX.
- Add a **provider switch** so users can opt into OpenAI-compatible remote inference.
- Keep remote support additive, not disruptive: local model workflows should continue to work unchanged.
- Make upstream sync routine and expected, since this branch tracks a fast-moving base.

## Current implementation status

Remote model support is currently implemented as an OpenAI-compatible provider path.

### Configuration

- QMD reads `~/.config/qmd/llm.yml` (or `QMD_CONFIG_DIR/llm.yml`).
- `provider: openai` enables remote mode.
- OpenAI-compatible options include:
  - endpoint resolution via `base_url` or `protocol` + `host` + `port`
  - `api_key`
  - model names for `embed`, `generate`, and `rerank`
  - temperatures and timeout
  - optional `responses.rerank` support

### Runtime behavior

- LLM abstraction picks provider at startup.
- In `openai` mode, QMD routes embed/generate/rerank calls to remote HTTP endpoints.
- `qmd pull` detects remote provider and skips local model pull behavior.
- A sanity-check script is available at `scripts/test-remote-llm.ts` to validate:
  - `/v1/models`
  - embeddings call
  - chat/completions call
  - rerank path (Responses API or Chat Completions fallback)

## Ongoing branch maintenance (required)

Because upstream QMD is active, keeping `remote-api` healthy requires frequent sync and conflict resolution.

Expected recurring workflow:

1. Update local `main` from upstream.
2. Rebase or merge `main` into `remote-api`.
3. Re-apply or resolve remote-provider changes where upstream touched overlapping files.
4. Re-run sanity checks and targeted tests.
5. Commit with a message that clearly indicates the sync baseline and any manual conflict decisions.

### Practical note

Future work should assume this is a **repeatable maintenance loop**, not a one-time merge.
The remote provider surface (CLI wiring, config schema, LLM adapter behavior, docs, and test script) should be reviewed on each upstream sync.

## Suggested checklist for each sync

- [ ] `git checkout main && git pull upstream main`
- [ ] `git checkout remote-api`
- [ ] `git rebase main` (or `git merge main`, depending on policy)
- [ ] resolve conflicts in:
  - [ ] `src/llm.ts`
  - [ ] `src/llm_config.ts`
  - [ ] `src/qmd.ts`
  - [ ] `src/store.ts`
  - [ ] `README.md`
  - [ ] `scripts/test-remote-llm.ts`
- [ ] run local verification
- [ ] commit + push

If rebasing becomes too conflict-heavy, preserve remote support as a small, auditable patch stack and cherry-pick it onto fresh upstream `main` snapshots.

## Sync status (latest)

- Local `main` reference: `63028fd`
- Local `remote-api` reference after sync: `98e0069`
- Result: `remote-api` already contains `main` at this snapshot (`git merge main` reported up to date; `main` is an ancestor of `remote-api`).

When upstream main advances beyond `63028fd`, repeat the checklist above and re-validate remote provider behavior.
