"use client";
import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const { variant = "primary", className = "", ...rest } = props;
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = variant === "primary"
    ? "bg-zinc-900 text-white hover:bg-zinc-800"
    : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
