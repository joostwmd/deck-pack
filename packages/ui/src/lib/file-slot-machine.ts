/**
 * Finite state machine for a single file upload slot (empty → uploading → filled, etc.).
 * Transitions are a lookup table — illegal (status, event) pairs are no-ops.
 */

export type FileSlotCurrent = {
  /** Display name (usually the original filename or basename of blobPath). */
  name: string;
  contentType: string;
  blobPath: string;
  byteSize?: number;
};

export type FileSlotState =
  | { status: "empty" }
  | { status: "uploading"; file: File; progress: number; previous?: FileSlotCurrent }
  | { status: "filled"; current: FileSlotCurrent }
  | { status: "replacing"; current: FileSlotCurrent }
  | { status: "error"; message: string; current?: FileSlotCurrent };

export type FileSlotEvent =
  | { type: "HYDRATE"; current: FileSlotCurrent | null }
  | { type: "SELECT"; file: File }
  | { type: "PROGRESS"; progress: number }
  | { type: "SUCCESS"; current: FileSlotCurrent }
  | { type: "FAIL"; message: string }
  | { type: "REPLACE" }
  | { type: "CANCEL_REPLACE" };

type Transition<S extends FileSlotState["status"], E extends FileSlotEvent["type"]> = (
  state: Extract<FileSlotState, { status: S }>,
  event: Extract<FileSlotEvent, { type: E }>,
) => FileSlotState;

type TransitionTable = {
  [S in FileSlotState["status"]]?: {
    [E in FileSlotEvent["type"]]?: Transition<S, E>;
  };
};

function sameCurrent(a: FileSlotCurrent | null | undefined, b: FileSlotCurrent | null | undefined): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return (
    a.blobPath === b.blobPath &&
    a.contentType === b.contentType &&
    a.name === b.name &&
    a.byteSize === b.byteSize
  );
}

/** HYDRATE that returns the existing state reference when nothing meaningful changed. */
function hydrate(state: FileSlotState, current: FileSlotCurrent | null): FileSlotState {
  if (!current) {
    if (state.status === "empty") return state;
    if (state.status === "error" && !state.current) return state;
    return { status: "empty" };
  }
  if (
    (state.status === "filled" || state.status === "replacing") &&
    sameCurrent(state.current, current)
  ) {
    return state;
  }
  if (state.status === "error" && sameCurrent(state.current, current)) {
    return { status: "filled", current };
  }
  return { status: "filled", current };
}

const transitions: TransitionTable = {
  empty: {
    SELECT: (_state, event) => ({
      status: "uploading",
      file: event.file,
      progress: 0,
    }),
    HYDRATE: (state, event) => hydrate(state, event.current),
  },
  filled: {
    REPLACE: (state) => ({ status: "replacing", current: state.current }),
    HYDRATE: (state, event) => hydrate(state, event.current),
  },
  replacing: {
    CANCEL_REPLACE: (state) => ({ status: "filled", current: state.current }),
    SELECT: (state, event) => ({
      status: "uploading",
      file: event.file,
      progress: 0,
      previous: state.current,
    }),
    // Server refresh while choosing a replacement should not kick you out of replace mode
    // unless the attached file actually changed.
    HYDRATE: (state, event) => {
      if (!event.current) return { status: "empty" };
      if (sameCurrent(state.current, event.current)) return state;
      return { status: "filled", current: event.current };
    },
  },
  uploading: {
    PROGRESS: (state, event) => {
      const progress = clampProgress(event.progress);
      if (progress === state.progress) return state;
      return { ...state, progress };
    },
    SUCCESS: (_state, event) => ({ status: "filled", current: event.current }),
    FAIL: (state, event) =>
      state.previous
        ? { status: "filled", current: state.previous }
        : { status: "error", message: event.message },
  },
  error: {
    SELECT: (_state, event) => ({
      status: "uploading",
      file: event.file,
      progress: 0,
    }),
    HYDRATE: (state, event) => hydrate(state, event.current),
  },
};

export function createInitialFileSlotState(
  current: FileSlotCurrent | null,
): FileSlotState {
  return current ? { status: "filled", current } : { status: "empty" };
}

export function fileSlotReducer(state: FileSlotState, event: FileSlotEvent): FileSlotState {
  const handler = transitions[state.status]?.[event.type] as
    | ((s: FileSlotState, e: FileSlotEvent) => FileSlotState)
    | undefined;
  return handler ? handler(state, event) : state;
}

export function fileSlotShowsDropzone(state: FileSlotState): boolean {
  return state.status === "empty" || state.status === "replacing" || state.status === "error";
}

export function fileSlotShowsCurrentCard(state: FileSlotState): boolean {
  return (
    state.status === "filled" ||
    state.status === "replacing" ||
    (state.status === "uploading" && Boolean(state.previous)) ||
    (state.status === "error" && Boolean(state.current))
  );
}

export function fileSlotCurrentForCard(state: FileSlotState): FileSlotCurrent | null {
  if (state.status === "filled" || state.status === "replacing") return state.current;
  if (state.status === "uploading") return state.previous ?? null;
  if (state.status === "error") return state.current ?? null;
  return null;
}

/** Dropzone or in-flight list — keep the uploader mounted for these statuses. */
export function fileSlotNeedsUploader(state: FileSlotState): boolean {
  return (
    state.status === "empty" ||
    state.status === "replacing" ||
    state.status === "uploading" ||
    state.status === "error"
  );
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}
