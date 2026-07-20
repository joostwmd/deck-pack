import { UploadSimple, X } from "@phosphor-icons/react";

import { buttonVariants } from "@deck-pack/ui/components/system/button";
import {
  FileUpload,
  FileUploadClear,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  FileUploadTrigger,
  type FileUploadProps,
} from "@deck-pack/ui/components/system/file-upload";
import { cn } from "@deck-pack/ui/lib/utils";

export type FileUploaderViewProps = {
  value: File[];
  onValueChange: (files: File[]) => void;
  onUpload: NonNullable<FileUploadProps["onUpload"]>;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
  description?: string;
  selectLabel?: string;
  clearLabel?: string;
  onFileValidate?: FileUploadProps["onFileValidate"];
  onFileReject?: FileUploadProps["onFileReject"];
  className?: string;
};

export function FileUploaderView({
  value,
  onValueChange,
  onUpload,
  accept,
  maxFiles,
  maxSize,
  multiple = true,
  disabled = false,
  invalid = false,
  label = "Upload files",
  description = "Drag and drop files here, or click to browse.",
  selectLabel = "Select files",
  clearLabel = "Clear all",
  onFileValidate,
  onFileReject,
  className,
}: FileUploaderViewProps) {
  return (
    <FileUpload
      value={value}
      onValueChange={onValueChange}
      onUpload={onUpload}
      accept={accept}
      maxFiles={maxFiles}
      maxSize={maxSize}
      multiple={multiple}
      disabled={disabled}
      invalid={invalid}
      label={label}
      onFileValidate={onFileValidate}
      onFileReject={onFileReject}
      className={cn("w-full", className)}
    >
      <FileUploadDropzone className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
        <div className="bg-muted flex size-10 items-center justify-center rounded-full">
          <UploadSimple className="text-muted-foreground size-5" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <FileUploadTrigger
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {selectLabel}
        </FileUploadTrigger>
      </FileUploadDropzone>

      <FileUploadList className="gap-2">
        {value.map((file) => (
          <FileUploadItem key={`${file.name}-${String(file.size)}-${String(file.lastModified)}`} value={file}>
            <FileUploadItemPreview />
            <FileUploadItemMetadata />
            <FileUploadItemProgress />
            <FileUploadItemDelete
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-xs" }),
                "ml-auto",
              )}
              aria-label={`Remove ${file.name}`}
            >
              <X aria-hidden />
            </FileUploadItemDelete>
          </FileUploadItem>
        ))}
      </FileUploadList>

      <div className="flex justify-end">
        <FileUploadClear
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {clearLabel}
        </FileUploadClear>
      </div>
    </FileUpload>
  );
}
