import clsx from "clsx";
import type { ReactNode } from "react";

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "error" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tone === "success" && "bg-green-100 text-green-800",
        tone === "error" && "bg-red-100 text-red-800",
        tone === "neutral" && "bg-brand-light text-brand-dark",
      )}
    >
      {children}
    </span>
  );
}
