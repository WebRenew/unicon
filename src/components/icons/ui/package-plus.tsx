/**
 * PackagePlus icon from Unicon library (lucide:package-plus)
 */

interface IconProps {
    className?: string;
    size?: number;
}

export function PackagePlusIcon({ className, size = 24 }: IconProps) {
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
            <path d="M16 16h6" />
            <path d="M19 13v6" />
            <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
            <path d="m7.5 4.27 9 5.15" />
            <path d="M3.29 7 12 12l8.71-5" />
            <path d="M12 22V12" />
        </svg>
    );
}
