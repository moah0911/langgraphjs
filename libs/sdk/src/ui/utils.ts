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

/**
 * `state` without the task errors that `before` did not show. The tasks a
 * stop cancels read as failed, so a read after the stop would show the
 * cancellation as the thread's error.
 */
export function withoutNewTaskErrors<S extends ThreadState>(
  state: S,
  before: ThreadState | undefined
): S {
  const shown = new Map(before?.tasks?.map((task) => [task.id, task.error]));
  return {
    ...state,
    tasks: state.tasks?.map((task) =>
      task.error == null || shown.get(task.id) === task.error
        ? task
        : { ...task, error: null }
    ),
  };
}

/** Options for one read of a thread's history. */
export type HistoryReadOptions<StateType extends Record<string, unknown>> = {
  /** A failed read records no error and calls no `onError`. */
  quiet?: boolean;
  /** Changes the states read before they are shown. */
  map?: (data: ThreadState<StateType>[]) => ThreadState<StateType>[];
};

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
