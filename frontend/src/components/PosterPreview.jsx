import { useEffect, useState } from "react";

import { withBasePath } from "../lib/basePath";

export function PosterPreview({ alt, hint, src }) {
  const [isOpen, setIsOpen] = useState(false);
  const resolvedSrc = withBasePath(src);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!src) {
    return null;
  }

  return (
    <>
      <button
        aria-label={hint}
        className="poster-preview"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <img src={resolvedSrc} alt={alt} />
        <span className="poster-preview-hint">{hint}</span>
      </button>

      {isOpen ? (
        <div
          aria-label={alt}
          aria-modal="true"
          className="poster-lightbox"
          onClick={() => setIsOpen(false)}
          role="dialog"
        >
          <button
            aria-label="Close poster preview"
            className="poster-lightbox-close"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            ×
          </button>
          <div className="poster-lightbox-frame" onClick={(event) => event.stopPropagation()}>
            <img className="poster-lightbox-image" src={resolvedSrc} alt={alt} />
          </div>
        </div>
      ) : null}
    </>
  );
}
