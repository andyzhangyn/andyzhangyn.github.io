"use client";

import { useEffect, useRef, useState } from "react";

const resizeMessageType = "domino-forest:resize";
const minimumFrameHeight = 960;

export function EmbeddedDominoForest() {
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
      className="visualization-project-frame domino-forest-frame"
      ref={frameRef}
      src="/visualizations/projects/domino-cyclic-matrix/index.html"
      style={{ height: `${frameHeight}px` }}
      title="Domino Forest interactive visualization"
    />
  );
}
