const resizeMessageType = "vakil-picturebook:resize";

export function enableEmbeddedResize() {
  if (window.parent === window) return;

  const root = document.getElementById("root");
  if (!root) return;

  const publishHeight = () => {
    window.parent.postMessage(
      {
        type: resizeMessageType,
        height: Math.ceil(
          Math.max(root.scrollHeight, root.getBoundingClientRect().height),
        ),
      },
      window.location.origin,
    );
  };

  const resizeObserver = new ResizeObserver(publishHeight);
  resizeObserver.observe(root);

  window.addEventListener("resize", publishHeight);
  window.requestAnimationFrame(publishHeight);
}
