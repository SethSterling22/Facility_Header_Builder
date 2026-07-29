import type { ReactNode } from "react";

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-muted uppercase"
    >
      {children}
    </label>
  );
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
    />
  );
}
