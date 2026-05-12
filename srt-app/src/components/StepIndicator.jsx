// StepIndicator.jsx
// Horizontal progress indicator for multi-step forms.
// Shows each step as a numbered circle connected by a line.
// Completed steps show a checkmark; the active step is highlighted green.
//
// Props:
//   steps       — array of { id, label } objects defining each step
//   currentStep — the id of the currently active step (number)
//
// Usage:
//   <StepIndicator steps={STEPS} currentStep={2} />

import React from "react";

function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator" role="navigation" aria-label="Form progress">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive    = currentStep === step.id;

        return (
          <React.Fragment key={step.id}>

            {/* Step circle + label */}
            <div className="step-item">
              <div
                className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Show checkmark for completed steps, number for others */}
                {isCompleted ? "✓" : step.id}
              </div>
              <div className={`step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                {step.label}
              </div>
            </div>

            {/* Connector line between steps — not shown after the last step */}
            {index < steps.length - 1 && (
              <div className={`step-connector ${isCompleted ? "completed" : ""}`} />
            )}

          </React.Fragment>
        );
      })}
    </div>
  );
}

export default StepIndicator;
