import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function getSnapshot() {
  return window.matchMedia(mediaQuery).matches;
}

function getServerSnapshot() {
  return false;
}

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(mediaQuery);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
