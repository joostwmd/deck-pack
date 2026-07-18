import { ScreenHeader } from "@/components/asset-browser/screen-header";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader title={title} text={description} />
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          This page is coming soon. Use the navigation menu to switch to an available feature.
        </p>
      </div>
    </div>
  );
}
