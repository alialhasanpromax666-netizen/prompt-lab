"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { usePromptStore } from "@/store/promptStore";

export default function CompanySaveButton({ prompt }: { prompt: { id: string; title: string } }) {
  const { addToSaved, removeFromSaved, isSaved, user } = usePromptStore();
  const saved = isSaved(prompt.id);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/user/company').then((r) => r.json()).then((j) => {
      if (j?.success) {
        const list = Array.isArray(j.data) ? j.data : [];
        setCompanies(list.map((c: any) => ({ id: c.id, name: c.name })));
        if (list.length === 1) setSelected(list[0].id);
      }
    }).catch(() => {});
  }, [user]);

  const handleSave = () => {
    if (saved) {
      removeFromSaved(prompt.id);
    } else {
      addToSaved(prompt as any, selected ?? null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleSave} variant={saved ? "danger" : "secondary"}>
        {saved ? "إزالة" : "حفظ"}
      </Button>
      {companies.length > 0 && (
        <select value={selected ?? ""} onChange={(e) => setSelected(e.target.value || null)} className="h-9 px-3 rounded-xl bg-surface-elevated border border-border text-sm">
          <option value="">خاص بي</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
