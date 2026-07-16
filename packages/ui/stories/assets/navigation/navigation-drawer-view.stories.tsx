import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  NavigationDrawerPageButton,
  NavigationDrawerSectionView,
  NavigationDrawerView,
} from "@/components/navigation-drawer-view";
import { SHORTCUTS } from "@/lib/shortcuts";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/Navigation/NavigationDrawerView",
  component: NavigationDrawerView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Pure navigation drawer shell with page buttons and shortcut hints.",
      },
    },
  },
} satisfies Meta<typeof NavigationDrawerView>;

export default meta;
type Story = StoryObj<typeof meta>;

function NavigationDrawerDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex justify-end p-4">
      <NavigationDrawerView
        open={open}
        onOpenChange={setOpen}
        openMenuShortcutKeys={SHORTCUTS.openMenu.keys}
      >
        <NavigationDrawerSectionView label="Assets">
          <NavigationDrawerPageButton
            label="Flags"
            isActive
            shortcutKeys={SHORTCUTS.flags.keys}
            onNavigate={() => undefined}
          />
          <NavigationDrawerPageButton
            label="Photos"
            isActive={false}
            shortcutKeys={SHORTCUTS.photos.keys}
            onNavigate={() => undefined}
          />
        </NavigationDrawerSectionView>
        <NavigationDrawerSectionView label="Utilities">
          <NavigationDrawerPageButton
            label="Format"
            isActive={false}
            shortcutKeys={SHORTCUTS.format.keys}
            onNavigate={() => undefined}
          />
        </NavigationDrawerSectionView>
      </NavigationDrawerView>
    </div>
  );
}

/**
 * @summary Navigation drawer open with grouped page links.
 */
export const Default: Story = {
  render: () => <NavigationDrawerDemo />,
};
