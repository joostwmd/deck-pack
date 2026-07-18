import { Flag, ImageSquare, Shapes } from "@phosphor-icons/react";
import type { RefObject } from "react";
import { createRef } from "react";

import type { AssetSearchPanelViewProps } from "@/components/asset-browser/asset-search-panel-view";
import type { HarveyBallsPanelViewProps } from "@/components/harvey-balls/harvey-balls-panel-view";
import type { FormatPanelViewProps } from "@/components/format/format-panel-view";
import type { PhotoSearchController } from "@/components/photos/use-photo-search-controller";
import type { ShapeLibraryController } from "@/components/shapes/use-shape-library-controller";
import type { SlideSearchController } from "@/components/slides/use-slide-search-controller";
import type { useAssetSearchFlow } from "@/hooks/use-asset-search-flow";
import type { SelectionState } from "@/hooks/use-powerpoint-selection";
import { DEFAULT_HARVEY_BALL_CONFIG, normalizeHarveyBallConfig, validateHarveyBallConfig } from "@/lib/harvey-ball-svg";
import {
  NAVIGATE_RESULTS_DISPLAY,
  NAVIGATE_VARIANTS_DISPLAY,
  SELECT_RESULT_DISPLAY,
  SHORTCUTS,
  getShortcutDefsByGroup,
} from "@/lib/shortcuts";
import { resolveDefaultShortcuts } from "@deck-pack/shortcuts";

import { mockFlagResults } from "@fixtures/asset-search";

const noop = () => undefined;
const noopAsync = async () => undefined;

export function createMockAssetSearchFlow(
  overrides: Partial<ReturnType<typeof useAssetSearchFlow>> = {},
): ReturnType<typeof useAssetSearchFlow> {
  return {
    searchValue: "",
    setSearchValue: noop,
    results: mockFlagResults,
    isSearching: false,
    hasSearched: true,
    searchError: null,
    retrySearch: noopAsync,
    variants: [],
    details: null,
    isFetchingVariants: false,
    variantsError: null,
    retryVariants: noopAsync,
    selectedEntity: null,
    selectedVariantId: null,
    highlightedResultId: mockFlagResults[0]?.id ?? null,
    highlightedVariantId: null,
    selectEntity: noopAsync,
    selectVariant: noop,
    navigateResults: noop,
    selectHighlightedResult: noop,
    navigateVariants: noop,
    confirmHighlightedVariant: noop,
    goBack: noop,
    ...overrides,
  };
}

export function createAssetSearchPanelViewProps(
  overrides: Partial<AssetSearchPanelViewProps> = {},
): AssetSearchPanelViewProps {
  const flow = createMockAssetSearchFlow(overrides.flow);
  const searchResultsId = overrides.searchResultsId ?? "story-search-results";

  return {
    searchInputRef: createRef<HTMLInputElement>() as RefObject<HTMLInputElement | null>,
    searchResultsId,
    assetLabel: "Flag",
    label: "flag",
    headerText: "Search and insert country flags into your presentation.",
    searchPlaceholder: "Search flags...",
    noResultsDescription: "Try searching for a different country name or code.",
    noVariantsDescription: "This flag has no variants.",
    icon: Flag,
    flow,
    showsSearchResults: !flow.selectedEntity && !flow.searchError && flow.results.length > 0,
    activeSearchResultId: flow.highlightedResultId
      ? `${searchResultsId}-option-${encodeURIComponent(flow.highlightedResultId)}`
      : undefined,
    insertLabel: "Insert",
    insertingLabel: "Inserting...",
    insertDisabled: true,
    isInserting: false,
    onInsert: noopAsync,
    focusSearchShortcutKeys: SHORTCUTS.focusSearch.keys,
    searchNavigationShortcutDefs: [NAVIGATE_RESULTS_DISPLAY, SELECT_RESULT_DISPLAY],
    variantNavigationShortcutDefs: [NAVIGATE_VARIANTS_DISPLAY, SHORTCUTS.selectVariant],
    insertSectionShortcutDefs: [SHORTCUTS.insert],
    ...overrides,
    flow,
  };
}

export const mockPhotoResults = [
  {
    id: "photo-1",
    name: "Mountain lake",
    thumbnailUrl: "https://placehold.co/320x240/png?text=Lake",
    insertImageUrl: "https://placehold.co/1280x960/png?text=Lake",
    width: 1280,
    height: 960,
    avgColor: "#4b7f9d",
    photoUrl: "https://example.com/photos/1",
    photographer: "Alex Photo",
    photographerUrl: "https://example.com/photographers/alex",
    metadata: { PHOTO_ID: "photo-1" },
  },
  {
    id: "photo-2",
    name: "City skyline",
    thumbnailUrl: "https://placehold.co/320x240/png?text=City",
    insertImageUrl: "https://placehold.co/1280x960/png?text=City",
    width: 1280,
    height: 960,
    avgColor: "#334155",
    photoUrl: "https://example.com/photos/2",
    photographer: "Jamie Lens",
    photographerUrl: "https://example.com/photographers/jamie",
    metadata: { PHOTO_ID: "photo-2" },
  },
] satisfies PhotoSearchController["flow"]["results"];

export function createPhotoSearchController(
  overrides: Partial<PhotoSearchController> = {},
): PhotoSearchController {
  const flow = {
    queryInput: "mountain",
    setQueryInput: noop,
    submitSearch: noop,
    filters: {},
    activeFilterCount: 0,
    updateFilters: noop,
    submittedQuery: "mountain",
    results: mockPhotoResults,
    page: 1,
    totalResults: 42,
    isSearching: false,
    isLoadingMore: false,
    hasNextPage: true,
    hasSearched: true,
    error: null,
    retry: noopAsync,
    loadMore: noopAsync,
    highlightedPhotoId: mockPhotoResults[0]?.id ?? null,
    highlightedIndex: 0,
    selectedId: mockPhotoResults[0]?.id ?? null,
    selectedPhoto: mockPhotoResults[0] ?? null,
    selectPhoto: noop,
    navigatePhotos: noop,
    confirmHighlightedPhoto: noop,
    ...(overrides.flow ?? {}),
  };

  return {
    flow,
    searchInputRef: createRef<HTMLInputElement>() as RefObject<HTMLInputElement | null>,
    resultsId: "story-photo-results",
    showsResults: !flow.error && flow.results.length > 0,
    activeResultId: flow.highlightedPhotoId ?? undefined,
    focusSearchShortcut: SHORTCUTS.focusSearch,
    isInserting: false,
    handleInsert: noopAsync,
    insertLabel: "Insert",
    insertingLabel: "Inserting...",
    insertDisabled: false,
    insertSectionShortcutDefs: [SHORTCUTS.insert],
    ...overrides,
    flow,
  };
}

export const mockShapeResults = [
  {
    id: "shape-1",
    name: "Chevron",
    category: "Arrows",
    thumbnailUrl: "https://placehold.co/160x120/png?text=Chevron",
    svgUrl: "https://example.com/shapes/chevron.svg",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "shape-2",
    name: "Circle",
    category: "Basic",
    thumbnailUrl: "https://placehold.co/160x120/png?text=Circle",
    svgUrl: "https://example.com/shapes/circle.svg",
    createdAt: "2026-01-02T00:00:00.000Z",
  },
] satisfies ShapeLibraryController["flow"]["results"];

export function createShapeLibraryController(
  overrides: Partial<ShapeLibraryController> = {},
): ShapeLibraryController {
  const flow = {
    category: undefined,
    updateCategory: noop,
    facets: { categories: ["Arrows", "Basic", "Flow"] },
    results: mockShapeResults,
    total: mockShapeResults.length,
    isLoading: false,
    hasLoaded: true,
    error: null,
    retry: noopAsync,
    highlightedShapeId: mockShapeResults[0]?.id ?? null,
    highlightedIndex: 0,
    selectedId: mockShapeResults[0]?.id ?? null,
    selectedShape: mockShapeResults[0] ?? null,
    selectShape: noop,
    navigateShapes: noop,
    confirmHighlightedShape: noop,
    ...(overrides.flow ?? {}),
  };

  return {
    flow,
    emptyDescription: "Try another category or check back later.",
    isInserting: false,
    handleInsert: noopAsync,
    insertLabel: "Insert",
    insertingLabel: "Inserting...",
    insertDisabled: false,
    insertSectionShortcutDefs: [SHORTCUTS.insert],
    ...overrides,
    flow,
  };
}

export const mockSlideResults = [
  {
    id: "slide-1",
    name: "Executive summary",
    thumbnailUrl: "https://placehold.co/320x180/png?text=Summary",
    presentationUrl: "https://example.com/slides/1.pptx",
    category: "Business",
    tags: ["summary", "intro"],
    aspectRatio: "16:9" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "slide-2",
    name: "Timeline",
    thumbnailUrl: "https://placehold.co/320x180/png?text=Timeline",
    presentationUrl: "https://example.com/slides/2.pptx",
    category: "Process",
    tags: ["timeline"],
    aspectRatio: "16:9" as const,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
] satisfies SlideSearchController["flow"]["results"];

export function createSlideSearchController(
  overrides: Partial<SlideSearchController> = {},
): SlideSearchController {
  const flow = {
    queryInput: "summary",
    setQueryInput: noop,
    normalizedQuery: "summary",
    filters: {},
    facets: {
      categories: ["Business", "Process"],
      tags: ["summary", "timeline", "intro"],
      aspectRatios: ["16:9", "4:3"] as const,
    },
    activeFilterCount: 0,
    updateFilters: noop,
    sort: "relevance" as const,
    updateSort: noop,
    results: mockSlideResults,
    total: mockSlideResults.length,
    isSearching: false,
    hasLoaded: true,
    error: null,
    retry: noopAsync,
    highlightedSlideId: mockSlideResults[0]?.id ?? null,
    highlightedIndex: 0,
    selectedId: mockSlideResults[0]?.id ?? null,
    selectedSlide: mockSlideResults[0] ?? null,
    selectSlide: noop,
    navigateSlides: noop,
    confirmHighlightedSlide: noop,
    ...(overrides.flow ?? {}),
  };

  return {
    flow,
    searchInputRef: createRef<HTMLInputElement>() as RefObject<HTMLInputElement | null>,
    resultsId: "story-slide-results",
    showsResults: !flow.error && flow.results.length > 0,
    activeResultId: flow.highlightedSlideId ?? undefined,
    focusSearchShortcut: SHORTCUTS.focusSearch,
    isInserting: false,
    handleInsert: noopAsync,
    insertDisabled: false,
    insertSectionShortcutDefs: [SHORTCUTS.insert],
    ...overrides,
    flow,
  };
}

export function createHarveyBallsPanelController(
  overrides: Partial<HarveyBallsPanelViewProps["controller"]> = {},
): HarveyBallsPanelViewProps["controller"] {
  const normalizedConfig = normalizeHarveyBallConfig(DEFAULT_HARVEY_BALL_CONFIG);

  return {
    normalizedConfig,
    validation: validateHarveyBallConfig(normalizedConfig),
    isInserting: false,
    canInsert: true,
    insertLabel: "Insert",
    insertingLabel: "Inserting...",
    handleConfigChange: noop,
    handleInsert: noopAsync,
    insertSectionShortcutDefs: [SHORTCUTS.insert],
    ...overrides,
  };
}

export function createFormatPanelController(
  overrides: Partial<FormatPanelViewProps["controller"]> = {},
): FormatPanelViewProps["controller"] {
  const selection = {
    shapes: [
      {
        id: "shape-1",
        name: "Rectangle 1",
        left: 120,
        top: 80,
        width: 240,
        height: 120,
        hasText: true,
      },
    ],
  };

  const state: SelectionState = { status: "ready", selection };

  return {
    selection,
    applicabilityById: new Map(),
    busyActionId: null,
    isRefreshing: false,
    state,
    refresh: noopAsync,
    runAction: noopAsync,
    ...overrides,
  };
}

export function createShortcutListGroups() {
  const resolved = resolveDefaultShortcuts();

  return [
    {
      id: "navigation",
      label: "Navigation",
      shortcuts: getShortcutDefsByGroup(resolved, "navigation"),
    },
    {
      id: "search",
      label: "Search",
      shortcuts: getShortcutDefsByGroup(resolved, "search"),
    },
  ];
}

export const storyIcons = {
  flag: Flag,
  photo: ImageSquare,
  shape: Shapes,
};
