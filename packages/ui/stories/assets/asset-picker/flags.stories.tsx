import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FlagsPanel } from "@/features/flags/flags-panel";

import { withAssetsPanel, withTestServices } from "../decorators";
import { mockEmptySearch, mockFailingSearch } from "@fixtures/asset-search";
import { flagsPickerConfig } from "@fixtures/asset-picker-configs";
import { createFlagsTestServices } from "@fixtures/panel-test-services";

const meta = {
  title: "Assets/AssetPicker/Flags",
  component: FlagsPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Connected flag search panel using \`FlagsPanel\` and test services. ${flagsPickerConfig.searchHint} Wait ~500ms after typing for debounced search.`,
      },
    },
  },
} satisfies Meta<typeof FlagsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default flag search panel wired to mock tRPC handlers via ServicesProvider.
 */
export const Default: Story = {
  decorators: [withAssetsPanel],
  render: () => <FlagsPanel />,
};

/**
 * @summary Types a query, selects a result, and loads variants — documents the full flow.
 */
export const SelectCountry: Story = {
  decorators: [withAssetsPanel],
  render: () => <FlagsPanel />,
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

/**
 * @summary Empty search results state after a query with no matches.
 */
export const NoResults: Story = {
  tags: ["!manifest"],
  decorators: [withTestServices(createFlagsTestServices(mockEmptySearch))],
  render: () => <FlagsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/search flags/i);

    await userEvent.type(input, "zzzz");

    await waitFor(
      () => {
        expect(canvas.getByText(/no flags found/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

/**
 * @summary Search service failure with retry affordance.
 */
export const SearchError: Story = {
  tags: ["!manifest"],
  decorators: [withTestServices(createFlagsTestServices(mockFailingSearch))],
  render: () => <FlagsPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/search flags/i);

    await userEvent.type(input, "nether");

    await waitFor(
      () => {
        expect(canvas.getByRole("alert")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
