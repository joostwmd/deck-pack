import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShortcutHints, ShortcutKeys, ShortcutRow } from "@/components/shortcuts/shortcut-hint";
import {
  NAVIGATE_RESULTS_DISPLAY,
  NAVIGATE_VARIANTS_DISPLAY,
  SELECT_RESULT_DISPLAY,
  SHORTCUTS,
} from "@/lib/shortcuts";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/Navigation/ShortcutHint",
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Keyboard hint primitives used beside search bars and in settings rows.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Compact key tokens for inline placement beside inputs.
 */
export const Keys: Story = {
  render: () => (
    <div className="p-4">
      <ShortcutKeys tokens={SHORTCUTS.focusSearch.keys} />
    </div>
  ),
};

/**
 * @summary Single shortcut row with description aligned to the right.
 */
export const Row: Story = {
  render: () => (
    <div className="max-w-sm p-4">
      <ShortcutRow def={SELECT_RESULT_DISPLAY} />
    </div>
  ),
};

/**
 * @summary Stack of shortcut hints used under search sections.
 */
export const HintList: Story = {
  render: () => (
    <div className="max-w-sm p-4">
      <ShortcutHints defs={[NAVIGATE_RESULTS_DISPLAY, SELECT_RESULT_DISPLAY, NAVIGATE_VARIANTS_DISPLAY]} />
    </div>
  ),
};
