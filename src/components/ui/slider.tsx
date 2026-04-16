'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  className?: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, disabled = false }, ref) => {
    const percentage = ((value[0] - min) / (max - min)) * 100;

    return (
      <div
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
      >
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#E1E5EB]">
          <div
            className="absolute h-full bg-[#003087] rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            if (!disabled) {
              onValueChange([Number(e.target.value)]);
            }
          }}
          className={cn(
            'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
          disabled={disabled}
        />
        <div
          className="absolute h-4 w-4 rounded-full border-2 border-[#003087] bg-white shadow-md transition-transform hover:scale-110 focus:scale-110"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';
