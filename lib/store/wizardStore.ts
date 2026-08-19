"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_BOOKMARK_ORDER,
  type TableBookmarkName,
} from "@/lib/dotx/bookmarks";

export type WizardMode = "scratch" | "import" | null;

export type HeaderArrangement =
  | "logo-left-name-right"
  | "logo-centered-stacked"
  | "logo-only";

/**
 * Where the facility's own address/phone/fax renders. Footer is the default:
 * when a facility sends its logo and contact info as separate assets they are
 * not meant to stack together in the header.
 */
export type ContactPlacement = "footer" | "header";

/** Expert Radiology's own info is opt-in and never added by default. */
export type ExpertRadiologyPlacement = "footer" | "header" | "beside-logo";

export type ExpertRadiologyConfig = {
  include: boolean;
  placement: ExpertRadiologyPlacement;
};

export type FacilityInfo = {
  name: string;
  tagline: string;
  phone: string;
  fax: string;
  website: string;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax: string;
};

export type LogoState = {
  /** Final cropped/adjusted image as a data URL, or null if none uploaded. */
  dataUrl: string | null;
  brightness: number;
  contrast: number;
  saturation: number;
};

export type HeaderLayout = {
  arrangement: HeaderArrangement;
  pageOneDifferent: boolean;
  contactPlacement: ContactPlacement;
};

export type BookmarkConfig = {
  /** Table bookmark names the facility wants included, in display order. */
  included: TableBookmarkName[];
  /**
   * Optional 10th `Addendum` bookmark. When on, its paragraph is emitted
   * *before* `Body`'s so RamSoft renders addenda at the top of the report.
   */
  includeAddendum: boolean;
};

export type ValidationResult = {
  status: "idle" | "pass" | "fail";
  messages: string[];
};

type WizardState = {
  mode: WizardMode;
  currentStep: number;
  facilityInfo: FacilityInfo;
  logo: LogoState;
  locations: Location[];
  headerLayout: HeaderLayout;
  bookmarkConfig: BookmarkConfig;
  expertRadiology: ExpertRadiologyConfig;
  /** Raw text lines pulled from an imported .dotx, surfaced for manual confirmation. */
  importedRawLines: string[];
  validation: ValidationResult;

  setMode: (mode: WizardMode) => void;
  setCurrentStep: (step: number) => void;
  setFacilityInfo: (info: Partial<FacilityInfo>) => void;
  setLogo: (logo: Partial<LogoState>) => void;
  addLocation: () => void;
  updateLocation: (id: string, patch: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  reorderLocations: (fromIndex: number, toIndex: number) => void;
  setHeaderLayout: (layout: Partial<HeaderLayout>) => void;
  toggleBookmark: (name: TableBookmarkName, included: boolean) => void;
  setIncludeAddendum: (include: boolean) => void;
  setExpertRadiology: (config: Partial<ExpertRadiologyConfig>) => void;
  setImportedRawLines: (lines: string[]) => void;
  setValidation: (result: ValidationResult) => void;
  hydrateFromImport: (patch: {
    facilityInfo?: Partial<FacilityInfo>;
    logo?: Partial<LogoState>;
    locations?: Location[];
    headerLayout?: Partial<HeaderLayout>;
    bookmarkConfig?: Partial<BookmarkConfig>;
    importedRawLines?: string[];
  }) => void;
  resetWizard: () => void;
};

const defaultFacilityInfo: FacilityInfo = {
  name: "",
  tagline: "",
  phone: "",
  fax: "",
  website: "",
};

const defaultLogo: LogoState = {
  dataUrl: null,
  brightness: 1,
  contrast: 1,
  saturation: 1,
};

const defaultHeaderLayout: HeaderLayout = {
  // Logo alone in the header, contact info in the footer, is the safer default.
  arrangement: "logo-only",
  pageOneDifferent: false,
  contactPlacement: "footer",
};

const defaultExpertRadiology: ExpertRadiologyConfig = {
  include: false,
  placement: "footer",
};

function makeLocationId() {
  return `loc-${Math.random().toString(36).slice(2, 10)}`;
}

const initialState = {
  mode: null as WizardMode,
  currentStep: 0,
  facilityInfo: defaultFacilityInfo,
  logo: defaultLogo,
  locations: [] as Location[],
  headerLayout: defaultHeaderLayout,
  bookmarkConfig: {
    included: [...DEFAULT_BOOKMARK_ORDER],
    includeAddendum: false,
  },
  expertRadiology: defaultExpertRadiology,
  importedRawLines: [] as string[],
  validation: { status: "idle", messages: [] } as ValidationResult,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,

      setMode: (mode) => set({ mode }),
      setCurrentStep: (currentStep) => set({ currentStep }),

      setFacilityInfo: (info) =>
        set((state) => ({
          facilityInfo: { ...state.facilityInfo, ...info },
        })),

      setLogo: (logo) =>
        set((state) => ({ logo: { ...state.logo, ...logo } })),

      addLocation: () =>
        set((state) => ({
          locations: [
            ...state.locations,
            { id: makeLocationId(), name: "", address: "", phone: "", fax: "" },
          ],
        })),

      updateLocation: (id, patch) =>
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...patch } : loc,
          ),
        })),

      removeLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        })),

      reorderLocations: (fromIndex, toIndex) =>
        set((state) => {
          const next = [...state.locations];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return { locations: next };
        }),

      setHeaderLayout: (layout) =>
        set((state) => ({
          headerLayout: { ...state.headerLayout, ...layout },
        })),

      toggleBookmark: (name, included) =>
        set((state) => {
          const current = state.bookmarkConfig.included;
          if (included) {
            if (current.includes(name)) return {};
            // Re-insert in the canonical default order so the table stays sensible.
            const next = DEFAULT_BOOKMARK_ORDER.filter(
              (n) => current.includes(n) || n === name,
            );
            return {
              bookmarkConfig: { ...state.bookmarkConfig, included: next },
            };
          }
          return {
            bookmarkConfig: {
              ...state.bookmarkConfig,
              included: current.filter((n) => n !== name),
            },
          };
        }),

      setIncludeAddendum: (includeAddendum) =>
        set((state) => ({
          bookmarkConfig: { ...state.bookmarkConfig, includeAddendum },
        })),

      setExpertRadiology: (config) =>
        set((state) => ({
          expertRadiology: { ...state.expertRadiology, ...config },
        })),

      setImportedRawLines: (importedRawLines) => set({ importedRawLines }),
      setValidation: (validation) => set({ validation }),

      hydrateFromImport: (patch) =>
        set((state) => ({
          mode: "import",
          facilityInfo: { ...state.facilityInfo, ...patch.facilityInfo },
          logo: { ...state.logo, ...patch.logo },
          locations: patch.locations ?? state.locations,
          headerLayout: { ...state.headerLayout, ...patch.headerLayout },
          bookmarkConfig: {
            included:
              patch.bookmarkConfig?.included ?? state.bookmarkConfig.included,
            includeAddendum:
              patch.bookmarkConfig?.includeAddendum ??
              state.bookmarkConfig.includeAddendum,
          },
          importedRawLines: patch.importedRawLines ?? state.importedRawLines,
        })),

      resetWizard: () => set(initialState),
    }),
    {
      name: "facility-header-builder-wizard",
      // Bumped when the persisted shape changed (new Rule 9/10/12 fields).
      // Older saved sessions are dropped rather than half-migrated.
      version: 2,
    },
  ),
);
