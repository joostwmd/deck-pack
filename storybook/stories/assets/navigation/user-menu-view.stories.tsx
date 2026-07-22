import type { Meta, StoryObj } from "@storybook/react-vite";

import { UserMenuView } from "@/components/shell/user-menu-view";

import { withAssetsPanel } from "../decorators";

const meta = {
  title: "Assets/Navigation/UserMenuView",
  component: UserMenuView,
  tags: ["autodocs"],
  decorators: [withAssetsPanel],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Pure account menu with initials avatar and sign-out action.",
      },
    },
  },
} satisfies Meta<typeof UserMenuView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * @summary Signed-in user menu with initials avatar.
 */
export const Default: Story = {
  render: () => (
    <div className="flex justify-end p-4">
      <UserMenuView
        isPending={false}
        initials="TU"
        displayName="Test User"
        onAccountClick={() => undefined}
        onSignOut={() => undefined}
      />
    </div>
  ),
};

/**
 * @summary Loading skeleton while the session resolves.
 */
export const Loading: Story = {
  tags: ["!manifest"],
  render: () => (
    <div className="flex justify-end p-4">
      <UserMenuView
        isPending
        onAccountClick={() => undefined}
        onSignOut={() => undefined}
      />
    </div>
  ),
};
