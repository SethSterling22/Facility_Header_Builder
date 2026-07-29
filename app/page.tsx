import Link from "next/link";
import { FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-brand-dark px-6 text-center text-white">
      <FileText className="mb-6 h-14 w-14" strokeWidth={1.5} />
      <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight">
        Facility Header Builder
      </h1>
      <p className="mt-4 max-w-md text-lg text-white/70">
        Build and preview your facility&apos;s RamSoft report header, then
        download it — ready for Expert Radiology to review and approve.
      </p>
      <Link
        href="/builder"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Start building
      </Link>
    </div>
  );
}
