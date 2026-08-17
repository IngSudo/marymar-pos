export default function Empanada({ size = 24, strokeWidth = 2, color = 'currentColor', className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4,14 Q4,6 12,6 Q20,6 20,14 a2,2 0 0 1 -4,0 a2,2 0 0 1 -4,0 a2,2 0 0 1 -4,0 a2,2 0 0 1 -4,0 Z" />
      <path d="M9,9.5 Q12,8 15,9.5" />
    </svg>
  );
}
