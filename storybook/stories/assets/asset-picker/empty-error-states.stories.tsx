import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flag } from "@phosphor-icons/react";

import { EmptyState } from "@/components/asset-browser/empty-state";
import { ErrorState } from "@/components/asset-browser/error-state";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/AssetPicker/EmptyErrorStates",
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Shared empty and error states used across asset picker flows.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Empty state prompting the user to start a search.
 */
export const EmptyDefault: Story = {
  render: () => (
    <EmptyState
      icon={Flag}
      title="No flags found"
      description="Try searching for a different country name or code."
    />
  ),
};

/**
 * @summary Error state with retry button for failed API calls.
 */
export const ErrorDefault: Story = {
  tags: ["!manifest"],
  render: () => (
    <ErrorState
      title="Could not search for flags"
      description="Search service unavailable"
      onRetry={() => undefined}
    />
  ),
};
