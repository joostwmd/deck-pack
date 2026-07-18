import type { Meta, StoryObj } from "@storybook/react-vite";

import { AssetsShellFrame } from "../shell-story-router";

const meta = {
  title: "Assets/Shell/AssetsShell",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PlaceholderContent({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Panel content renders in this area. Use navigation to switch features.
      </p>
    </div>
  );
}

export const OfficeMode: Story = {
  render: () => (
    <AssetsShellFrame mode="office">
      <PlaceholderContent title="Office taskpane" />
    </AssetsShellFrame>
  ),
};

export const WebMode: Story = {
  render: () => (
    <AssetsShellFrame mode="web" layout="panel">
      <PlaceholderContent title="Web sidebar" />
    </AssetsShellFrame>
  ),
};
