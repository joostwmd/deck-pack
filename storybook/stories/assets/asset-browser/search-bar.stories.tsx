import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SearchBar } from "@/components/asset-browser/search-bar";
import { ShortcutKeys } from "@/components/shortcuts/shortcut-hint";
import { SHORTCUTS } from "@/lib/shortcuts";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/AssetBrowser/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Combobox-style search input used by photo and slide panels.",
      },
    },
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SearchBarDemo({
  initialValue = "",
  isSearching = false,
}: {
  initialValue?: string;
  isSearching?: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="p-4">
      <SearchBar
        value={value}
        onChange={setValue}
        isSearching={isSearching}
        placeholder="Search photos..."
        rightSlot={<ShortcutKeys tokens={SHORTCUTS.focusSearch.keys} className="opacity-70" />}
      />
    </div>
  );
}

/**
 * @summary Empty search bar ready for input.
 */
export const Default: Story = {
  render: () => <SearchBarDemo />,
};

/**
 * @summary Search bar showing the loading spinner state.
 */
export const Searching: Story = {
  tags: ["!manifest"],
  render: () => <SearchBarDemo initialValue="mountain" isSearching />,
};

/**
 * @summary Search bar with a prefilled query.
 */
export const WithQuery: Story = {
  render: () => <SearchBarDemo initialValue="mountain" />,
};
