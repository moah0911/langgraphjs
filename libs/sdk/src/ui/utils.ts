import type { ThreadState } from "../schema.js";

/**
 * Returns true when `onFinish` declares at least one parameter and therefore
 * needs the server-fetched thread head. A zero-arity `onFinish` is treated as
 * side-effect-only and does not trigger a post-stream `getHistory` when
 * branching history is not enabled.
 *
 * Note: functions with only default parameters report `.length === 0` in
 * JavaScript; if you need the thread state, declare at least one non-default
 * parameter (e.g. `(state)` or `(_state, run)`).
 */
export function onFinishRequiresThreadState(onFinish: unknown): boolean {
  if (typeof onFinish !== "function") return false;
  return onFinish.length > 0;
}

/**
 * Whether a thread state has interrupts, a node still to run or a task error,
 * all of which a run on the thread can answer or clear.
 */
export function hasInterruptOrError(state: ThreadState | undefined): boolean {
  if (state == null) return false;
  return (
    (state.next?.length ?? 0) > 0 ||
    (state.tasks ?? []).some(
      (task) => task.error != null || (task.interrupts?.length ?? 0) > 0
    )
  );
}

export function unique<T>(array: T[]) {
  return [...new Set(array)] as T[];
}

export function findLast<T>(array: T[], predicate: (item: T) => boolean) {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (predicate(array[i])) return array[i];
  }
  return undefined;
}

export async function* filterStream<T, TReturn>(
  stream: AsyncGenerator<T, TReturn>,
  filter: (event: T) => boolean
): AsyncGenerator<T, TReturn> {
  while (true) {
    const { value, done } = await stream.next();
    if (done) return value as TReturn;
    if (filter(value)) yield value as T;
  }
}
