import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HarveyBallControls } from "@/components/harvey-balls/harvey-ball-controls";
import {
  DEFAULT_HARVEY_BALL_CONFIG,
  normalizeHarveyBallConfig,
  type HarveyBallConfig,
} from "@/utils/harvey-ball-svg";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/HarveyBalls/HarveyBallControls",
  component: HarveyBallControls,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Percentage, preset, and color controls for Harvey ball configuration.",
      },
    },
  },
} satisfies Meta<typeof HarveyBallControls>;

export default meta;
type Story = StoryObj<typeof meta>;

function HarveyBallControlsDemo({
  initialConfig = DEFAULT_HARVEY_BALL_CONFIG,
}: {
  initialConfig?: HarveyBallConfig;
}) {
  const [config, setConfig] = useState(initialConfig);

  return (
    <div className="p-4">
      <HarveyBallControls
        config={config}
        onChange={(next) =>
          setConfig((current) => normalizeHarveyBallConfig({ ...current, ...next }))
        }
      />
    </div>
  );
}

/**
 * @summary Default control set at 50% fill.
 */
export const Default: Story = {
  render: () => <HarveyBallControlsDemo />,
};

/**
 * @summary Fully filled Harvey ball preset selected.
 */
export const FullPreset: Story = {
  render: () => (
    <HarveyBallControlsDemo
      initialConfig={{
        ...DEFAULT_HARVEY_BALL_CONFIG,
        percentage: 100,
        fillColor: "#2563eb",
      }}
    />
  ),
};
