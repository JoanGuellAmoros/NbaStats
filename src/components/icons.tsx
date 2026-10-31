import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function Base({
  className,
  children,
  viewBox = "0 0 24 24",
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function BasketballIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18" />
      <path d="M5.4 5.4c3.6 2 3.6 11.2 0 13.2M18.6 5.4c-3.6 2-3.6 11.2 0 13.2" />
    </Base>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m15 18-6-6 6-6" />
    </Base>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m9 18 6-6-6-6" />
    </Base>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M20 11a8 8 0 1 0-2.3 6.7" />
      <path d="M20 4v7h-7" />
    </Base>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Base>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </Base>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 21h14" />
    </Base>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </Base>
  );
}

export function WifiIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M2.5 8.5a15 15 0 0 1 19 0M5.8 12a10 10 0 0 1 12.4 0M9 15.5a5 5 0 0 1 6 0" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function WifiOffIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M2.5 8.5a15 15 0 0 1 6-3.2M15.5 5.6a15 15 0 0 1 6 2.9M5.8 12a10 10 0 0 1 4-2.2M14.2 9.9a10 10 0 0 1 4 2.1M9 15.5a5 5 0 0 1 4.6-.5" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      <path d="M3 3l18 18" />
    </Base>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
      <path d="M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
    </Base>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Base>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Base>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Base>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </Base>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M14 4h6v6M20 4 11 13" />
      <path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </Base>
  );
}
