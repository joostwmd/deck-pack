import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FlagsPage } from "@/pages/flags/flags-page";

import { withAssetsPanel, withTestServices } from "../decorators";
import { mockEmptySearch, mockFailingSearch } from "@fixtures/asset-search";
import { flagsBrowserConfig } from "@fixtures/asset-browser-configs";
import { createFlagsTestServices } from "@fixtures/panel-test-services";

const meta = {
  title: "Assets/AssetBrowser/Flags",
  component: FlagsPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `Connected flag search page using \`FlagsPage\` and test services. ${flagsBrowserConfig.searchHint} Wait ~500ms after typing for debounced search.`,
      },
    },
  },
} satisfies Meta<typeof FlagsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default flag search page wired to mock tRPC handlers via ServicesProvider.
 */
export const Default: Story = {
  decorators: [withAssetsPanel],
  render: () => <FlagsPage />,
};

/**
 * @summary Types a query, selects a result, and loads variants — documents the full flow.
 */
export const SelectCountry: Story = {
  decorators: [withAssetsPanel],
  render: () => <FlagsPage />,
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
  render: () => <FlagsPage />,
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
  render: () => <FlagsPage />,
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
