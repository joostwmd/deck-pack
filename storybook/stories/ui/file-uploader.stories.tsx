import type { Meta, StoryObj } from "@storybook/react-vite";

import { FileUploaderView } from "@deck-pack/ui/components/composite/file-uploader-view";
import { ThemeProvider } from "@deck-pack/ui/components/system/theme-provider";
import { useFileUploaderController } from "@deck-pack/ui/hooks/use-file-uploader-controller";

const meta = {
  title: "Composite/FileUploader",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="bg-background w-[420px] p-4 text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

async function simulateUpload(
  _file: File,
  options: { onProgress: (progress: number) => void },
): Promise<void> {
  for (const progress of [10, 35, 60, 85, 100]) {
    options.onProgress(progress);
    await new Promise((resolve) => {
      setTimeout(resolve, 120);
    });
  }
}

function FileUploaderDemo(props: {
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  fail?: boolean;
}) {
  const controller = useFileUploaderController({
    accept: props.accept,
    maxFiles: props.maxFiles,
    maxSize: props.maxSize,
    multiple: true,
    label: "Upload assets",
    description: "SVG, PNG, or PPTX up to 10 MB.",
    uploadFile: async (file, options) => {
      if (props.fail) {
        options.onProgress(40);
        await new Promise((resolve) => {
          setTimeout(resolve, 200);
        });
        throw new Error(`Failed to upload ${file.name}`);
      }
      await simulateUpload(file, options);
    },
    onFileValidate: (file) => {
      if (file.name.toLowerCase().endsWith(".exe")) {
        return "Executable files are not allowed";
      }
      return null;
    },
  });

  return <FileUploaderView {...controller} />;
}

export const Default: Story = {
  render: () => <FileUploaderDemo />,
};

export const ImagesOnly: Story = {
  render: () => (
    <FileUploaderDemo accept="image/png,image/jpeg,image/svg+xml" maxFiles={3} />
  ),
};

export const UploadError: Story = {
  render: () => <FileUploaderDemo fail />,
};
