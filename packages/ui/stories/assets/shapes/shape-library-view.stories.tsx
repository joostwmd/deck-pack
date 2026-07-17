import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShapeLibraryView } from "@/features/shapes/shape-library-view";

import { withAssetsPanel } from "../decorators";
import { createShapeLibraryController } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Shapes/ShapeLibraryView",
  component: ShapeLibraryView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pure shape library view. Receives a controller object from `useShapeLibraryController`.",
      },
    },
  },
} satisfies Meta<typeof ShapeLibraryView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Loading state before the first shape batch arrives.
 */
export const Default: Story = {
  render: () => (
    <ShapeLibraryView
      controller={createShapeLibraryController({
        flow: {
          results: [],
          hasLoaded: false,
          isLoading: true,
          highlightedShapeId: null,
          selectedId: null,
          selectedShape: null,
        },
        insertDisabled: true,
      })}
    />
  ),
};

/**
 * @summary Loaded category grid with insert enabled.
 */
export const WithResults: Story = {
  render: () => <ShapeLibraryView controller={createShapeLibraryController()} />,
};

/**
 * @summary Failed shape fetch with retry affordance.
 */
export const LoadError: Story = {
  tags: ["!manifest"],
  render: () => (
    <ShapeLibraryView
      controller={createShapeLibraryController({
        flow: {
          results: [],
          hasLoaded: true,
          isLoading: false,
          error: "Shape library unavailable",
          highlightedShapeId: null,
          selectedId: null,
          selectedShape: null,
        },
        insertDisabled: true,
      })}
    />
  ),
};
