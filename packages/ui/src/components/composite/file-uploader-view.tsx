import { File as FileIcon, UploadSimple, X } from "@phosphor-icons/react";

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
  /** Hide the dropzone (e.g. while uploading after a file was selected). */
  showDropzone?: boolean;
  /** Tighter dropzone for slot UIs. */
  compact?: boolean;
  /** Always show a subtle file icon instead of image thumbnails. Default true. */
  forceFileIcon?: boolean;
};

function SubtleFileIcon() {
  return <FileIcon className="text-muted-foreground size-5" weight="regular" aria-hidden />;
}

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
  showDropzone = true,
  compact = false,
  forceFileIcon = true,
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
      {showDropzone ? (
        <FileUploadDropzone
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center",
            compact ? "px-4 py-6" : "gap-3 px-6 py-10",
          )}
        >
          <div
            className={cn(
              "bg-muted flex items-center justify-center rounded-full",
              compact ? "size-8" : "size-10",
            )}
          >
            <UploadSimple
              className={cn("text-muted-foreground", compact ? "size-4" : "size-5")}
              aria-hidden
            />
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
      ) : null}

      <FileUploadList className="gap-2">
        {value.map((file) => (
          <FileUploadItem
            key={`${file.name}-${String(file.size)}-${String(file.lastModified)}`}
            value={file}
          >
            <FileUploadItemPreview
              className="bg-muted/50 [&>svg]:size-5"
              render={forceFileIcon ? () => <SubtleFileIcon /> : undefined}
            />
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

      {value.length > 0 ? (
        <div className="flex justify-end">
          <FileUploadClear
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            {clearLabel}
          </FileUploadClear>
        </div>
      ) : null}
    </FileUpload>
  );
}
