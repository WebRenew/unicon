import { SVGProps } from "react";

export function AiIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M8 16v-6a2 2 0 1 1 4 0v6" />
      <path d="M8 13h4" />
      <path d="M16 8v8" />
    </svg>
  );
}
