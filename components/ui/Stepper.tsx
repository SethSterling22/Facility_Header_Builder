"use client";

import clsx from "clsx";

export type StepInfo = {
  id: string;
  label: string;
};

export function Stepper({
  steps,
  currentIndex,
  onStepClick,
  canJumpTo,
}: {
  steps: StepInfo[];
  currentIndex: number;
  onStepClick: (index: number) => void;
  canJumpTo: (index: number) => boolean;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        const clickable = canJumpTo(index);
        return (
          <li key={step.id}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(index)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                isActive && "bg-brand-dark text-white font-semibold",
                !isActive && clickable && "text-text hover:bg-brand-light",
                !isActive && !clickable && "text-muted cursor-not-allowed",
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isActive && "bg-white text-brand-dark",
                  isDone && !isActive && "bg-brand-blue text-white",
                  !isActive && !isDone && "bg-border text-muted",
                )}
              >
                {index + 1}
              </span>
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
