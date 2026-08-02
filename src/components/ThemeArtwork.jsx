const THEME_ARTWORK = {
  "garden-day": "/ui-icons/theme-sunlit-v1.webp",
  "garden-night": "/ui-icons/theme-moonlit-v1.webp",
  matcha: "/ui-icons/theme-matcha-v1.webp",
};

export function ThemeArtwork({ theme, className = "" }) {
  return (
    <img
      src={THEME_ARTWORK[theme] || THEME_ARTWORK["garden-day"]}
      className={`theme-artwork${className ? ` ${className}` : ""}`}
      width="56"
      height="56"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}

export default ThemeArtwork;
