const resizeMessageType = "domino-visualization:resize";

export function enableEmbeddedResize() {
  if (window.parent === window) return;

  document.documentElement.classList.add("is-embedded");

  const connect = () => {
    const shell = document.querySelector<HTMLElement>(".page-shell");
    if (!shell) {
      window.requestAnimationFrame(connect);
      return;
    }

    const publishHeight = () => {
      const bodyStyle = window.getComputedStyle(document.body);
      const verticalPadding = Number.parseFloat(bodyStyle.paddingTop)
        + Number.parseFloat(bodyStyle.paddingBottom);

      window.parent.postMessage(
        {
          type: resizeMessageType,
          height: shell.getBoundingClientRect().height + verticalPadding,
        },
        window.location.origin,
      );
    };

    const resizeObserver = new ResizeObserver(publishHeight);
    resizeObserver.observe(shell);
    window.addEventListener("resize", publishHeight);
    publishHeight();
  };

  window.requestAnimationFrame(connect);
}
