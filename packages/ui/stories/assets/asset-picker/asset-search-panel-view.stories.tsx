import type { Meta, StoryObj } from "@storybook/react-vite";

import { AssetSearchPanelView } from "@/components/asset-picker/asset-search-panel-view";

import { withAssetsPanel } from "../decorators";
import { createAssetSearchPanelViewProps } from "../fixtures/view-story-fixtures";
import { mockFlagResults } from "../fixtures/asset-search";

const meta = {
  title: "Assets/AssetPicker/AssetSearchPanelView",
  component: AssetSearchPanelView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pure view for the asset search panel. Receives flow state and callbacks from `useAssetSearchPanelController`.",
      },
    },
  },
} satisfies Meta<typeof AssetSearchPanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Initial search state with no query entered.
 */
export const Default: Story = {
  args: createAssetSearchPanelViewProps({
    flow: {
      searchValue: "",
      results: [],
      hasSearched: false,
      highlightedResultId: null,
    },
    showsSearchResults: false,
    activeSearchResultId: undefined,
  }),
};

/**
 * @summary Search results list with keyboard highlight on the first item.
 */
export const WithResults: Story = {
  args: createAssetSearchPanelViewProps(),
};

/**
 * @summary Selected entity with loaded variants ready to insert.
 */
export const WithVariants: Story = {
  args: createAssetSearchPanelViewProps({
    flow: {
      searchValue: "nether",
      selectedEntity: {
        id: mockFlagResults[0]!.id,
        name: mockFlagResults[0]!.name,
        icon: mockFlagResults[0]!.imageUrl,
      },
      results: mockFlagResults,
      variants: [
        { id: "flag-nl-variant-0", name: "4:3", imageUrl: mockFlagResults[0]!.imageUrl },
        { id: "flag-nl-variant-1", name: "1:1", imageUrl: mockFlagResults[0]!.imageUrl },
      ],
      selectedVariantId: "flag-nl-variant-0",
      highlightedVariantId: "flag-nl-variant-0",
    },
    showsSearchResults: false,
    insertDisabled: false,
  }),
};

/**
 * @summary Empty results message after a completed search.
 */
export const NoResults: Story = {
  tags: ["!manifest"],
  args: createAssetSearchPanelViewProps({
    flow: {
      searchValue: "zzzz",
      results: [],
      hasSearched: true,
      highlightedResultId: null,
    },
    showsSearchResults: false,
  }),
};

/**
 * @summary Search request failure with retry action.
 */
export const SearchError: Story = {
  tags: ["!manifest"],
  args: createAssetSearchPanelViewProps({
    flow: {
      searchValue: "nether",
      results: [],
      hasSearched: true,
      searchError: "Search service unavailable",
      highlightedResultId: null,
    },
    showsSearchResults: false,
  }),
};
