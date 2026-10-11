"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const historyKey = "habiroBibliography";
const storageKey = "habiroBibliography:return";

export function BibliographyDisclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const details = detailsRef.current;
    if (!details) return;
    let frame = 0;
    let cancelled = false;

    // Remember the reading position within this tab; a fresh tab starts closed.
    const save = (open = details.open) => {
      const saved = { open, x: window.scrollX, y: window.scrollY };
      window.history.replaceState({ ...window.history.state, [historyKey]: saved }, "");
      // A full-document return may have its history state replaced by the router.
      try { window.sessionStorage.setItem(storageKey, JSON.stringify(saved)); } catch {}
    };
    const restore = () => {
      let saved;
      try { saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "null"); } catch {}
      saved ??= window.history.state?.[historyKey];
      if (!saved || typeof saved.open !== "boolean") return;
      setOpen(saved.open);
      details.open = saved.open;
      if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        window.scrollTo({ left: saved.x, top: saved.y, behavior: "instant" });
        // Fonts and the expanded content must settle before final positioning.
        void document.fonts.ready.then(() => {
          if (cancelled) return;
          frame = window.requestAnimationFrame(() => {
            details.open = saved.open;
            window.scrollTo({ left: saved.x, top: saved.y, behavior: "instant" });
          });
        });
      }
    };
    const onPageShow = () => {
      frame = window.requestAnimationFrame(restore);
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("a[href]")) save();
      if (event.target.closest("summary") === details.querySelector("summary")) {
        event.preventDefault();
        const nextOpen = !details.open;
        save(nextOpen);
        setOpen(nextOpen);
      }
    };

    // Restore before paint so the expanded height is available for scrolling.
    restore();
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", restore);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", restore);
    };
  }, []);

  return (
    <details ref={detailsRef} open={open} className="workshop-bibliography">
      {children}
    </details>
  );
}
