import type { Meta, StoryObj } from "@storybook/react-vite";
import type { NavigationPageId } from "@/constants/navigation";

import {
  AssetsRouterFrame,
  layoutStoryGlobals,
  layoutStoryInitialGlobals,
} from "../decorators";
import { toAssetsRoute } from "../routes";

const meta = {
  title: "Assets/Layouts/WebLayout",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Web layout with slide canvas + 480px sidebar. Use the **Page** toolbar to switch routes. Search for assets in the sidebar and they appear on the canvas.",
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
      key={`web-${globals.assetsPage}`}
      initialRoute={toAssetsRoute("web", globals.assetsPage as NavigationPageId)}
      layout="web"
    />
  ),
};
