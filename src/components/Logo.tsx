import logoMarkSrc from "@/assets/rebateboard-mark.png";

type LogoProps = {
  className?: string;
  /** Show only the icon mark. Default false shows icon + wordmark. */
  iconOnly?: boolean;
  /** Tailwind height class, e.g. "h-9". Width auto-adjusts. */
  heightClass?: string;
  /** Deprecated: kept for callers that still pass width classes. */
  widthClass?: string;
  alt?: string;
};

export function Logo({
  className = "",
  iconOnly = false,
  heightClass = "h-9",
  widthClass: _widthClass = "",
  alt = "RebateBoard",
}: LogoProps) {
  const mark = (
    <span className={`inline-flex ${heightClass} aspect-square shrink-0 items-center justify-center`} aria-hidden>
      <img
        src={logoMarkSrc}
        alt=""
        className="h-[128%] w-[128%] max-w-none object-contain"
      />
    </span>
  );

  if (iconOnly) {
    return (
      <span className={`inline-flex ${className}`} aria-label={alt}>
        {mark}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label={alt}
    >
      {mark}
      <span className="whitespace-nowrap text-[1.42rem] font-black leading-none text-white sm:text-[1.58rem]">
        RebateBoard
      </span>
    </span>
  );
}
