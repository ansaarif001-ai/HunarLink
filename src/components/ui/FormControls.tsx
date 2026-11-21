import React from 'react';

interface BaseFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const inputBaseClass =
  'w-full min-h-[48px] rounded-xl border-2 border-[#CBD5E1] bg-white px-4 py-2.5 text-base text-[#172B4D] placeholder:text-[#62748A] transition-colors focus:border-[#1769E0] focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 disabled:bg-[#F8FAFC] disabled:text-[#62748A]';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>,
    BaseFieldProps {
  showCounter?: boolean;
  endAdornment?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  id,
  error,
  hint,
  required,
  showCounter = false,
  endAdornment,
  maxLength,
  value,
  className = '',
  ...rest
}) => {
  const currentLength = typeof value === 'string' ? value.length : 0;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-base font-semibold text-[#102A43]">
          {label}
          {required && (
            <span className="ms-1 text-[#D64545]" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {showCounter && maxLength && (
          <span className="ltr-num text-xs font-medium text-[#62748A] tabular-nums">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={[
            inputBaseClass,
            endAdornment ? 'pe-12' : '',
            error ? 'border-[#D64545] focus:border-[#D64545] focus:ring-[#D64545]/20' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 end-1.5 flex items-center">{endAdornment}</div>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-[#D64545]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-[#62748A]">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>,
    BaseFieldProps {
  showCounter?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  id,
  error,
  hint,
  required,
  showCounter = true,
  maxLength,
  value,
  className = '',
  rows = 4,
  ...rest
}) => {
  const currentLength = typeof value === 'string' ? value.length : 0;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-base font-semibold text-[#102A43]">
          {label}
          {required && (
            <span className="ms-1 text-[#D64545]" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {showCounter && maxLength && (
          <span className="ltr-num text-xs font-medium text-[#62748A] tabular-nums">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={[
          inputBaseClass,
          'min-h-[104px]',
          error ? 'border-[#D64545] focus:border-[#D64545] focus:ring-[#D64545]/20' : '',
          className,
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-[#D64545]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-[#62748A]">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'>,
    BaseFieldProps {
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  id,
  error,
  hint,
  required,
  options,
  className = '',
  ...rest
}) => {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-semibold text-[#102A43]">
        {label}
        {required && (
          <span className="ms-1 text-[#D64545]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={[
          inputBaseClass,
          error ? 'border-[#D64545] focus:border-[#D64545] focus:ring-[#D64545]/20' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-[#D64545]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-[#62748A]">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
