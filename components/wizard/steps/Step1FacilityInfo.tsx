"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useWizardStore } from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, FieldLabel, TextInput } from "@/components/ui/FieldLabel";

const schema = z.object({
  name: z.string().min(1, "Facility name is required"),
  tagline: z.string(),
  phone: z.string(),
  fax: z.string(),
  website: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function Step1FacilityInfo() {
  const facilityInfo = useWizardStore((s) => s.facilityInfo);
  const setFacilityInfo = useWizardStore((s) => s.setFacilityInfo);
  const mode = useWizardStore((s) => s.mode);
  const importedRawLines = useWizardStore((s) => s.importedRawLines);

  const { register, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: facilityInfo,
  });

  const values = watch();
  useEffect(() => {
    setFacilityInfo(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.tagline, values.phone, values.fax, values.website]);

  return (
    <Card>
      <CardHeader title="Facility Information" />
      <CardBody>
        {mode === "import" && importedRawLines.length > 0 && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="mb-2 font-semibold text-amber-900">
              Found in your uploaded template — please confirm
            </p>
            <p className="mb-2 text-xs text-amber-800">
              We matched these to the fields below as best we could. Double
              check them, since text extraction from a template can be
              imperfect.
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-900">
              {importedRawLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="name">Facility Name</FieldLabel>
          <TextInput
            id="name"
            placeholder="Texas Imaging Partners"
            {...register("name")}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="tagline">Tagline (optional)</FieldLabel>
          <TextInput
            id="tagline"
            placeholder="Trusted Imaging. True Partnership."
            {...register("tagline")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="phone">Primary Phone</FieldLabel>
            <TextInput
              id="phone"
              placeholder="415-900-2000"
              {...register("phone")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="fax">Fax</FieldLabel>
            <TextInput
              id="fax"
              placeholder="415-301-6739"
              {...register("fax")}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="website">Website (optional)</FieldLabel>
          <TextInput
            id="website"
            placeholder="www.example.com"
            {...register("website")}
          />
        </Field>
      </CardBody>
    </Card>
  );
}
