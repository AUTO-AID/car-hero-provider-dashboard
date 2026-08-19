"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onStoreChange: () => void) => {
  queueMicrotask(onStoreChange);
  return () => {};
};

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useClientReady() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

