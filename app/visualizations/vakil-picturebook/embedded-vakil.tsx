"use client";

import { useEffect, useRef, useState } from "react";

const resizeMessageType = "vakil-picturebook:resize";
const navigationMessageType = "vakil-picturebook:navigate-top";
const minimumFrameHeight = 760;

export function EmbeddedVakilPicturebook() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(minimumFrameHeight);

  useEffect(() => {
    const handleFrameMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow
      ) {
        return;
      }

      if (
        event.data?.type === resizeMessageType &&
        typeof event.data.height === "number"
      ) {
        setFrameHeight(Math.max(minimumFrameHeight, Math.ceil(event.data.height)));
        return;
      }

      if (event.data?.type === navigationMessageType) {
        frameRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      }
    };

    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, []);

  return (
    <iframe
      className="visualization-project-frame vakil-picturebook-frame"
      ref={frameRef}
      src="/visualizations/projects/vakil-picturebook/index.html?v=20260811-introduction-navigation-safari-v3"
      style={{ height: `${frameHeight}px` }}
      title="Vakil's Picturebook interactive visualization"
    />
  );
}
