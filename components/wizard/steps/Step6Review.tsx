"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generateDotx } from "@/lib/dotx/generateDotx";

function slugifyFilename(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Facility Header";
}

export function Step6Review() {
  const wizardState = useWizardStore((s) => s);
  const setValidation = useWizardStore((s) => s.setValidation);
  const validation = useWizardStore((s) => s.validation);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { blob, validation: result } = await generateDotx(wizardState);
      setValidation(result);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slugifyFilename(wizardState.facilityInfo.name)}.dotx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setValidation({
        status: "fail",
        messages: [
          err instanceof Error
            ? err.message
            : "Something went wrong generating the template.",
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Review & Generate" />
      <CardBody>
        <p className="mb-4 text-sm text-muted">
          Check the live preview on the right, then generate your `.dotx`.
          Download it and send it back to Expert Radiology for final
          approval.
        </p>

        <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Facility</dt>
          <dd className="text-text">
            {wizardState.facilityInfo.name || "—"}
          </dd>
          <dt className="text-muted">Locations</dt>
          <dd className="text-text">
            {wizardState.locations.length || "0"}
          </dd>
          <dt className="text-muted">Logo</dt>
          <dd className="text-text">
            {wizardState.logo.dataUrl ? "Uploaded" : "Not set"}
          </dd>
          <dt className="text-muted">Report fields</dt>
          <dd className="text-text">
            {wizardState.bookmarkConfig.included.length} selected
          </dd>
        </dl>

        {validation.status !== "idle" && (
          <div className="mb-4">
            <Badge tone={validation.status === "pass" ? "success" : "error"}>
              {validation.status === "pass"
                ? "Validated — template is RamSoft-ready"
                : "Validation failed"}
            </Badge>
            {validation.messages.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-muted">
                {validation.messages.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Generate & Download .dotx
        </Button>
      </CardBody>
    </Card>
  );
}
