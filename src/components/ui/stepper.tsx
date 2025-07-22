import React from 'react'
import { Check } from 'lucide-react'

interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const isClickable = stepNumber <= currentStep && onStepClick
        
        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable ? onStepClick(stepNumber) : undefined}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-600 border-green-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-gray-200 border-gray-300 text-gray-500'
                } ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
              </button>
              <span className={`text-xs mt-2 text-center max-w-20 ${
                isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                stepNumber < currentStep ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}