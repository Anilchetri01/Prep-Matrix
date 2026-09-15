import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowIcon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  description,
  action,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[14px] border border-[#DDE3EC] bg-white p-4.5 shadow-sm dark:border-[#263449] dark:bg-[#101827] sm:p-6">
      {/* Very subtle indigo glow in corner per Midnight Signal specs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#6D5EF9]/[0.07] blur-3xl dark:bg-[#6D5EF9]/[0.10]"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[#EEECFF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.10em] text-[#5B4BE7] dark:bg-[#1D1B49] dark:text-[#8174FF]">
              {EyebrowIcon && <EyebrowIcon className="h-3 w-3" />}
              <span>{eyebrow}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#142033] dark:text-[#F4F7FB] sm:text-[32px] sm:leading-[40px]">
              {title}
            </h1>
            {badge}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#5F6F84] dark:text-[#AAB7CA] sm:text-[15px]">
            {description}
          </p>
        </div>

        {action && (
          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            {action}
          </div>
        )}
      </div>

      {children && <div className="relative mt-5 border-t border-[#DDE3EC] pt-4 dark:border-[#263449]">{children}</div>}
    </section>
  );
}
