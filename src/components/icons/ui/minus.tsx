/**
 * Minus icon from Unicon library (lucide:minus)
 */

interface IconProps {
    className?: string;
    size?: number;
}

export function MinusIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={className}
        >
            <path d="M5 12h14" />
        </svg>
    );
}
