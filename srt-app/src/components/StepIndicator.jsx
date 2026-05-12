import React from "react";

function StepIndicator({ steps, currentStep }) {
  return (
    <div className="step-indicator" role="navigation" aria-label="Form progress">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive    = currentStep === step.id;

        return (
          <React.Fragment key={step.id}>
            <div className="step-item">
              <div
                className={`step-circle ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? "✓" : step.id}
              </div>
              <div className={`step-label ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                {step.label}
              </div>
            </div>
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
