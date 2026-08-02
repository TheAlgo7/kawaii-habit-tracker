import { useId } from "react";

// A deliberately small, rounded drawing vocabulary keeps navigation, actions,
// and habit metadata feeling like parts of the same illustrated world.
const ICON_SHAPES = {
  today: (
    <>
      <path d="M4.8 9.2c2.1-3.3 5.5-5.1 9.1-4.7 2.5.3 4.4 1.4 5.5 3.2" />
      <path d="M5.2 14.1c1.7 3.5 5.5 5.7 9.4 5.1 2.3-.4 4-1.5 5-3.2" />
      <path d="M8.2 12.2c.3-2.3 2.2-4 4.5-4s4.3 1.8 4.5 4.2" />
      <path d="M12.7 2.6v2M3.7 5.8l1.6 1.1M20.8 6.3l-1.7 1" />
      <circle cx="12.7" cy="12.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  rhythm: (
    <>
      <path d="M3.4 15.4c2.2 0 2.2-6.8 4.4-6.8s2.2 8.9 4.4 8.9 2.2-11.6 4.5-11.6c1.5 0 2 3.8 3.9 3.8" />
      <path d="M4.2 20.1h15.6" />
      <circle cx="7.8" cy="8.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12.2" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16.7" cy="5.9" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  garden: (
    <>
      <path d="M12 20.4v-8.9" />
      <path d="M12 15.2c-3.7-.2-5.9-2-6.2-5.4 3.4-.5 5.8 1.4 6.2 5.4Z" />
      <path d="M12 12.7c.4-4.4 2.8-6.9 6.7-7.1.4 3.9-2 6.6-6.7 7.1Z" />
      <path d="M4.4 20.4c2.4-2 4.9-2.1 7.6 0 2.6-2.1 5.2-2 7.6 0" />
    </>
  ),
  neko: (
    <>
      <path d="m6.5 8.7-.3-4.2 4 2.2c1.3-.4 2.5-.4 3.8 0l3.9-2.2-.3 4.2c1.4 1.4 2.1 3.1 2.1 5 0 4.1-3.4 6.7-7.6 6.7s-7.7-2.6-7.7-6.7c0-2 .7-3.6 2.1-5Z" />
      <path d="M8.1 12.6h.1M15.9 12.6h.1" />
      <path d="m10.7 15 1.3.8 1.3-.8M12 15.8v1.4" />
      <path d="M8.7 16.4c-2.4-.2-4.1.1-5.3.7M15.3 16.4c2.4-.2 4.1.1 5.3.7" />
    </>
  ),
  settings: (
    <>
      <path d="M9.7 3.4h4.6l.6 2.2c.5.2 1 .5 1.5.9l2.2-.6 2.3 4-1.6 1.6v1.8l1.6 1.6-2.3 4-2.2-.6c-.5.4-1 .7-1.5.9l-.6 2.2H9.7l-.6-2.2c-.5-.2-1-.5-1.5-.9l-2.2.6-2.3-4 1.6-1.6v-1.8L3.1 9.9l2.3-4 2.2.6c.5-.4 1-.7 1.5-.9l.6-2.2Z" />
      <circle cx="12" cy="12.4" r="3" />
    </>
  ),
  plus: <path d="M12 4.7v14.6M4.7 12h14.6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="m4.4 12.5 4.4 4.3L19.7 6.9" />,
  circle: <circle cx="12" cy="12" r="8.1" />,
  water: (
    <>
      <path d="M12.1 3.2S6.4 9.7 6.4 14.4a5.7 5.7 0 0 0 11.4 0c0-4.7-5.7-11.2-5.7-11.2Z" />
      <path d="M9 14.8c.2 1.5 1.1 2.4 2.7 2.7" />
    </>
  ),
  book: (
    <>
      <path d="M4.1 5.2h5.1c1.5 0 2.8.8 2.8 2.2v12c0-1.3-1.3-2.2-2.8-2.2H4.1v-12Z" />
      <path d="M19.9 5.2h-5.1c-1.5 0-2.8.8-2.8 2.2v12c0-1.3 1.3-2.2 2.8-2.2h5.1v-12Z" />
      <path d="M7 9h2M15 9h2M7 12h2M15 12h2" />
    </>
  ),
  stretch: (
    <>
      <circle cx="12.1" cy="5.3" r="2" />
      <path d="M12 8.3v5.8m0-4.1-5-2.2M12 10l5.2-2.5M12 14.1l-4 5.4M12 14.1l4.7 5" />
    </>
  ),
  moon: (
    <>
      <path d="M19.7 15.4A8.5 8.5 0 0 1 8.6 4.2a8.3 8.3 0 1 0 11.1 11.2Z" />
      <path d="m17.7 4.5.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4 7 7M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 4.1C11.6 4.1 5.7 8.5 5.7 14.2c0 3.3 2.3 5.7 5.7 5.7 5.7 0 8.6-6.1 8.6-15.8Z" />
      <path d="M4 21c3.4-5.4 7.3-8.8 12.2-11.4" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20.1 4.7 13a5.1 5.1 0 0 1 7.3-7.1A5.1 5.1 0 0 1 19.3 13L12 20.1Z" />
      <path d="M8.2 8.8c-.8.4-1.2 1-1.2 1.9" />
    </>
  ),
  rest: (
    <>
      <path d="M5 16.8c3.4-1.1 4.1-3.7 4.4-7.7.3 4 1 6.6 4.4 7.7-3.4 1.1-4.1 2.4-4.4 4.1-.3-1.7-1-3-4.4-4.1Z" />
      <path d="M13.8 8.5c2.5-.8 3-2.7 3.2-5.5.2 2.8.7 4.7 3.2 5.5-2.5.8-3 1.8-3.2 3-.2-1.2-.7-2.2-3.2-3Z" />
    </>
  ),
  note: (
    <>
      <path d="M5 4.1h14v15.8H5z" />
      <path d="M8.1 8h7.8M8.1 11.5h7.8M8.1 15h4.9" />
    </>
  ),
  edit: (
    <>
      <path d="m14.5 5.1 4.4 4.4L9 19.4l-5.1.8.8-5.1 9.8-10Z" />
      <path d="m12.3 7.3 4.4 4.4M4.7 15.1 9 19.4" />
    </>
  ),
  archive: (
    <>
      <path d="M4.2 8.3h15.6v11.1H4.2zM3.2 4.6h17.6v3.7H3.2z" />
      <path d="M9.3 12.1h5.4" />
    </>
  ),
  trash: (
    <>
      <path d="M6.2 7.1h11.6l-.8 13H7l-.8-13ZM4.3 7.1h15.4M9 7.1V4.4h6v2.7" />
      <path d="M9.6 10.8v5.8M14.4 10.8v5.8" />
    </>
  ),
  task: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m7.8 12.2 2.7 2.7 5.9-6" />
    </>
  ),
  challenge: (
    <>
      <path d="M8 3.7h8v3.4c0 3.5-1.4 5.7-4 6.6-2.6-.9-4-3.1-4-6.6V3.7Z" />
      <path d="M8 5.3H4.2c0 3.4 1.5 5.2 4.7 5.5M16 5.3h3.8c0 3.4-1.5 5.2-4.7 5.5M12 13.7v3.1M8.6 20.3h6.8M10 16.8h4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11.2m-4-3.9 4 4 4-4" />
      <path d="M4.8 16.4v3.2h14.4v-3.2" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.1V3.9m-4 4 4-4 4 4" />
      <path d="M4.8 16.4v3.2h14.4v-3.2" />
    </>
  ),
  close: <path d="m5.4 5.4 13.2 13.2M18.6 5.4 5.4 18.6" />,
  back: <path d="m14.8 4.8-7.2 7.2 7.2 7.2" />,
  arrowRight: <path d="M4.3 12h15.2m-6.1-6.1 6.1 6.1-6.1 6.1" />,
  send: (
    <>
      <path d="m3.4 4.4 17.2 7.4-17.2 7.8 2.2-6.2 8.9-1.6-8.9-1.5-2.2-5.9Z" />
      <path d="M5.6 10.3v3.1" />
    </>
  ),
  lock: (
    <>
      <rect x="4.7" y="10" width="14.6" height="10.5" rx="3" />
      <path d="M8.1 10V7.2a3.9 3.9 0 0 1 7.8 0V10M12 14.3v2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.8" y="5.5" width="16.4" height="15" rx="3" />
      <path d="M7.8 3.5v4M16.2 3.5v4M3.8 9.8h16.4" />
      <path d="m8.1 15 2.2 2.1 4-4.3" />
    </>
  ),
  breathe: (
    <>
      <path d="M3.3 9.1h10.5c2.6 0 2.7-3.8.3-4.1-1.2-.2-2.1.4-2.5 1.3" />
      <path d="M3.3 13.1h15.1c2.9 0 3.1 4.3.3 4.7-1.4.2-2.4-.5-2.8-1.6" />
      <path d="M3.3 17h7.5" />
    </>
  ),
  journal: (
    <>
      <path d="M5 3.7h12.2c1 0 1.8.8 1.8 1.8v14.8H6.8C5.8 20.3 5 19.5 5 18.5V3.7Z" />
      <path d="M8.1 3.7v16.6M11 8h5M11 11.4h5M11 14.8h3" />
    </>
  ),
  home: (
    <>
      <path d="m3.5 11.2 8.5-7 8.5 7" />
      <path d="M5.4 9.7v10.1h13.2V9.7M9.5 19.8v-6h5v6" />
      <path d="M17.3 6.8V4.3h2v4.1" />
    </>
  ),
  sparkles: (
    <>
      <path d="M3.6 9.8c3.8-1.1 5-2.4 6.1-6.2 1.1 3.8 2.4 5.1 6.2 6.2-3.8 1.1-5.1 2.4-6.2 6.2-1.1-3.8-2.3-5.1-6.1-6.2Z" />
      <path d="M14.2 17.9c2.5-.7 3.3-1.6 4-4.1.7 2.5 1.6 3.4 4.1 4.1-2.5.7-3.4 1.5-4.1 4-.7-2.5-1.5-3.3-4-4Z" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8c-3.7-2.1-3.7-6 0-6.3 3.7.3 3.7 4.2 0 6.3ZM14.2 12c2.1-3.7 6-3.7 6.3 0-.3 3.7-4.2 3.7-6.3 0ZM12 14.2c3.7 2.1 3.7 6 0 6.3-3.7-.3-3.7-4.2 0-6.3ZM9.8 12c-2.1 3.7-6 3.7-6.3 0 .3-3.7 4.2-3.7 6.3 0Z" />
    </>
  ),
  seedling: (
    <>
      <path d="M12 20.5v-9.2" />
      <path d="M11.8 14c-4.1 0-6.5-2.1-6.6-5.9 3.8-.2 6.3 1.9 6.6 5.9ZM12.2 11.9c.2-4.4 2.5-6.7 6.6-6.8.1 4-2.2 6.4-6.6 6.8Z" />
      <path d="M6 20.5h12" />
    </>
  ),
  lamp: (
    <>
      <path d="M8.7 3.8h6.6l2.6 8.1H6.1l2.6-8.1ZM12 11.9v7.8M8.7 20.2h6.6" />
      <path d="M8.1 14.5h7.8" />
    </>
  ),
  plant: (
    <>
      <path d="M7.2 12.6h9.6l-1.1 7.7H8.3l-1.1-7.7Z" />
      <path d="M12 12.6V7.2M12 9.1C8.5 9 6.7 7.2 6.6 4.1c3.3-.1 5.1 1.6 5.4 5ZM12 10.7c.1-3.8 2-5.8 5.5-6 .1 3.5-1.8 5.5-5.5 6Z" />
    </>
  ),
  music: (
    <>
      <path d="M9.2 17.6V6.7l9-1.8v10.8" />
      <path d="M9.2 9.8 18.2 8" />
      <ellipse cx="6.7" cy="18" rx="2.5" ry="1.9" />
      <ellipse cx="15.7" cy="16.1" rx="2.5" ry="1.9" />
    </>
  ),
  butterfly: (
    <>
      <path d="M11.3 11.2C8.4 4.5 3.5 4.1 3.4 8.3c-.1 3.2 3.5 5.2 7.9 4.1" />
      <path d="M12.7 11.2c2.9-6.7 7.8-7.1 7.9-2.9.1 3.2-3.5 5.2-7.9 4.1" />
      <path d="M11.3 13.2c-4.3-.8-6.6 1.3-5 4 1.5 2.4 4.3.9 5.5-2.3M12.7 13.2c4.3-.8 6.6 1.3 5 4-1.5 2.4-4.3.9-5.5-2.3" />
      <path d="M12 10.5v6.8M10.6 8.5 9.4 6.7M13.4 8.5l1.2-1.8" />
    </>
  ),
  tea: (
    <>
      <path d="M5 9.2h12.5v5.3c0 3.4-2.3 5.6-6.2 5.6S5 17.9 5 14.5V9.2Z" />
      <path d="M17.5 11h1.1a2.5 2.5 0 0 1 0 5h-1.7M8.4 6.9c-1.5-1.2.8-2.1-.2-3.4M12.3 6.9c-1.5-1.2.8-2.1-.2-3.4" />
      <path d="M7 20.1h9" />
    </>
  ),
  tree: (
    <>
      <path d="M10.3 19.8h3.4v-5.6" />
      <path d="M12 16.1c-4.5 0-7.7-2.4-7.7-6.1 0-2.4 1.7-4.2 4-4.5C9.2 3.6 11 2.6 13 3.2c1.3.4 2.2 1.3 2.7 2.5 2.3.2 4 2.1 4 4.5 0 3.5-3.1 5.9-7.7 5.9Z" />
      <path d="M12 14.2 9.3 11M12 12.8l2.8-3" />
    </>
  ),
};

function readableName(name) {
  return String(name || "icon")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase();
}

/**
 * Rounded, hand-inked interface icon.
 *
 * Icons are decorative by default. Pass `decorative={false}` with `label` or
 * `title` when the icon itself carries meaning. Color always inherits from the
 * surrounding text through `currentColor`.
 */
export function KawaiiIcon({
  name,
  size = 24,
  strokeWidth = 1.8,
  decorative = true,
  label,
  title,
  className,
  ...svgProps
}) {
  const titleId = useId();
  const isDecorative = decorative && !label && !title;
  const accessibleName = title || label || readableName(name);

  return (
    <svg
      {...svgProps}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      focusable="false"
      aria-hidden={isDecorative ? true : undefined}
      aria-labelledby={!isDecorative && title ? titleId : undefined}
      aria-label={!isDecorative && !title ? accessibleName : undefined}
      role={isDecorative ? undefined : "img"}
    >
      {!isDecorative && title ? <title id={titleId}>{title}</title> : null}
      {ICON_SHAPES[name] || ICON_SHAPES.circle}
    </svg>
  );
}

export default KawaiiIcon;
