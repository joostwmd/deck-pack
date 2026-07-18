import type { Meta, StoryObj } from "@storybook/react-vite";

import { SearchResults } from "@/components/asset-browser/search-results";

import { withAssetsPanel } from "../decorators";
import { mockFlagResults } from "@fixtures/asset-search";

const meta = {
  title: "Assets/AssetBrowser/SearchResults",
  component: SearchResults,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Accessible listbox of asset search results with highlight scrolling.",
      },
    },
  },
} satisfies Meta<typeof SearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default results list with the first item highlighted.
 */
export const Default: Story = {
  args: {
    id: "story-search-results",
    results: mockFlagResults,
    highlightedId: mockFlagResults[0]?.id,
    onSelect: () => undefined,
  },
};

/**
 * @summary Single result with selection callback wired for interaction tests.
 */
export const SingleResult: Story = {
  args: {
    id: "story-search-results-single",
    results: [mockFlagResults[0]!],
    highlightedId: mockFlagResults[0]?.id,
    onSelect: () => undefined,
  },
};
