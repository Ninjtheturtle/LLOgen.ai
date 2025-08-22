import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface GenerationStepperProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { id: 0, name: "Discover", description: "Finding pages" },
  { id: 1, name: "Extract", description: "Parsing content" },
  { id: 2, name: "Summarize", description: "Processing data" },
  { id: 3, name: "Compose", description: "Generating llms.txt" },
  { id: 4, name: "Validate", description: "Checking format" },
  { id: 5, name: "Done", description: "Complete" },
];

export function GenerationStepper({ currentStep, className }: GenerationStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  currentStep > step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "border-primary text-primary"
                    : "border-muted-foreground text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : currentStep === step.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm font-medium">{step.id + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
            <div className="mt-2 text-center">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}