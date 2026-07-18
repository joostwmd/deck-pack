import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormatPanelView } from "@/components/format/format-panel-view";

import { withAssetsPanel } from "../decorators";
import { createFormatPanelController } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Format/FormatPanelView",
  component: FormatPanelView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pure format panel view. Receives a controller from `useFormatPanelController`. Office guard wraps the interactive controls.",
      },
    },
  },
} satisfies Meta<typeof FormatPanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Format panel with a single selected shape and ready controls.
 */
export const Default: Story = {
  render: () => (
    <FormatPanelView
      minTextApi="1.5"
      controller={createFormatPanelController()}
    />
  ),
};

/**
 * @summary Selection refresh error surfaced above the tabs.
 */
export const SelectionError: Story = {
  tags: ["!manifest"],
  render: () => (
    <FormatPanelView
      minTextApi="1.5"
      controller={createFormatPanelController({
        state: { status: "error", message: "Could not read the current selection." },
      })}
    />
  ),
};
