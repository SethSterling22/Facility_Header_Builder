import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-card border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  title,
}: {
  icon?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-brand-light px-5 py-3.5 text-[0.95rem] font-semibold text-brand-dark">
      {icon}
      <span>{title}</span>
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
