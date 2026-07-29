"use client";

import { Plus, Trash2 } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldLabel, TextInput } from "@/components/ui/FieldLabel";

export function Step3Locations() {
  const locations = useWizardStore((s) => s.locations);
  const addLocation = useWizardStore((s) => s.addLocation);
  const updateLocation = useWizardStore((s) => s.updateLocation);
  const removeLocation = useWizardStore((s) => s.removeLocation);

  return (
    <Card>
      <CardHeader title="Locations & Footer" />
      <CardBody>
        <p className="mb-4 text-sm text-muted">
          Add every location that should appear in the report footer — most
          facilities have one, but you can add more if you&apos;ve opened a
          new office.
        </p>

        <div className="flex flex-col gap-4">
          {locations.map((loc, index) => (
            <div
              key={loc.id}
              className="rounded-lg border border-border bg-bg p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Location {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeLocation(loc.id)}
                  className="text-muted hover:text-red-600"
                  aria-label="Remove location"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-3">
                <FieldLabel>Location Name</FieldLabel>
                <TextInput
                  placeholder="San Antonio"
                  value={loc.name}
                  onChange={(e) =>
                    updateLocation(loc.id, { name: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <FieldLabel>Address</FieldLabel>
                <TextInput
                  placeholder="4903 Golden Quail, Ste 110, San Antonio, TX"
                  value={loc.address}
                  onChange={(e) =>
                    updateLocation(loc.id, { address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <TextInput
                    placeholder="210-555-0100"
                    value={loc.phone}
                    onChange={(e) =>
                      updateLocation(loc.id, { phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Fax</FieldLabel>
                  <TextInput
                    placeholder="210-555-0101"
                    value={loc.fax}
                    onChange={(e) =>
                      updateLocation(loc.id, { fax: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="secondary"
          className="mt-4"
          onClick={addLocation}
        >
          <Plus className="h-4 w-4" /> Add another location
        </Button>
      </CardBody>
    </Card>
  );
}
