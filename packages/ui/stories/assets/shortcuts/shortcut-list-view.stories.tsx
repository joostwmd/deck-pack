import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShortcutListView } from "@/components/shortcut-settings/shortcut-list-view";

import { withAssetsPanel } from "../decorators";
import { createShortcutListGroups } from "@fixtures/view-story-fixtures";

const meta = {
  title: "Assets/Shortcuts/ShortcutListView",
  component: ShortcutListView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Pure shortcut settings list grouped by category with edit and reset actions.",
      },
    },
  },
} satisfies Meta<typeof ShortcutListView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Default shortcut groups loaded from resolved defaults.
 */
export const Default: Story = {
  render: () => (
    <div className="p-4">
      <ShortcutListView
        loadError={null}
        groups={createShortcutListGroups()}
        onRetry={() => undefined}
        onEdit={() => undefined}
        onResetAll={async () => undefined}
      />
    </div>
  ),
};

/**
 * @summary Load failure banner with retry link.
 */
export const LoadError: Story = {
  tags: ["!manifest"],
  render: () => (
    <div className="p-4">
      <ShortcutListView
        loadError="Could not load shortcut overrides."
        groups={[]}
        onRetry={() => undefined}
        onEdit={() => undefined}
        onResetAll={async () => undefined}
      />
    </div>
  ),
};
