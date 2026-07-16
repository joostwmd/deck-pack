import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeProvider } from "../system/theme-provider";
import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Composite/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="bg-background p-4 text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "enhanced"],
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
  },
};

export const Enhanced: Story = {
  args: {
    variant: "enhanced",
  },
};

export const EnhancedSmall: Story = {
  args: {
    variant: "enhanced",
    size: "sm",
  },
};
