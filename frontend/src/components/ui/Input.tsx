import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-gray-400 font-medium">{label}</label>}
      <input
        ref={ref}
        {...props}
        className={`bg-gray-950 border rounded-[6px] px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
          error
            ? 'border-red-600 focus:border-red-500'
            : 'border-[rgba(255,255,255,0.08)] focus:border-[rgba(255,255,255,0.3)]'
        } ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
