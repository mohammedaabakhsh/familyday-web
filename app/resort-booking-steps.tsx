"use client";

import { Check } from "lucide-react";
import type { ResortStep } from "./booking-navigation";

const steps = [
  { screen: "cabin", label: "المكان" },
  { screen: "dates", label: "الموعد" },
  { screen: "addons", label: "الإضافات" },
  { screen: "review", label: "المراجعة" },
] as const;

export default function ResortBookingSteps({ current, dateSelected, onSelect }: {
  current: ResortStep;
  dateSelected: boolean;
  onSelect: (step: ResortStep) => void;
}) {
  const activeIndex = steps.findIndex(step => step.screen === current);
  return <nav aria-label="خطوات الحجز">
    <ol className="resort-booking-steps">
      {steps.map(({ screen, label }, index) => {
        const active = screen === current;
        const complete = !active && (index < activeIndex || (screen === "dates" && dateSelected));
        const canOpen = !active && (complete || screen === "dates" || (screen === "addons" && current === "cabin" && dateSelected));
        const content = <>
          <span className="step-number" aria-hidden="true">{index + 1}</span>
          <span>{label}</span>
          {complete && <Check size={12} className="step-check" aria-hidden="true"/>}
        </>;
        return <li key={screen} aria-current={active ? "step" : undefined} className={active ? "current" : complete ? "complete" : undefined}>
          {canOpen ? <button type="button" onClick={() => onSelect(screen)}
            aria-label={`${index + 1} ${label}${complete ? "، مكتملة" : ""}`}>{content}</button>
          : <span className="step-static">{content}</span>}
        </li>;
      })}
    </ol>
  </nav>;
}
