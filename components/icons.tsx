type IconProps = { className?: string };

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M6 18 18 6M8 6h10v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ArrowDown({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4v16m0 0 6-6m-6 6-6-6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Plus({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
