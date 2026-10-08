"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export function OptionMenu({
  label,
  value,
  options,
  onChange,
  widthClass = "w-44",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  widthClass?: string;
}) {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0, width: 176 });

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = rect.width;
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setBox({ top: rect.bottom + 6, left: Math.max(8, left), width });
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest("[data-option-menu]")) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function close() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={widthClass}>
      <span id={labelId} className="mb-1 block text-xs font-medium text-[#614f38]">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => {
          place();
          setOpen((valueOpen) => !valueOpen);
        }}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-[#d1b996] bg-[#f2efe9] pl-3 pr-2 text-left text-sm text-[#281a0d]"
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown className="mr-1 size-4 shrink-0 text-[#614f38]" aria-hidden />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <ul
              data-option-menu
              role="listbox"
              aria-labelledby={labelId}
              style={{
                position: "fixed",
                top: box.top,
                left: box.left,
                width: box.width,
                zIndex: 70,
              }}
              className="max-h-64 overflow-auto rounded-xl border border-[#d1b996] bg-[#f2efe9] py-1 shadow-lg"
            >
              {options.map((option) => {
                const selected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm text-[#281a0d]"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {selected ? (
                        <Check className="size-4 shrink-0 text-[#416c6f]" aria-hidden />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
