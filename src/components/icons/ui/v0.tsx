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
      <path d="m6.256 21.468-6.256-18.934h3.58L9.04 18.18l5.464-15.648h3.495L11.74 21.468zm11.744 0V7.505l-5.312 6.938h3.14v2.022h-1.9l-2.82 3.623h6.892V21.468zm-5.312-9.984V2.534H24l-5.4 6.926h-1.12L24 16.384v5.086H12.684l4.02-5.086h4.176l-5.316-6.923h3.124l-5.316-6.928h.656v8.948Z" />
    </svg>
  );
}
