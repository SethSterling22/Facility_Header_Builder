"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { WizardShell } from "@/components/wizard/WizardShell";

export default function BuilderPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppHeader />
      <main className="flex-1">
        <WizardShell />
      </main>
    </div>
  );
}
