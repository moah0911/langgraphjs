---
"@langchain/langgraph-sdk": patch
---

fix(sdk): keep the session on stop and stop showing answered approvals

- `stop()` in the `useStream` hook and `StreamOrchestrator` no longer puts back the thread state read when the thread opened. With no `fetchStateHistory` and no `onFinish` that takes the thread state, that erased every turn sent since and a new chat went blank. A stop now reads the thread's current state and shows the turns the server kept, still without the half-streamed message of the stopped run. Without history the read leaves the thread head alone, so the cancellation does not show as an error and the node it cut off does not show as a breakpoint. With a user-supplied `thread` and no history nothing is read and the thread's data shows, as before. Edits made with `onStop({ mutate })` now stay, applied again on top of what the stop shows. If the read fails, the screen keeps what it shows, and without history no error is reported. The read's values are dropped when the thread changes or another run starts meanwhile, including a run queued before the stop. With history, the read still updates the history, as before.
- After a run succeeds, the thread is read again when the state shown had an interrupt, a node still to run or a task error, so an answered approval does not come back and an old error clears. A run on a thread that showed none of these makes no extra request. If that read fails, with or without history, the run still counts as a success and an `onFinish` that takes no parameters is still called.
- When `joinStream` ends with history enabled, the state read after it replaces the joined stream's last values.
