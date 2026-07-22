import type { ResolvedShortcut } from "@deck-pack/shortcuts";

export type RecorderState =
  | { status: "idle" }
  | { status: "recording"; draftHotkey?: string }
  | { status: "valid-draft"; draftHotkey: string }
  | { status: "internal-conflict"; draftHotkey: string; conflict: ResolvedShortcut }
  | { status: "powerpoint-warning"; draftHotkey: string }
  | { status: "saving"; draftHotkey: string }
  | { status: "error"; draftHotkey: string; message: string };

export type RecorderEvent =
  | { type: "start-recording" }
  | { type: "record"; hotkey: string }
  | { type: "cancel" }
  | { type: "accept-powerpoint-warning" }
  | { type: "save" }
  | { type: "save-success" }
  | { type: "save-error"; message: string };

export function recorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  switch (event.type) {
    case "start-recording":
      return { status: "recording" };
    case "record":
      return { status: "valid-draft", draftHotkey: event.hotkey };
    case "cancel":
      return { status: "idle" };
    case "accept-powerpoint-warning":
      if (state.status !== "powerpoint-warning") return state;
      return { status: "valid-draft", draftHotkey: state.draftHotkey };
    case "save":
      if (state.status !== "valid-draft" && state.status !== "powerpoint-warning") return state;
      return { status: "saving", draftHotkey: state.draftHotkey };
    case "save-success":
      return { status: "idle" };
    case "save-error":
      return { status: "error", draftHotkey: event.message, message: event.message };
    default:
      return state;
  }
}

export function applyValidation(
  state: RecorderState,
  conflict: ResolvedShortcut | null,
  powerPointConflict: boolean,
): RecorderState {
  if (state.status !== "valid-draft" && state.status !== "recording") {
    return state;
  }

  const draftHotkey = state.status === "recording" ? state.draftHotkey : state.draftHotkey;
  if (!draftHotkey) {
    return state.status === "recording" ? state : { status: "recording" };
  }

  if (conflict) {
    return { status: "internal-conflict", draftHotkey, conflict };
  }

  if (powerPointConflict) {
    return { status: "powerpoint-warning", draftHotkey };
  }

  return { status: "valid-draft", draftHotkey };
}
