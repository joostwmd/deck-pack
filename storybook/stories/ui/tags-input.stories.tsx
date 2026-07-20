import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagsInputView } from "@deck-pack/ui/components/composite/tags-input-view";
import { ThemeProvider } from "@deck-pack/ui/components/system/theme-provider";
import { useTagsInputController } from "@deck-pack/ui/hooks/use-tags-input-controller";

const meta = {
  title: "Composite/TagsInput",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="bg-background w-[420px] p-4 text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

function TagsInputDemo(props: { withSuggestions?: boolean }) {
  const controller = useTagsInputController({
    defaultValue: ["United States", "USA"],
    label: "Search terms",
    description: "Press Enter or Tab to add a term.",
    placeholder: "Add a search term…",
    max: 50,
    maxLength: 256,
    api: props.withSuggestions
      ? {
          suggestTags: async (query) => {
            const catalog = ["USA", "United States", "America", "US"];
            const q = query.trim().toLowerCase();
            if (!q) return [];
            return catalog.filter((tag) => tag.toLowerCase().includes(q));
          },
        }
      : undefined,
  });

  return (
    <div className="space-y-3">
      <TagsInputView {...controller} />
      {props.withSuggestions ? (
        <p className="text-muted-foreground text-xs">
          Suggestions loaded: {controller.suggestions.join(", ") || "—"}
        </p>
      ) : null}
    </div>
  );
}

export const Default: Story = {
  render: () => <TagsInputDemo />,
};

export const WithInjectedSuggestApi: Story = {
  render: () => <TagsInputDemo withSuggestions />,
};
