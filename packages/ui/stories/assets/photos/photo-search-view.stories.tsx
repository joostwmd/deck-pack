import type { Meta, StoryObj } from "@storybook/react-vite";

import { PhotoSearchView } from "@/features/photos/photo-search-view";

import { withAssetsPanel } from "../decorators";
import { createPhotoSearchController } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Photos/PhotoSearchView",
  component: PhotoSearchView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pure photo search view. Receives a controller object from `usePhotoSearchController`.",
      },
    },
  },
} satisfies Meta<typeof PhotoSearchView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Prompt to enter a keyword before searching.
 */
export const Default: Story = {
  render: () => (
    <PhotoSearchView
      controller={createPhotoSearchController({
        flow: {
          queryInput: "",
          submittedQuery: "",
          results: [],
          hasSearched: false,
          totalResults: 0,
          hasNextPage: false,
          highlightedPhotoId: null,
          selectedId: null,
          selectedPhoto: null,
        },
        showsResults: false,
        insertDisabled: true,
      })}
    />
  ),
};

/**
 * @summary Populated results grid with insert action enabled.
 */
export const WithResults: Story = {
  render: () => <PhotoSearchView controller={createPhotoSearchController()} />,
};

/**
 * @summary Failed search with retry affordance.
 */
export const SearchError: Story = {
  tags: ["!manifest"],
  render: () => (
    <PhotoSearchView
      controller={createPhotoSearchController({
        flow: {
          queryInput: "mountain",
          submittedQuery: "mountain",
          results: [],
          hasSearched: true,
          error: "Photo service unavailable",
          highlightedPhotoId: null,
          selectedId: null,
          selectedPhoto: null,
        },
        showsResults: false,
        insertDisabled: true,
      })}
    />
  ),
};
