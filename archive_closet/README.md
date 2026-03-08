# archive_closet

This directory contains components and types from earlier design iterations that were superseded during the transition to the current architecture.

## Contents

- `src/components/studio/PromptArchitectPanel.tsx` — Early visual prompt-building panel, replaced by the current task/workspace UI.
- `src/types/` — Type definitions (`prompt.ts`, `design.ts`, `flow.ts`, `placement.ts`, `shared.ts`) from the original studio architecture.

These files are kept for historical reference and are **not imported by any active code path**. They will be removed in a future cleanup once the current architecture is fully stable.
