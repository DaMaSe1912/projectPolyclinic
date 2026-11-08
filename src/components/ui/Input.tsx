import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = '', disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-medium text-[#0F172A] mb-[6px] select-none font-body"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`h-[42px] px-[14px] py-[10px] text-[15px] font-body text-[#0F172A] bg-white rounded-[8px] transition-colors outline-none
            ${
              error
                ? 'border-2 border-[#EF4444] focus:ring-3 focus:ring-[#EF444418]'
                : disabled
                ? 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                : 'border border-[#E2E8F0] hover:border-[#0F172A] focus:border-2 focus:border-[#0F172A] focus:ring-3 focus:ring-[#0F172A18]'
            }
            ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-[12px] text-[#EF4444] mt-[4px] font-body">{error}</span>
        ) : helperText ? (
          <span className="text-[12px] text-[#475569] mt-[4px] font-body">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
