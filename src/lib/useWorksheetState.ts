"use client";

import { useCallback, useState } from "react";
import type { Answers } from "./types";

export function useWorksheetState(initial: Answers = {}) {
  const [values, setValues] = useState<Answers>(initial);

  const onChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setAll = useCallback((next: Answers) => {
    setValues(next);
  }, []);

  return { values, onChange, setAll };
}
