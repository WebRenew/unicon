import type { SVGProps } from "react";

/**
 * v0 logo icon from Simple Icons
 * @see https://v0.dev
 */
export function V0Icon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d="M12.001 0C5.326 0 0 5.326 0 12.001c0 6.674 5.326 12 12.001 12 6.674 0 12-5.326 12-12C24 5.326 18.675 0 12.001 0zm5.046 17.105h-2.9l-2.146-4.283-2.147 4.283h-2.9l4.047-7.534-2.025-3.76h2.897l.925 1.946h.001l.03.063.955-2.01h2.897l-2.538 4.726 2.904 6.569z" />
    </svg>
  );
}
