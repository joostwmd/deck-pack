import { OpsPageShell } from "@/components/ops-page-shell";

type GalleryPlaceholderPageProps = {
  title: string;
  description: string;
};

export function GalleryPlaceholderPage({ title, description }: GalleryPlaceholderPageProps) {
  return (
    <OpsPageShell title={title} description={description}>
      <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-12 text-center text-sm">
        Global gallery CRUD requires storage integration. This page will host upload, edit, and
        publish workflows for the add-in asset library.
      </div>
    </OpsPageShell>
  );
}
