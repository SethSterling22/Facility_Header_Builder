"use client";

import { ClipboardList, Eye } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { ReportPreview } from "@/components/preview/ReportPreview";
import { WIZARD_STEPS } from "./steps";
import { Step0EntryChoice } from "./steps/Step0EntryChoice";
import { Step1FacilityInfo } from "./steps/Step1FacilityInfo";
import { Step2Logo } from "./steps/Step2Logo";
import { Step3Locations } from "./steps/Step3Locations";
import { Step4HeaderLayout } from "./steps/Step4HeaderLayout";
import { Step5Bookmarks } from "./steps/Step5Bookmarks";
import { Step6Review } from "./steps/Step6Review";

const STEP_COMPONENTS = [
  Step0EntryChoice,
  Step1FacilityInfo,
  Step2Logo,
  Step3Locations,
  Step4HeaderLayout,
  Step5Bookmarks,
  Step6Review,
];

export function WizardShell() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const setCurrentStep = useWizardStore((s) => s.setCurrentStep);
  const mode = useWizardStore((s) => s.mode);

  const StepComponent = STEP_COMPONENTS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === WIZARD_STEPS.length - 1;

  return (
    <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 p-8 lg:grid-cols-[280px_1fr_1fr]">
      <div className="lg:col-start-1 lg:row-start-1">
        <Card>
          <CardHeader
            icon={<ClipboardList className="h-4 w-4" />}
            title="Steps"
          />
          <CardBody>
            <Stepper
              steps={WIZARD_STEPS}
              currentIndex={currentStep}
              onStepClick={setCurrentStep}
              canJumpTo={(index) =>
                index === 0 || (mode !== null && index <= currentStep)
              }
            />
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-1">
        <StepComponent />

        {!isFirst && (
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
            {!isLast && (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            )}
          </div>
        )}
      </div>

      {/* min-w-0 keeps the fixed-width preview page from blowing out the grid. */}
      <div className="min-w-0 lg:col-start-3 lg:row-start-1 lg:self-start lg:sticky lg:top-8">
        <Card>
          <CardHeader icon={<Eye className="h-4 w-4" />} title="Live Preview" />
          <CardBody className="bg-bg">
            <ReportPreview />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
