import type { Meta, StoryObj } from "@storybook/react-vite";

import { SlideSearchView } from "@/features/slides/slide-search-view";

import { withAssetsPanel } from "../decorators";
import { createSlideSearchController } from "../fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Slides/SlideSearchView",
  component: SlideSearchView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pure slide search view. Receives a controller object from `useSlideSearchController`.",
      },
    },
  },
} satisfies Meta<typeof SlideSearchView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Initial loading state while the slide library fetch runs.
 */
export const Default: Story = {
  render: () => (
    <SlideSearchView
      controller={createSlideSearchController({
        flow: {
          queryInput: "",
          normalizedQuery: "",
          results: [],
          hasLoaded: false,
          isSearching: true,
          highlightedSlideId: null,
          selectedId: null,
          selectedSlide: null,
        },
        showsResults: false,
        insertDisabled: true,
      })}
    />
  ),
};

/**
 * @summary Populated slide results with filters and insert action.
 */
export const WithResults: Story = {
  render: () => <SlideSearchView controller={createSlideSearchController()} />,
};

/**
 * @summary Failed slide search with retry affordance.
 */
export const SearchError: Story = {
  tags: ["!manifest"],
  render: () => (
    <SlideSearchView
      controller={createSlideSearchController({
        flow: {
          queryInput: "summary",
          normalizedQuery: "summary",
          results: [],
          hasLoaded: true,
          isSearching: false,
          error: "Slide library unavailable",
          highlightedSlideId: null,
          selectedId: null,
          selectedSlide: null,
        },
        showsResults: false,
        insertDisabled: true,
      })}
    />
  ),
};
