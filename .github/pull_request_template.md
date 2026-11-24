<!-- The title is a Conventional Commit (feat: ..., fix: ..., docs: ...): it becomes the squashed commit and the changelog entry. -->

## What and why

<!-- What this changes, and the issue it closes (Closes #123). A feature of NSH's own needs an accepted Feature proposal first. -->

## Checklist

- [ ] `src/`: one export per file, exported from `src/index.ts` (or `src/persist/index.ts`), with TSDoc and an example
- [ ] `tests/fixtures/<topic>/` has a fixture and `tests/<topic>.test.tsx` cases for the change
- [ ] New exports are listed in `tests/types/public-api.ts`; public types have cases in `tests/types/`
- [ ] `tests/api-surface.json` updated (if the exports changed)
- [ ] `docs/api.md` has a section for a new export
- [ ] `docs/differences.md` updated (if the behavior differs from TanStack's documentation)
- [ ] An ADR in `docs/adr/` added or updated (if a design decision changed)
- [ ] `scripts/check.sh` passes locally
