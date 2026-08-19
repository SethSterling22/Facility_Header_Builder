"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import "cropperjs/dist/cropper.css";
import type { ReactCropperElement } from "react-cropper";
import {
  useWizardStore,
  MAX_LOGO_WIDTH_INCHES,
  MIN_LOGO_WIDTH_INCHES,
} from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { UploadDropzone } from "@/components/ui/UploadDropzone";

const Cropper = dynamic(
  () => import("react-cropper").then((mod) => mod.Cropper),
  { ssr: false },
);

export function Step2Logo() {
  const logo = useWizardStore((s) => s.logo);
  const setLogo = useWizardStore((s) => s.setLogo);
  const cropperRef = useRef<ReactCropperElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setRawSrc(url);
  };

  const confirmCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const dataUrl = cropper.getCroppedCanvas({ maxWidth: 1200 }).toDataURL(
      "image/png",
    );
    setLogo({ dataUrl });
    setRawSrc(null);
  };

  return (
    <Card>
      <CardHeader title="Facility Logo" />
      <CardBody>
        {rawSrc ? (
          <div className="flex flex-col gap-3">
            <div className="h-72 bg-bg">
              <Cropper
                ref={cropperRef}
                src={rawSrc}
                viewMode={1}
                guides
                background={false}
                autoCropArea={0.9}
                checkOrientation={false}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRawSrc(null)}>
                Cancel
              </Button>
              <Button onClick={confirmCrop}>Use this crop</Button>
            </div>
          </div>
        ) : (
          <>
            <UploadDropzone
              accept="image/*"
              label="Drop your logo here or click to browse"
              hint="PNG or SVG with a transparent background works best"
              preview={logo.dataUrl}
              onFile={handleFile}
            />
            {logo.dataUrl && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Printed size
                </p>
                <Slider
                  label="Width on the page (inches)"
                  value={logo.widthInches}
                  defaultValue={2.3}
                  min={MIN_LOGO_WIDTH_INCHES}
                  max={MAX_LOGO_WIDTH_INCHES}
                  step={0.1}
                  onChange={(widthInches) => setLogo({ widthInches })}
                />
                <p className="mb-4 text-xs text-muted">
                  {logo.widthInches.toFixed(1)}in wide — the page fits{" "}
                  {MAX_LOGO_WIDTH_INCHES}in. Height scales automatically.
                </p>

                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Adjustments
                </p>
                <Slider
                  label="Brightness"
                  value={logo.brightness}
                  defaultValue={1}
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  onChange={(brightness) => setLogo({ brightness })}
                />
                <Slider
                  label="Contrast"
                  value={logo.contrast}
                  defaultValue={1}
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  onChange={(contrast) => setLogo({ contrast })}
                />
                <Slider
                  label="Saturation"
                  value={logo.saturation}
                  defaultValue={1}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={(saturation) => setLogo({ saturation })}
                />
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
