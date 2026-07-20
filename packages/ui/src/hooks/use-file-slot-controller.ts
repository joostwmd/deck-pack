import { useEffect, useReducer, useRef, type Dispatch } from "react";

import type { FileUploaderViewProps } from "../components/composite/file-uploader-view";
import {
  createInitialFileSlotState,
  fileSlotCurrentForCard,
  fileSlotNeedsUploader,
  fileSlotReducer,
  fileSlotShowsCurrentCard,
  fileSlotShowsDropzone,
  type FileSlotCurrent,
  type FileSlotEvent,
  type FileSlotState,
} from "../lib/file-slot-machine";
import {
  useFileUploaderController,
  type UploadFileFn,
} from "./use-file-uploader-controller";

export type UseFileSlotControllerOptions = {
  /** Server-attached file for this slot (null when missing). */
  current: FileSlotCurrent | null;
  uploadFile: UploadFileFn;
  accept?: string;
  label: string;
  description?: string;
  selectLabel?: string;
  disabled?: boolean;
  /** Called after a successful upload (e.g. invalidate queries). */
  onUploaded?: () => void;
};

export type FileSlotController = {
  state: FileSlotState;
  dispatch: Dispatch<FileSlotEvent>;
  uploader: FileUploaderViewProps;
  showDropzone: boolean;
  showCurrentCard: boolean;
  currentForCard: FileSlotCurrent | null;
  needsUploader: boolean;
  label: string;
  disabled: boolean;
};

function currentKeyOf(current: FileSlotCurrent | null): string {
  if (!current) return "";
  return `${current.blobPath}|${current.contentType}|${current.name}|${String(current.byteSize ?? "")}`;
}

export function useFileSlotController(
  options: UseFileSlotControllerOptions,
): FileSlotController {
  const [state, dispatch] = useReducer(
    fileSlotReducer,
    options.current,
    createInitialFileSlotState,
  );

  const stateRef = useRef(state);
  stateRef.current = state;
  const onUploadedRef = useRef(options.onUploaded);
  onUploadedRef.current = options.onUploaded;
  const uploadFileRef = useRef(options.uploadFile);
  uploadFileRef.current = options.uploadFile;
  const currentRef = useRef(options.current);
  currentRef.current = options.current;

  const currentKey = currentKeyOf(options.current);

  // Sync from server only when the attached file identity changes — not on every new object ref.
  useEffect(() => {
    if (stateRef.current.status === "uploading") return;
    dispatch({ type: "HYDRATE", current: currentRef.current });
  }, [currentKey]);

  const uploader = useFileUploaderController({
    uploadFile: async (file, { onProgress }) => {
      dispatch({ type: "SELECT", file });
      try {
        await uploadFileRef.current(file, {
          onProgress: (progress) => {
            dispatch({ type: "PROGRESS", progress });
            onProgress(progress);
          },
        });
        dispatch({
          type: "SUCCESS",
          current: {
            name: file.name,
            contentType: file.type || "application/octet-stream",
            blobPath: file.name,
            byteSize: file.size,
          },
        });
        onUploadedRef.current?.();
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Upload failed";
        dispatch({ type: "FAIL", message });
        throw cause instanceof Error ? cause : new Error(message);
      }
    },
    accept: options.accept,
    maxFiles: 1,
    multiple: false,
    disabled: options.disabled,
    label: options.label,
    description: options.description ?? "Drop a file or browse.",
    selectLabel: options.selectLabel ?? "Select file",
  });

  const filesRef = useRef(uploader.value);
  filesRef.current = uploader.value;
  const onValueChange = uploader.onValueChange;

  // Clear local File[] after settle — only when non-empty (setFiles([]) every time loops forever).
  useEffect(() => {
    if (state.status !== "filled" && state.status !== "empty") return;
    if (filesRef.current.length === 0) return;
    onValueChange([]);
  }, [state.status, onValueChange]);

  return {
    state,
    dispatch,
    uploader,
    showDropzone: fileSlotShowsDropzone(state),
    showCurrentCard: fileSlotShowsCurrentCard(state),
    currentForCard: fileSlotCurrentForCard(state),
    needsUploader: fileSlotNeedsUploader(state),
    label: options.label,
    disabled: Boolean(options.disabled),
  };
}
