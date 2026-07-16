import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AssetSearchPanel } from "@/components/asset-picker/asset-search-panel";

import { withAssetsPanel } from "../decorators";
import { flagsPickerConfig } from "../fixtures/asset-picker-configs";
import { mockEmptySearch, mockFailingSearch } from "../fixtures/asset-search";

const { searchHint, ...flagsArgs } = flagsPickerConfig;

const meta = {
  title: "Assets/AssetPicker/Flags",
  component: AssetSearchPanel,
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Mock flag search panel. ${searchHint} Wait ~500ms after typing for debounced search.`,
      },
    },
  },
} satisfies Meta<typeof AssetSearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: flagsArgs,
};

export const NoResults: Story = {
  args: {
    ...flagsArgs,
    search: mockEmptySearch,
  },
};

export const SearchError: Story = {
  args: {
    ...flagsArgs,
    search: mockFailingSearch,
  },
};

/** Types a query, selects a result, and loads variants — documents the full flow. */
export const SelectCountry: Story = {
  args: flagsArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/search flags/i);

    await userEvent.clear(input);
    await userEvent.type(input, "nether");

    await waitFor(
      () => {
        expect(canvas.getByRole("option", { name: /netherlands/i })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await userEvent.click(canvas.getByRole("option", { name: /netherlands/i }));

    await waitFor(
      () => {
        expect(canvas.getByText("4:3")).toBeInTheDocument();
        expect(canvas.getByText("1:1")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
