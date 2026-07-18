import type { Meta, StoryObj } from "@storybook/react-vite";

import { HarveyBallsPanelView } from "@/components/harvey-balls/harvey-balls-panel-view";

import { withAssetsPanel } from "../decorators";
import { createHarveyBallsPanelController } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/HarveyBalls/HarveyBallsPanelView",
  component: HarveyBallsPanelView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pure Harvey balls panel view. Receives a controller from `useHarveyBallsPanelController`.",
      },
    },
  },
} satisfies Meta<typeof HarveyBallsPanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default 50% Harvey ball with valid insert state.
 */
export const Default: Story = {
  render: () => <HarveyBallsPanelView controller={createHarveyBallsPanelController()} />,
};

/**
 * @summary Invalid configuration showing inline validation message.
 */
export const InvalidConfig: Story = {
  tags: ["!manifest"],
  render: () => (
    <HarveyBallsPanelView
      controller={createHarveyBallsPanelController({
        validation: { valid: false, message: "Outline width must be between 0 and 20." },
        canInsert: false,
      })}
    />
  ),
};
