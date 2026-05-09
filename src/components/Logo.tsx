import logoSrc from "@/assets/logo.jpg";

type LogoProps = {
  className?: string;
  /** Show only the icon mark (cropped). Default false shows full wordmark. */
  iconOnly?: boolean;
  /** Tailwind height class, e.g. "h-9". Width auto-adjusts. */
  heightClass?: string;
  alt?: string;
};

/**
 * RebateBoard logo. The source asset has generous white padding around the
 * mark, so we render it on a white rounded chip to keep the brand readable
 * on the dark UI without distortion.
 */
export function Logo({
  className = "",
  iconOnly = false,
  heightClass = "h-9",
  alt = "RebateBoard",
}: LogoProps) {
  if (iconOnly) {
    // Crop to the icon portion (~ left third of the wordmark image)
    return (
      <div
        className={`relative ${heightClass} aspect-square overflow-hidden rounded-xl bg-white ${className}`}
        aria-label={alt}
      >
        <img
          src={logoSrc}
          alt={alt}
          className="absolute left-0 top-1/2 h-[170%] -translate-y-1/2 max-w-none"
          style={{ width: "auto" }}
        />
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`${heightClass} w-auto rounded-md bg-white px-2 py-1 ${className}`}
    />
  );
}
