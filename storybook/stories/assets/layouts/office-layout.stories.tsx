import type { Meta, StoryObj } from "@storybook/react-vite";
import type { NavigationPageId } from "@/constants/navigation";

import {
  AssetsRouterFrame,
  layoutStoryGlobals,
  layoutStoryInitialGlobals,
} from "../decorators";
import { toAssetsRoute } from "../routes";

const meta = {
  title: "Assets/Layouts/OfficeLayout",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Office taskpane layout (400px wide). Use the **Page** toolbar above the canvas to switch between routes — the same pages available in the in-app navigation drawer. Asset search pages (flags, logos, icons) use mock data.",
      },
    },
  },
  globalTypes: layoutStoryGlobals,
  initialGlobals: layoutStoryInitialGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_args, { globals }) => (
    <AssetsRouterFrame
      key={`office-${globals.assetsPage}`}
      initialRoute={toAssetsRoute("office", globals.assetsPage as NavigationPageId)}
      layout="office"
    />
  ),
};
