"use client";

import { useRef, useState } from "react";
import { FilePlus2, FileUp, Loader2 } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { parseDotx } from "@/lib/import/parseDotx";
import { mapImportToWizardState } from "@/lib/import/mapImportToWizardState";

export function Step0EntryChoice() {
  const setMode = useWizardStore((s) => s.setMode);
  const setCurrentStep = useWizardStore((s) => s.setCurrentStep);
  const hydrateFromImport = useWizardStore((s) => s.hydrateFromImport);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startFromScratch = () => {
    setMode("scratch");
    setCurrentStep(1);
  };

  const handleImportFile = async (file: File) => {
    setError(null);
    setIsImporting(true);
    try {
      const parsed = await parseDotx(file);
      hydrateFromImport(mapImportToWizardState(parsed));
      setCurrentStep(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not read that file as a RamSoft .dotx template.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader title="How would you like to start?" />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={startFromScratch}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white p-6 text-center transition-colors hover:border-brand-blue hover:bg-brand-light"
          >
            <FilePlus2 className="h-8 w-8 text-brand-blue" />
            <span className="font-semibold text-text">
              Start from scratch
            </span>
            <span className="text-xs text-muted">
              Upload your logo and enter your facility&apos;s details.
            </span>
          </button>

          <button
            type="button"
            disabled={isImporting}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white p-6 text-center transition-colors hover:border-brand-blue hover:bg-brand-light disabled:cursor-wait disabled:opacity-70"
          >
            {isImporting ? (
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            ) : (
              <FileUp className="h-8 w-8 text-brand-blue" />
            )}
            <span className="font-semibold text-text">
              Import existing .dotx
            </span>
            <span className="text-xs text-muted">
              Edit a template you already use — we&apos;ll pull in your logo
              and details.
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".dotx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
