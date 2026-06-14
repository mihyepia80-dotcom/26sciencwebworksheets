"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

function isClipboardShortcut(e: KeyboardEvent): boolean {
  if (!e.ctrlKey && !e.metaKey) return false;
  const key = e.key.toLowerCase();
  return key === "c" || key === "v" || key === "x";
}

function isTextDrag(e: DragEvent): boolean {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  return types.includes("text/plain") || types.includes("text/html");
}

export function StudentClipboardGuard() {
  const { role, loading } = useAuth();

  useEffect(() => {
    if (loading || role !== "student") return;

    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const blockShortcut = (e: KeyboardEvent) => {
      if (isClipboardShortcut(e)) e.preventDefault();
    };

    const blockTextDrop = (e: DragEvent) => {
      if (isTextDrag(e)) e.preventDefault();
    };

    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);
    document.addEventListener("paste", blockClipboard, true);
    document.addEventListener("keydown", blockShortcut, true);
    document.addEventListener("drop", blockTextDrop, true);

    return () => {
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
      document.removeEventListener("paste", blockClipboard, true);
      document.removeEventListener("keydown", blockShortcut, true);
      document.removeEventListener("drop", blockTextDrop, true);
    };
  }, [role, loading]);

  return null;
}
