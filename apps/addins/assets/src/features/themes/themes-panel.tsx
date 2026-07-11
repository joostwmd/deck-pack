import { Button } from "@deck-pack/ui/components/system/button";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import { DEFAULT_BRAND_PROFILE_CONFIGURATION } from "@deck-pack/presentation-check";
import type { BrandProfileConfiguration } from "@deck-pack/presentation-check";
import { Palette } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/asset-picker/empty-state";
import { ErrorState } from "@/components/asset-picker/error-state";
import { InsertSection } from "@/components/asset-picker/insert-section";
import { ScreenHeader } from "@/components/asset-picker/screen-header";
import { BrandProfileEditor } from "@/features/themes/brand-profile-editor";
import { ThemeCreateDialog, ThemeImportReview } from "@/features/themes/theme-create-dialog";
import {
  archiveBrandProfile,
  duplicateBrandProfile,
  saveBrandProfile,
  setDefaultBrandProfile,
  useBrandProfiles,
} from "@/hooks/use-brand-profiles";
import type { AssetPanelMode } from "@/lib/asset-types";

type ThemesView = "list" | "create" | "edit" | "import-review";

interface ThemesPanelProps {
  mode: AssetPanelMode;
}

export function ThemesPanel({ mode }: ThemesPanelProps) {
  const { profiles, loading, error, refresh } = useBrandProfiles();
  const [view, setView] = useState<ThemesView>("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("New theme");
  const [description, setDescription] = useState("");
  const [configuration, setConfiguration] = useState<BrandProfileConfiguration>(
    DEFAULT_BRAND_PROFILE_CONFIGURATION,
  );

  const resetEditor = useCallback((next?: Partial<{ name: string; configuration: BrandProfileConfiguration }>) => {
    setName(next?.name ?? "New theme");
    setDescription("");
    setConfiguration(next?.configuration ?? DEFAULT_BRAND_PROFILE_CONFIGURATION);
    setEditingId(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveBrandProfile({
        profileId: editingId ?? undefined,
        name: name.trim(),
        description: description.trim() || null,
        configuration,
      });
      await refresh();
      setView("list");
      resetEditor();
      toast.success("Theme saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save theme");
    } finally {
      setSaving(false);
    }
  }, [configuration, description, editingId, name, refresh, resetEditor]);

  if (view !== "list") {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader
          title={view === "import-review" ? "Review extracted theme" : editingId ? "Edit theme" : "New theme"}
          text="Configure fonts, colors and enabled presentation-check rules."
        />
        <div className="flex flex-col gap-6 px-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="theme-name">Theme name</Label>
            <Input
              id="theme-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="theme-description">Description</Label>
            <Input
              id="theme-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
            />
          </div>

          {view === "import-review" ? (
            <ThemeImportReview
              name={name}
              onNameChange={setName}
              headingFonts={configuration.typography.roles.title.allowedFonts.join(", ")}
              bodyFonts={configuration.typography.roles.body.allowedFonts.join(", ")}
              onHeadingFontsChange={(value) =>
                setConfiguration((current) => ({
                  ...current,
                  typography: {
                    ...current.typography,
                    roles: {
                      ...current.typography.roles,
                      title: {
                        ...current.typography.roles.title,
                        allowedFonts: value.split(",").map((font) => font.trim()).filter(Boolean),
                      },
                    },
                  },
                }))
              }
              onBodyFontsChange={(value) =>
                setConfiguration((current) => ({
                  ...current,
                  typography: {
                    ...current.typography,
                    roles: {
                      ...current.typography.roles,
                      body: {
                        ...current.typography.roles.body,
                        allowedFonts: value.split(",").map((font) => font.trim()).filter(Boolean),
                      },
                    },
                  },
                }))
              }
            />
          ) : null}

          <BrandProfileEditor configuration={configuration} onChange={setConfiguration} mode={mode} />

          <InsertSection
            disabled={!name.trim() || saving}
            isInserting={saving}
            label="Save theme"
            insertingLabel="Saving..."
            onClick={() => void handleSave()}
          />
          <Button type="button" variant="ghost" onClick={() => setView("list")}>
            Back to themes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Themes"
        text="Manage corporate identity profiles used by Presentation Check."
      />

      <div className="flex flex-col gap-4 px-4 py-4">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New theme
        </Button>

        {loading ? <p className="text-sm text-muted-foreground">Loading themes...</p> : null}
        {error ? (
          <ErrorState
            title="Could not load themes"
            description={error}
            onRetry={() => void refresh()}
          />
        ) : null}

        {!loading && !error && profiles.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="No themes yet"
            description="Create a theme to start checking presentations."
          />
        ) : null}

        {profiles.map((profile) => (
          <div key={profile.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {profile.name}
                  {profile.isDefault ? (
                    <span className="ml-2 text-xs text-muted-foreground">Default</span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile.configuration?.typography.roles.title.allowedFonts.join(", ")} ·{" "}
                  {profile.configuration?.typography.roles.body.allowedFonts.join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile.configuration
                    ? `${Object.values(profile.configuration.rules).filter((rule) => rule.enabled).length} rules enabled`
                    : "No active version"}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!profile.configuration) return;
                    setEditingId(profile.id);
                    setName(profile.name);
                    setDescription(profile.description ?? "");
                    setConfiguration(profile.configuration);
                    setView("edit");
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void duplicateBrandProfile(profile.id, `${profile.name} copy`)
                      .then(refresh)
                      .then(() => toast.success("Theme duplicated"))
                      .catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Duplicate failed"),
                      )
                  }
                >
                  Duplicate
                </Button>
                {!profile.isDefault ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void setDefaultBrandProfile(profile.id).then(refresh)}
                  >
                    Make default
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void archiveBrandProfile(profile.id).then(refresh)}
                >
                  Archive
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ThemeCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode={mode}
        onCreateManual={() => {
          resetEditor();
          setView("create");
          setCreateOpen(false);
        }}
        onCreateFromDraft={(draft) => {
          resetEditor({ name: draft.name, configuration: draft.configuration });
          setView("import-review");
        }}
      />
    </div>
  );
}
