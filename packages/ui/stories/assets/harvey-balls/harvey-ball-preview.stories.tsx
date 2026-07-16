import type { Meta, StoryObj } from "@storybook/react-vite";

import { HarveyBallPreview } from "@/components/harvey-ball/harvey-ball-preview";
import { DEFAULT_HARVEY_BALL_CONFIG } from "@/lib/harvey-ball-svg";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/HarveyBalls/HarveyBallPreview",
  component: HarveyBallPreview,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "SVG preview of a Harvey ball at the current configuration.",
      },
    },
  },
} satisfies Meta<typeof HarveyBallPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default 50% Harvey ball preview.
 */
export const Default: Story = {
  render: () => (
    <div className="flex justify-center p-8">
      <HarveyBallPreview config={DEFAULT_HARVEY_BALL_CONFIG} className="size-40" />
    </div>
  ),
};

/**
 * @summary Empty Harvey ball at 0% fill.
 */
export const Empty: Story = {
  tags: ["!manifest"],
  render: () => (
    <div className="flex justify-center p-8">
      <HarveyBallPreview
        config={{ ...DEFAULT_HARVEY_BALL_CONFIG, percentage: 0 }}
        className="size-40"
      />
    </div>
  ),
};

/**
 * @summary Fully filled Harvey ball at 100%.
 */
export const Full: Story = {
  render: () => (
    <div className="flex justify-center p-8">
      <HarveyBallPreview
        config={{ ...DEFAULT_HARVEY_BALL_CONFIG, percentage: 100, fillColor: "#2563eb" }}
        className="size-40"
      />
    </div>
  ),
};
