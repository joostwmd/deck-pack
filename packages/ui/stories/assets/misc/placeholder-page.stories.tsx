import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderPage } from "@/features/placeholder-page";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/Misc/PlaceholderPage",
  component: PlaceholderPage,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Coming-soon placeholder used for routes without a finished feature panel.",
      },
    },
  },
} satisfies Meta<typeof PlaceholderPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Standard coming-soon page with header and centered message.
 */
export const Default: Story = {
  args: {
    title: "Themes",
    description: "Customize fonts, colors, and slide masters for your deck.",
  },
};
