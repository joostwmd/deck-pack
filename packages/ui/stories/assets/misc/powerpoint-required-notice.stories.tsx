import type { Meta, StoryObj } from "@storybook/react-vite";

import { PowerPointRequiredNoticeView } from "@/components/powerpoint-required-notice-view";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/Misc/PowerPointRequiredNotice",
  component: PowerPointRequiredNoticeView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Notices shown when a feature requires the Office host or a newer PowerPoint API version.",
      },
    },
  },
} satisfies Meta<typeof PowerPointRequiredNoticeView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Host-required notice for web preview mode.
 */
export const HostRequired: Story = {
  args: {
    kind: "host",
  },
};

/**
 * @summary API version warning for features needing a newer PowerPoint build.
 */
export const ApiVersionRequired: Story = {
  tags: ["!manifest"],
  args: {
    kind: "api",
    minApi: "1.5",
  },
};
