import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeToggle } from "../composite/theme-toggle";

const meta = {
  title: "Composite/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
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
