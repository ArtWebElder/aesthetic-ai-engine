import logoLight from '@/assets/logo-light.png';

interface LogoProps {
  /** Rendered height in px. Width scales proportionally. */
  height?: number;
  /** Show only the brand mark (square), cropped from the full wordmark. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Creatyng brand logo. Uses the real asset (src/assets/logo-light.png — orange
 * mark + dark wordmark, for light backgrounds). `iconOnly` crops to the left
 * square mark via CSS background-position, so no separate icon file is needed.
 */
export function Logo({ height = 28, iconOnly = false, className }: LogoProps) {
  if (iconOnly) {
    return (
      <div
        role="img"
        aria-label="Creatyng"
        className={className}
        style={{
          width: height,
          height,
          flexShrink: 0,
          backgroundImage: `url(${logoLight})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'left center',
        }}
      />
    );
  }

  return (
    <img
      src={logoLight}
      alt="Creatyng"
      className={className}
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
