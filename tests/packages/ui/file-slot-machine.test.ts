import { describe, expect, it } from "vitest";

import {
  createInitialFileSlotState,
  fileSlotCurrentForCard,
  fileSlotNeedsUploader,
  fileSlotReducer,
  fileSlotShowsCurrentCard,
  fileSlotShowsDropzone,
  type FileSlotCurrent,
} from "@deck-pack/ui/lib/file-slot-machine";

const current: FileSlotCurrent = {
  name: "flag.png",
  contentType: "image/png",
  blobPath: "global/flag/1/flag.png",
  byteSize: 2048,
};

function file(name = "next.png"): File {
  return new File([new Uint8Array(8)], name, { type: "image/png" });
}

describe("fileSlotReducer", () => {
  it("starts empty or filled from hydrate seed", () => {
    expect(createInitialFileSlotState(null)).toEqual({ status: "empty" });
    expect(createInitialFileSlotState(current)).toEqual({
      status: "filled",
      current,
    });
  });

  it("empty → uploading → filled on success", () => {
    let state = createInitialFileSlotState(null);
    const selected = file();
    state = fileSlotReducer(state, { type: "SELECT", file: selected });
    expect(state).toMatchObject({ status: "uploading", progress: 0 });
    expect(fileSlotShowsDropzone(state)).toBe(false);
    expect(fileSlotNeedsUploader(state)).toBe(true);

    state = fileSlotReducer(state, { type: "PROGRESS", progress: 40 });
    expect(state).toMatchObject({ status: "uploading", progress: 40 });

    state = fileSlotReducer(state, { type: "SUCCESS", current });
    expect(state).toEqual({ status: "filled", current });
    expect(fileSlotShowsDropzone(state)).toBe(false);
    expect(fileSlotShowsCurrentCard(state)).toBe(true);
    expect(fileSlotNeedsUploader(state)).toBe(false);
  });

  it("filled → replacing → cancel returns to filled", () => {
    let state = createInitialFileSlotState(current);
    state = fileSlotReducer(state, { type: "REPLACE" });
    expect(state).toEqual({ status: "replacing", current });
    expect(fileSlotShowsDropzone(state)).toBe(true);
    expect(fileSlotShowsCurrentCard(state)).toBe(true);

    state = fileSlotReducer(state, { type: "CANCEL_REPLACE" });
    expect(state).toEqual({ status: "filled", current });
  });

  it("replacing → uploading keeps previous; fail restores filled", () => {
    let state = createInitialFileSlotState(current);
    state = fileSlotReducer(state, { type: "REPLACE" });
    const selected = file("replacement.png");
    state = fileSlotReducer(state, { type: "SELECT", file: selected });
    expect(state).toMatchObject({
      status: "uploading",
      previous: current,
    });
    expect(fileSlotCurrentForCard(state)).toEqual(current);

    state = fileSlotReducer(state, { type: "FAIL", message: "network" });
    expect(state).toEqual({ status: "filled", current });
  });

  it("empty upload fail goes to error", () => {
    let state = createInitialFileSlotState(null);
    state = fileSlotReducer(state, { type: "SELECT", file: file() });
    state = fileSlotReducer(state, { type: "FAIL", message: "boom" });
    expect(state).toEqual({ status: "error", message: "boom" });
    expect(fileSlotShowsDropzone(state)).toBe(true);
  });

  it("ignores illegal transitions", () => {
    const filled = createInitialFileSlotState(current);
    expect(fileSlotReducer(filled, { type: "CANCEL_REPLACE" })).toEqual(filled);
    expect(fileSlotReducer(filled, { type: "PROGRESS", progress: 10 })).toEqual(filled);
  });

  it("HYDRATE updates filled and can clear to empty", () => {
    let state = createInitialFileSlotState(current);
    const next = { ...current, name: "other.png", blobPath: "other.png" };
    state = fileSlotReducer(state, { type: "HYDRATE", current: next });
    expect(state).toEqual({ status: "filled", current: next });

    state = fileSlotReducer(state, { type: "HYDRATE", current: null });
    expect(state).toEqual({ status: "empty" });
  });

  it("HYDRATE is a no-op when the attached file is unchanged", () => {
    const filled = createInitialFileSlotState(current);
    const again = fileSlotReducer(filled, {
      type: "HYDRATE",
      current: { ...current },
    });
    expect(again).toBe(filled);

    const empty = createInitialFileSlotState(null);
    expect(fileSlotReducer(empty, { type: "HYDRATE", current: null })).toBe(empty);
  });
});
