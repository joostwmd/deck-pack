import { useCallback, useState } from "react";

import type { FileUploaderViewProps } from "../components/composite/file-uploader-view";

export type UploadFileFn = (
  file: File,
  options: { onProgress: (progress: number) => void },
) => Promise<void>;

export type UseFileUploaderControllerOptions = {
  /** Performs the actual upload (e.g. SAS mint + PUT). Injected for tests / providers. */
  uploadFile: UploadFileFn;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  selectLabel?: string;
  clearLabel?: string;
  onFileValidate?: (file: File) => string | null | undefined;
  onFileReject?: (file: File, message: string) => void;
};

export function useFileUploaderController(
  options: UseFileUploaderControllerOptions,
): FileUploaderViewProps {
  const [files, setFiles] = useState<File[]>([]);

  const onUpload = useCallback<NonNullable<FileUploaderViewProps["onUpload"]>>(
    async (acceptedFiles, { onProgress, onSuccess, onError }) => {
      await Promise.all(
        acceptedFiles.map(async (file) => {
          try {
            await options.uploadFile(file, {
              onProgress: (progress) => {
                onProgress(file, clampProgress(progress));
              },
            });
            onSuccess(file);
          } catch (cause) {
            onError(
              file,
              cause instanceof Error ? cause : new Error("Upload failed"),
            );
          }
        }),
      );
    },
    [options.uploadFile],
  );

  return {
    value: files,
    onValueChange: setFiles,
    onUpload,
    accept: options.accept,
    maxFiles: options.maxFiles,
    maxSize: options.maxSize,
    multiple: options.multiple ?? true,
    disabled: options.disabled,
    label: options.label,
    description: options.description,
    selectLabel: options.selectLabel,
    clearLabel: options.clearLabel,
    onFileValidate: options.onFileValidate,
    onFileReject: options.onFileReject,
  };
}

export type FileUploaderController = ReturnType<typeof useFileUploaderController>;

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }
  return Math.min(100, Math.max(0, progress));
}
