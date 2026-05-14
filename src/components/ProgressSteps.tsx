import { Check, FileSearch, Sparkles, Presentation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = "idle" | "reading" | "summarizing" | "building" | "done" | "error";

const STEPS = [
  { id: "reading", label: "Reading File", Icon: FileSearch },
  { id: "summarizing", label: "AI Summarizing", Icon: Sparkles },
  { id: "building", label: "Building Slides", Icon: Presentation },
] as const;

const ORDER: Record<Step, number> = { idle: -1, reading: 0, summarizing: 1, building: 2, done: 3, error: -1 };

export function ProgressSteps({ step }: { step: Step }) {
  const current = ORDER[step];
  return (
    <div className="flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const done = current > i || step === "done";
        const active = current === i;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]",
                  !done && !active && "border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="h-5 w-5" /> : active ? <Loader2 className="h-5 w-5 animate-spin" /> : <s.Icon className="h-5 w-5" />}
              </div>
              <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 transition-colors", done ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
