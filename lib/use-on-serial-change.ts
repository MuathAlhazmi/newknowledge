"use client";

import { useEffect, useRef } from "react";

/** Runs `effect` whenever `serial` changes (including first paint). */
export function useOnSerialChange(serial: string, effect: () => void) {
  const prev = useRef<string | undefined>(undefined);
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  });

  useEffect(() => {
    if (serial === prev.current) return;
    prev.current = serial;
    effectRef.current();
  }, [serial]);
}
