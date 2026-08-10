"use strict";

const resizeMessageType = "domino-forest:resize";

function postDocumentHeight() {
  const height = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  );
  window.parent.postMessage({ type: resizeMessageType, height }, window.location.origin);
}

const resizeObserver = new ResizeObserver(postDocumentHeight);
resizeObserver.observe(document.documentElement);

const mutationObserver = new MutationObserver(postDocumentHeight);
mutationObserver.observe(document.documentElement, {
  attributes: true,
  childList: true,
  subtree: true,
});

window.addEventListener("load", postDocumentHeight);
window.addEventListener("resize", postDocumentHeight);
postDocumentHeight();
