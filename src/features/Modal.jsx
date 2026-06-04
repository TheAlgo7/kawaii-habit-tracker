import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Accessible dialog shell: focus moves in on open, is trapped while open,
// Escape and backdrop-click close it, and focus is restored to the trigger on
// close. Used by every modal so a11y is correct in one place.
export function Modal({ title, onClose, children, className = "entry-modal", labelId }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    restoreRef.current = document.activeElement;
    const node = panelRef.current;
    const items = () =>
      [...node.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled && el.offsetParent !== null);

    (items()[0] || node).focus();

    function onKey(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = items();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      const restore = restoreRef.current;
      if (restore && typeof restore.focus === "function") restore.focus();
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={className}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelId ? undefined : title}
        aria-labelledby={labelId}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
