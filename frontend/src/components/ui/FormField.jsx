import { forwardRef } from "react";

export const FormField = forwardRef(({ label, error, className = "", ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-neutral-400">{label}</label>
      )}
      <input
        ref={ref}
        className={`px-3 py-2 bg-neutral-800 border ${
          error ? "border-red-500" : "border-neutral-700"
        } rounded text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        {...props}
      />
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
});

FormField.displayName = "FormField";
