"use client";

import { useEffect, useRef, useState } from "react";

const resizeMessageType = "domino-visualization:resize";
const minimumFrameHeight = 720;

export function EmbeddedDomino() {
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
      className="visualization-project-frame domino-frame"
      ref={frameRef}
      src="/visualizations/domino/index.html"
      style={{ height: `${frameHeight}px` }}
      title="What is a domino? interactive visualization"
    />
  );
}
