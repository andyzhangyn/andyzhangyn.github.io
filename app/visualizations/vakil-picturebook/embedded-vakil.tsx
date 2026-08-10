"use client";

import { useEffect, useRef, useState } from "react";

const resizeMessageType = "vakil-picturebook:resize";
const minimumFrameHeight = 760;

export function EmbeddedVakilPicturebook() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(minimumFrameHeight);

  useEffect(() => {
    const updateHeight = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.type !== resizeMessageType ||
        typeof event.data.height !== "number"
      ) {
        return;
      }

      setFrameHeight(Math.max(minimumFrameHeight, Math.ceil(event.data.height)));
    };

    window.addEventListener("message", updateHeight);
    return () => window.removeEventListener("message", updateHeight);
  }, []);

  return (
    <iframe
      className="visualization-project-frame vakil-picturebook-frame"
      ref={frameRef}
      src="/visualizations/projects/vakil-picturebook/index.html?v=20260807-responsive-gallery-v1"
      style={{ height: `${frameHeight}px` }}
      title="Vakil's Picturebook interactive visualization"
    />
  );
}
