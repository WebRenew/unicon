/**
 * ChevronUp icon from Unicon library (lucide:chevron-up)
 */

interface IconProps {
    className?: string;
    size?: number;
}

export function ChevronUpIcon({ className, size = 24 }: IconProps) {
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
            <path d="m18 15-6-6-6 6" />
        </svg>
    );
}
