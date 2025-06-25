"use client";
import { useEffect, useRef } from "react";

type Props = {
  onScan: (barcode: string) => void;
};

export default function ScannerInput({ onScan }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      onScan(e.currentTarget.value.trim());
      e.currentTarget.value = "";
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      onKeyDown={handleKeyPress}
      className="absolute top-0 left-0 opacity-0 pointer-events-none"
    />
  );
}
