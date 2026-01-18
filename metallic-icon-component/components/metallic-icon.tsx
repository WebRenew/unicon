export default function MetallicCodeIcon() {
  return (
    <div className="min-h-screen bg-[hsl(0,0%,6%)] flex items-center justify-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[linear-gradient(to_bottom,#555_0%,#222_8%,#111_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.5)] border-t border-[#999]/40">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-white/80"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>
    </div>
  );
}
