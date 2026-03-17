"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  buildEmptyJustification,
  buildInitialProvenanceMap,
  buildImportedProvenanceMap,
  defaultEditableModel,
  type ChangeLogEntry,
  type EditableModel,
  type LeadCaptureRecord,
  type OverrideRecord,
  type ProvenanceMap,
  type ScenarioId,
  type SectionId,
} from "@/lib/model";

export interface VersioningState {
  applicationVersion: string;
  modelSchemaVersion: string;
  calculationEngineVersion: string;
  exportFormatVersion: string;
  modelId: string;
  modelTitle: string;
  modelVersion: string;
  modelRevision: number;
  modelCreatedAt: string;
  modelLastModifiedAt: string;
  modelLastCalculatedAt: string;
  modelLastExportedAt: string;
  selectedScenarioAtLastSave: ScenarioId;
  lastEditedScenario: ScenarioId;
  lastEditedSection: SectionId;
  changedSections: SectionId[];
  saveCount: number;
  exportCount: number;
}

interface CalculatorStoreState {
  model: EditableModel;
  provenance: ProvenanceMap;
  overrides: OverrideRecord[];
  changeLog: ChangeLogEntry[];
  versioning: VersioningState;
  leadCapture: LeadCaptureRecord | null;
  demoBackup: {
    model: EditableModel;
    provenance: ProvenanceMap;
    overrides: OverrideRecord[];
  } | null;
  hasHydrated: boolean;
  resetKey: number;
  saveModel: (model: EditableModel) => void;
  noteFieldEdit: (params: {
    path: string;
    scenario: ScenarioId | "global";
    section: SectionId;
    sourceQuality?: "direct_operating_data" | "estimated_site_input";
  }) => void;
  copyScenario: (params: {
    from: ScenarioId;
    to: ScenarioId;
    model: EditableModel;
  }) => EditableModel;
  addOverride: (record: Omit<OverrideRecord, "id" | "createdAt">) => OverrideRecord;
  markCalculated: (scenario: ScenarioId) => void;
  markExported: (format: "JSON" | "Excel" | "PDF") => void;
  completeLeadCapture: (leadCapture: LeadCaptureRecord) => void;
  clearLeadCapture: () => void;
  applyTestDataset: (params: {
    datasetLabel: string;
    model: EditableModel;
  }) => EditableModel;
  restoreWorkingModel: () => EditableModel | null;
  resetModel: () => void;
  setHydrated: (value: boolean) => void;
}

const createVersioningState = (): VersioningState => {
  const timestamp = new Date().toISOString();

  return {
    applicationVersion: "1.0.0",
    modelSchemaVersion: "1.0.0",
    calculationEngineVersion: "1.0.0",
    exportFormatVersion: "1.0.0",
    modelId: crypto.randomUUID(),
    modelTitle: "Bioprocess Development ROI Calculator",
    modelVersion: "1.0.0",
    modelRevision: 1,
    modelCreatedAt: timestamp,
    modelLastModifiedAt: timestamp,
    modelLastCalculatedAt: "",
    modelLastExportedAt: "",
    selectedScenarioAtLastSave: "expected",
    lastEditedScenario: "expected",
    lastEditedSection: "organizationProfile",
    changedSections: ["organizationProfile"],
    saveCount: 0,
    exportCount: 0,
  };
};

const createChangeLogEntry = (action: string, detail: string): ChangeLogEntry => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  action,
  detail,
});

const initialState = {
  model: {
    ...defaultEditableModel,
    scenarioJustifications: {
      conservative: buildEmptyJustification(),
      expected: buildEmptyJustification(),
      aggressive: buildEmptyJustification(),
    },
  },
  provenance: buildInitialProvenanceMap(),
  overrides: [] as OverrideRecord[],
  changeLog: [
    createChangeLogEntry(
      "Model Created",
      "Initialized the governed calculator with default placeholders and scenario baselines.",
    ),
  ],
  versioning: createVersioningState(),
  leadCapture: null as LeadCaptureRecord | null,
  demoBackup: null as CalculatorStoreState["demoBackup"],
  hasHydrated: false,
  resetKey: 0,
};

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useCalculatorStore = create<CalculatorStoreState>()(
  persist(
    (set) => ({
      ...initialState,
      saveModel: (model) => {
        set((state) => ({
          model,
          versioning: {
            ...state.versioning,
            modelRevision: state.versioning.modelRevision + 1,
            modelLastModifiedAt: new Date().toISOString(),
            selectedScenarioAtLastSave: state.versioning.lastEditedScenario,
            saveCount: state.versioning.saveCount + 1,
          },
        }));
      },
      noteFieldEdit: ({ path, scenario, section, sourceQuality = "estimated_site_input" }) => {
        set((state) => {
          const entry = state.provenance[path];
          const timestamp = new Date().toISOString();

          if (!entry) {
            return state;
          }

          return {
            provenance: {
              ...state.provenance,
              [path]: {
                ...entry,
                sourceLabel: "User",
                provenanceClass: "user_entered",
                sourceQuality,
                notes:
                  entry.benchmarkHint ??
                  "User-entered value. Validate against direct operating data when available.",
                lastUpdatedAt: timestamp,
              },
            },
            versioning: {
              ...state.versioning,
              lastEditedScenario:
                scenario === "global" ? state.versioning.lastEditedScenario : scenario,
              lastEditedSection: section,
              modelLastModifiedAt: timestamp,
              changedSections: Array.from(new Set([...state.versioning.changedSections, section])),
            },
          };
        });
      },
      copyScenario: ({ from, to, model }) => {
        const timestamp = new Date().toISOString();
        const nextModel: EditableModel = {
          ...model,
          scenarios: {
            ...model.scenarios,
            [to]: structuredClone(model.scenarios[from]),
          },
          scenarioJustifications: {
            ...model.scenarioJustifications,
            [to]: structuredClone(model.scenarioJustifications[from]),
          },
        };

        set((state) => {
          const nextProvenance = { ...state.provenance };

          for (const [path, entry] of Object.entries(state.provenance)) {
            if (!path.includes(`.${from}.`)) {
              continue;
            }

            const copiedPath = path.replace(`.${from}.`, `.${to}.`);
            nextProvenance[copiedPath] = {
              ...entry,
              scenario: to,
              sourceLabel: "User",
              provenanceClass: "user_entered",
              sourceQuality: entry.sourceQuality === "generic_placeholder"
                ? "estimated_site_input"
                : entry.sourceQuality,
              notes: `Copied from ${from} scenario on ${timestamp}.`,
              lastUpdatedAt: timestamp,
            };
          }

          return {
            model: nextModel,
            provenance: nextProvenance,
            changeLog: [
              createChangeLogEntry(
                "Scenario Copied",
                `Copied ${from} scenario inputs and justifications into ${to}.`,
              ),
              ...state.changeLog,
            ],
            versioning: {
              ...state.versioning,
              lastEditedScenario: to,
              modelLastModifiedAt: timestamp,
            },
            resetKey: state.resetKey + 1,
          };
        });

        return nextModel;
      },
      addOverride: (record) => {
        const override: OverrideRecord = {
          ...record,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          overrides: [override, ...state.overrides],
          changeLog: [
            createChangeLogEntry(
              "Override Logged",
              `${override.type} recorded for ${override.field} in ${override.section}.`,
            ),
            ...state.changeLog,
          ],
        }));

        return override;
      },
      markCalculated: (scenario) => {
        set((state) => ({
          versioning: {
            ...state.versioning,
            lastEditedScenario: scenario,
            modelLastCalculatedAt: new Date().toISOString(),
          },
          changeLog: [
            createChangeLogEntry(
              "Model Calculated",
              `Recomputed governed outputs for the ${scenario} scenario.`,
            ),
            ...state.changeLog,
          ],
        }));
      },
      markExported: (format) => {
        set((state) => ({
          versioning: {
            ...state.versioning,
            modelLastExportedAt: new Date().toISOString(),
            exportCount: state.versioning.exportCount + 1,
          },
          changeLog: [
            createChangeLogEntry(
              "Model Exported",
              `Generated a ${format} export from the current calculator state.`,
            ),
            ...state.changeLog,
          ],
        }));
      },
      completeLeadCapture: (leadCapture) => {
        set((state) => ({
          leadCapture,
          changeLog: [
            createChangeLogEntry(
              "Lead Capture Completed",
              `Unlocked the calculator for ${leadCapture.workEmail} using ${leadCapture.storageMode} storage mode.`,
            ),
            ...state.changeLog,
          ],
        }));
      },
      clearLeadCapture: () => {
        set((state) => ({
          leadCapture: null,
          changeLog: [
            createChangeLogEntry(
              "Lead Capture Cleared",
              "Removed the stored lead-capture details and re-locked the calculator.",
            ),
            ...state.changeLog,
          ],
        }));
      },
      applyTestDataset: ({ datasetLabel, model }) => {
        const timestamp = new Date().toISOString();
        const importedProvenance = buildImportedProvenanceMap(
          `Loaded from the ${datasetLabel} test dataset on ${timestamp}.`,
        );

        set((state) => ({
          demoBackup:
            state.demoBackup ??
            ({
              model: structuredClone(state.model),
              provenance: structuredClone(state.provenance),
              overrides: structuredClone(state.overrides),
            } satisfies NonNullable<CalculatorStoreState["demoBackup"]>),
          model,
          provenance: importedProvenance,
          overrides: [],
          versioning: {
            ...state.versioning,
            modelLastModifiedAt: timestamp,
            lastEditedScenario: "expected",
            lastEditedSection: "organizationProfile",
            changedSections: [
              "organizationProfile",
              "currentState",
              "costBasis",
              "improvementAssumptions",
              "riskAndRealization",
              "advancedSettings",
              "reviewAndSignOff",
              "scenarioJustification",
            ],
          },
          changeLog: [
            createChangeLogEntry(
              "Test Dataset Loaded",
              `Applied the ${datasetLabel} governed test dataset to the calculator.`,
            ),
            ...state.changeLog,
          ],
          resetKey: state.resetKey + 1,
        }));

        return model;
      },
      restoreWorkingModel: () => {
        let restoredModel: EditableModel | null = null;

        set((state) => {
          if (!state.demoBackup) {
            return state;
          }

          restoredModel = state.demoBackup.model;
          return {
            model: state.demoBackup.model,
            provenance: state.demoBackup.provenance,
            overrides: state.demoBackup.overrides,
            demoBackup: null,
            versioning: {
              ...state.versioning,
              modelLastModifiedAt: new Date().toISOString(),
            },
            changeLog: [
              createChangeLogEntry(
                "Working Model Restored",
                "Restored the pre-demo working model from the local backup.",
              ),
              ...state.changeLog,
            ],
            resetKey: state.resetKey + 1,
          };
        });

        return restoredModel;
      },
      resetModel: () => {
        set((state) => ({
          model: initialState.model,
          provenance: initialState.provenance,
          overrides: [],
          demoBackup: null,
          versioning: {
            ...createVersioningState(),
            selectedScenarioAtLastSave: state.versioning.selectedScenarioAtLastSave,
          },
          changeLog: [
            createChangeLogEntry(
              "Model Reset",
              "Reset the calculator to the governed default placeholder state.",
            ),
            ...state.changeLog,
          ],
          leadCapture: state.leadCapture,
          hasHydrated: true,
          resetKey: state.resetKey + 1,
        }));
      },
      setHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: "bioprocess-roi-calculator",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? fallbackStorage : window.localStorage,
      ),
      partialize: (state) => ({
        model: state.model,
        provenance: state.provenance,
        overrides: state.overrides,
        changeLog: state.changeLog,
        versioning: state.versioning,
        leadCapture: state.leadCapture,
        demoBackup: state.demoBackup,
        resetKey: state.resetKey,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
