"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/Input";

export function SearchBox({ placeholder, onChange }: { placeholder: string; onChange: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <div className="max-w-md">
      <Input
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          onChange(v);
        }}
        placeholder={placeholder}
      />
    </div>
  );
}
