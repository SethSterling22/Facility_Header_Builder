"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_BOOKMARK_ORDER,
  type BookmarkName,
} from "@/lib/dotx/bookmarks";

export type WizardMode = "scratch" | "import" | null;

export type HeaderArrangement =
  | "logo-left-address-right"
  | "logo-centered-stacked"
  | "logo-only";

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
};

export type BookmarkConfig = {
  /** Bookmark names the facility wants included, in display order. */
  included: BookmarkName[];
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
  toggleBookmark: (name: BookmarkName, included: boolean) => void;
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
  arrangement: "logo-left-address-right",
  pageOneDifferent: false,
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
  bookmarkConfig: { included: [...DEFAULT_BOOKMARK_ORDER] },
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
            return { bookmarkConfig: { included: next } };
          }
          return {
            bookmarkConfig: {
              included: current.filter((n) => n !== name),
            },
          };
        }),

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
          },
          importedRawLines: patch.importedRawLines ?? state.importedRawLines,
        })),

      resetWizard: () => set(initialState),
    }),
    {
      name: "facility-header-builder-wizard",
    },
  ),
);
