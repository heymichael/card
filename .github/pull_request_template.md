## Summary

- [ ] Briefly describe what changed (1-3 bullets)
- [ ] Include key files or contracts affected

## Why

Describe the problem or outcome this PR addresses. Focus on why this work is needed, not just what files changed.

## Todo Mapping

Reference relevant todo items using file + item number.

- [ ] `todo/todo.md` item #N - <title>
- [ ] N/A

## Validation

List only checks that were actually run for this PR.

- [ ] `python3 scripts/generate_docs_pages.py`
- [ ] `bash scripts/sync_docs.sh`
- [ ] <other command actually run>
- [ ] N/A

If generated files are part of this change, include the generation and sync steps above.
If requirements docs changed, also include requirements-specific validation (catalog regeneration, sync to hosting, and `tab=requirements` / `project=` behavior checks).

## Deploy / Ops Notes

Call out operational impact explicitly:

- **Firebase Hosting:** <impact, rollback notes, or N/A>
- **Cloud Run / docs services:** <impact or N/A>
- **Auth / IAP / secrets:** <new requirements, rotations, or N/A>

## Risks / Follow-ups

- [ ] Known risks
- [ ] Follow-up tasks
- [ ] N/A
