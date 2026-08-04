"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { completeOnboarding, ONBOARDING_STEPS } from "../domain/onboarding";

export function OnboardingPanel({
  onClose,
  explicit = false,
}: {
  onClose: () => void;
  explicit?: boolean;
}) {
  const [step, setStep] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const current = ONBOARDING_STEPS[step];

  useEffect(() => {
    if (explicit) titleRef.current?.focus();
  }, [explicit]);

  const finish = () => {
    completeOnboarding();
    onClose();
  };

  return (
    <section
      aria-labelledby="onboarding-title"
      className="surface-workbench grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      data-onboarding
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
            Quick Start · {step + 1}/{ONBOARDING_STEPS.length}
          </span>
          <span className="h-px flex-1 bg-graphite" />
        </div>
        <h2
          id="onboarding-title"
          ref={titleRef}
          tabIndex={-1}
          className="mt-2 text-base font-medium outline-none"
        >
          {current.title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {current.detail}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button variant="ghost" size="sm" onClick={finish}>
          <XIcon />
          Skip
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep((value) => value - 1)}
        >
          <ArrowLeftIcon />
          Back
        </Button>
        {step === ONBOARDING_STEPS.length - 1 ? (
          <Button size="sm" onClick={finish}>
            Finish
          </Button>
        ) : (
          <Button size="sm" onClick={() => setStep((value) => value + 1)}>
            Next
            <ArrowRightIcon />
          </Button>
        )}
      </div>
    </section>
  );
}
