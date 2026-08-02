import { useId } from "react";
import { KawaiiIcon } from "./KawaiiIcon";

const PALETTES = {
  sage: {
    surface: "oklch(0.92 0.055 143)",
    soft: "oklch(0.86 0.085 145)",
    accent: "oklch(0.72 0.13 143)",
    ink: "oklch(0.37 0.075 151)",
    light: "oklch(0.97 0.025 120)",
  },
  blossom: {
    surface: "oklch(0.93 0.045 24)",
    soft: "oklch(0.86 0.085 24)",
    accent: "oklch(0.72 0.13 29)",
    ink: "oklch(0.39 0.075 22)",
    light: "oklch(0.98 0.02 54)",
  },
  dew: {
    surface: "oklch(0.93 0.045 219)",
    soft: "oklch(0.86 0.075 215)",
    accent: "oklch(0.71 0.11 220)",
    ink: "oklch(0.37 0.07 220)",
    light: "oklch(0.98 0.018 205)",
  },
  honey: {
    surface: "oklch(0.94 0.055 88)",
    soft: "oklch(0.86 0.09 82)",
    accent: "oklch(0.75 0.13 75)",
    ink: "oklch(0.4 0.07 68)",
    light: "oklch(0.98 0.025 96)",
  },
  night: {
    surface: "oklch(0.32 0.045 252)",
    soft: "oklch(0.4 0.07 247)",
    accent: "oklch(0.74 0.1 172)",
    ink: "oklch(0.91 0.035 116)",
    light: "oklch(0.82 0.07 86)",
  },
};

const AUTO_TONES = {
  water: "dew",
  book: "blossom",
  journal: "blossom",
  stretch: "honey",
  moon: "night",
  rest: "night",
  breathe: "dew",
  tea: "honey",
  music: "blossom",
  heart: "blossom",
  task: "sage",
};

const CUSTOM_GLYPHS = {
  water: (
    <>
      <path d="M32 14.5S21.4 26.2 21.4 35a10.6 10.6 0 0 0 21.2 0C42.6 26.2 32 14.5 32 14.5Z" fill="var(--habit-icon-accent)" />
      <path d="M27.2 35.8c.4 3 2.2 4.8 5.2 5.4" fill="none" stroke="var(--habit-icon-light)" strokeLinecap="round" strokeWidth="3" />
      <path d="M39.4 17.2c1.8-3.3 4.6-4.6 8.2-3.9-1.1 3.7-3.8 5.1-8.2 3.9Z" fill="var(--habit-icon-soft)" />
    </>
  ),
  book: (
    <>
      <path d="M15.7 19.5h12.1c2.8 0 4.2 1.6 4.2 4.1v25c0-2.4-1.4-4-4.2-4H15.7V19.5Z" fill="var(--habit-icon-light)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="M48.3 19.5H36.2c-2.8 0-4.2 1.6-4.2 4.1v25c0-2.4 1.4-4 4.2-4h12.1V19.5Z" fill="var(--habit-icon-soft)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="M21 27h6M37 27h6M21 33h6M37 33h6" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="2" />
      <path d="M43 17.7c1.2-3 3.6-4.4 7-4.1-.6 3.3-2.9 4.7-7 4.1Z" fill="var(--habit-icon-accent)" />
    </>
  ),
  stretch: (
    <>
      <circle cx="32" cy="20" r="5.2" fill="var(--habit-icon-accent)" />
      <path d="M32 26.5v13.4m0-9.4-11.8-5M32 30.5l12.3-5.7M32 39.9l-9.1 10.5M32 39.9l10.2 9.7" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <path d="M18.2 20.2c-3.7-.8-5.9-3-6.4-6.6 3.9-.2 6.2 2 6.4 6.6ZM46 20c.6-3.8 2.8-6 6.5-6.5.1 3.9-2.1 6.2-6.5 6.5Z" fill="var(--habit-icon-soft)" />
    </>
  ),
  moon: (
    <>
      <path d="M44.2 40.8A18 18 0 0 1 22 17.4a17.6 17.6 0 1 0 22.2 23.4Z" fill="var(--habit-icon-light)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="m43.8 17.4 1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2 1.2-3Z" fill="var(--habit-icon-accent)" />
      <circle cx="49.5" cy="32.5" r="2.2" fill="var(--habit-icon-soft)" />
    </>
  ),
  breathe: (
    <>
      <path d="M13.6 25.1h26.1c6.1 0 6.3-8.8.8-9.6-2.8-.4-4.9.9-5.8 3" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="3.2" />
      <path d="M13.6 34.6h36c6.6 0 7.2 9.8.8 10.7-3.3.4-5.6-1.2-6.6-3.7" fill="none" stroke="var(--habit-icon-accent)" strokeLinecap="round" strokeWidth="3.2" />
      <path d="M14 44.5h17" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="3.2" />
      <path d="M18.4 18.3c-2.7-2.8-3.1-5.8-1.1-9 3 2.5 3.4 5.5 1.1 9Z" fill="var(--habit-icon-soft)" />
    </>
  ),
  journal: (
    <>
      <path d="M18 15.3h27.1c2.3 0 4.1 1.8 4.1 4.1v29.3H22.1a4.1 4.1 0 0 1-4.1-4.1V15.3Z" fill="var(--habit-icon-light)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M25 15.3v33.4M31 25h11M31 32h11M31 39h7" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M43.6 15.7c.6-3.8 2.8-6 6.5-6.5.1 3.9-2.1 6.2-6.5 6.5Z" fill="var(--habit-icon-accent)" />
    </>
  ),
  task: (
    <>
      <rect x="17" y="17" width="30" height="30" rx="9" fill="var(--habit-icon-light)" stroke="var(--habit-icon-ink)" strokeWidth="2.6" />
      <path d="m24.5 32 5.7 5.7 10.6-12" fill="none" stroke="var(--habit-icon-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      <path d="M42.5 18c.3-4 2.4-6.4 6.3-7 .3 4.2-1.8 6.6-6.3 7Z" fill="var(--habit-icon-soft)" />
    </>
  ),
  heart: (
    <>
      <path d="M32 48.8 16.7 34a10.9 10.9 0 0 1 15.3-15.4A10.9 10.9 0 0 1 47.3 34L32 48.8Z" fill="var(--habit-icon-accent)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.4" />
      <path d="M24.3 24.8c-2.1 1-3.2 2.5-3.3 4.5" fill="none" stroke="var(--habit-icon-light)" strokeLinecap="round" strokeWidth="3" />
      <path d="M33.3 18.3c1.4-4 4.3-5.8 8.5-5.4-.8 4.3-3.6 6.1-8.5 5.4Z" fill="var(--habit-icon-soft)" />
    </>
  ),
  tea: (
    <>
      <path d="M16.5 25.5h29v11.7c0 8-5.2 13-14.5 13s-14.5-5-14.5-13V25.5Z" fill="var(--habit-icon-light)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.6" />
      <path d="M45.5 29h2.8a6 6 0 0 1 0 12h-4M23.8 20.8c-3.5-2.8 1.7-5-1-8M32.9 20.8c-3.5-2.8 1.7-5-1-8" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M38.5 24c.6-3.8 2.8-6 6.5-6.5.1 3.9-2.1 6.2-6.5 6.5Z" fill="var(--habit-icon-accent)" />
    </>
  ),
  music: (
    <>
      <path d="M27 43V20.5l20-4v20.8M27 27l20-4" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" />
      <ellipse cx="21" cy="44" rx="6.1" ry="4.5" fill="var(--habit-icon-accent)" />
      <ellipse cx="41" cy="38" rx="6.1" ry="4.5" fill="var(--habit-icon-soft)" />
      <path d="M46 15.6c.5-3.5 2.5-5.6 6-6.2.2 3.7-1.8 5.8-6 6.2Z" fill="var(--habit-icon-accent)" />
    </>
  ),
  plant: (
    <>
      <path d="M21.4 34h21.2l-2.4 16.5H23.8L21.4 34Z" fill="var(--habit-icon-soft)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M32 34V21" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="2.8" />
      <path d="M31.8 25.7c-8.7-.2-13.4-4.5-13.6-12.4 8.6-.2 13.3 4 13.6 12.4ZM32.2 29.3c.3-9 4.8-13.8 13.3-14 .2 8.5-4.3 13.4-13.3 14Z" fill="var(--habit-icon-accent)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2" />
    </>
  ),
  seedling: (
    <>
      <path d="M32 51V26" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="3" />
      <path d="M31.7 34C22.2 33.7 17 29 16.8 20.4c9.3-.2 14.5 4.4 14.9 13.6ZM32.3 28.9c.5-10 5.7-15.3 15-15.5.2 9.5-4.9 14.9-15 15.5Z" fill="var(--habit-icon-accent)" stroke="var(--habit-icon-ink)" strokeLinejoin="round" strokeWidth="2" />
      <path d="M18 51h28" fill="none" stroke="var(--habit-icon-ink)" strokeLinecap="round" strokeWidth="2.6" />
    </>
  ),
};

function readableName(name) {
  return String(name || "habit")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase();
}

/**
 * Filled, botanical habit tile for primary habit rows and pickers.
 *
 * Use `tone="night"` for the Moonlit Nook theme, or override any of the
 * `--habit-icon-*` custom properties from a theme. Unknown names gracefully
 * fall back to the matching line icon inside the same illustrated tile.
 */
export function HabitIcon({
  name = "seedling",
  size = 52,
  tone = "auto",
  color,
  decorative = true,
  label,
  title,
  className,
  style,
  ...svgProps
}) {
  const titleId = useId();
  const isDecorative = decorative && !label && !title;
  const accessibleName = title || label || `${readableName(name)} habit`;
  const resolvedTone = tone === "auto" ? AUTO_TONES[name] || "sage" : tone;
  const palette = PALETTES[resolvedTone] || PALETTES.sage;
  const customProperties = {
    "--habit-icon-surface": palette.surface,
    "--habit-icon-soft": palette.soft,
    "--habit-icon-accent": color || palette.accent,
    "--habit-icon-ink": palette.ink,
    "--habit-icon-light": palette.light,
    color: "var(--habit-icon-ink)",
    ...style,
  };
  const glyph = CUSTOM_GLYPHS[name];

  return (
    <svg
      {...svgProps}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={customProperties}
      focusable="false"
      aria-hidden={isDecorative ? true : undefined}
      aria-labelledby={!isDecorative && title ? titleId : undefined}
      aria-label={!isDecorative && !title ? accessibleName : undefined}
      role={isDecorative ? undefined : "img"}
    >
      {!isDecorative && title ? <title id={titleId}>{title}</title> : null}

      <path
        d="M18.1 5.3c8.2-2 20.2-1.7 28.1.8 7 2.2 11 7.8 12 15.2 1.2 8.7.8 21.4-2.9 29.2-3.2 6.8-9.4 9.1-17.5 9.4-8.7.3-20.7.1-27.1-5.1C4.8 50 4.8 41.1 4.6 32.9 4.4 23 3.9 14.1 10.8 9c2-1.5 4.5-2.8 7.3-3.7Z"
        fill="var(--habit-icon-surface)"
      />
      <path d="M9.7 19.4c4.6-1.1 7.9.4 9.8 4.3-4.6 1.4-7.9-.1-9.8-4.3Z" fill="var(--habit-icon-soft)" opacity=".72" />
      <path d="M48.5 48.3c1-4.6 3.8-7.1 8.2-7.3-.8 4.8-3.5 7.2-8.2 7.3Z" fill="var(--habit-icon-soft)" opacity=".76" />
      <circle cx="51.7" cy="20.2" r="1.7" fill="var(--habit-icon-accent)" opacity=".7" />
      <circle cx="13.5" cy="44.8" r="1.3" fill="var(--habit-icon-accent)" opacity=".62" />

      {glyph || (
        <KawaiiIcon
          name={name}
          x="15"
          y="15"
          width="34"
          height="34"
          size="34"
          strokeWidth={1.7}
          decorative
        />
      )}
    </svg>
  );
}

export default HabitIcon;
