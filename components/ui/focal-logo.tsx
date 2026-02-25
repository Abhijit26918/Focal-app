// Focal app icon — viewfinder mark (rounded square + focal dot)
export function FocalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="16"
        height="16"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}
