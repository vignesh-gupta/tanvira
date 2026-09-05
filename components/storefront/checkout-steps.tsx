import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = ["Details", "Address", "Payment"]

export function CheckoutSteps({
  currentStep,
  onStepClick,
}: {
  currentStep: 1 | 2 | 3
  onStepClick?: (step: 1 | 2 | 3) => void
}) {
  return (
    <ol className="mb-8 flex items-center" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3
        const done = stepNum < currentStep
        const active = stepNum === currentStep
        const isLast = i === STEPS.length - 1
        const clickable = done && onStepClick

        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(stepNum)}
                aria-label={clickable ? `Back to ${label}` : label}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors duration-200",
                  done || active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                  clickable ? "cursor-pointer" : "cursor-default",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="size-3.5" /> : stepNum}
              </button>
              <span className={cn("text-[11px]", active ? "text-foreground font-medium" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 transition-colors duration-200",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
