"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string } | null;
}

interface Props {
  targetType: string;
  targetId: string;
}

export default function AdminNotes({ targetType, targetId }: Props) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetchNotes();
  }, [targetType, targetId]);

  async function fetchNotes() {
    try {
      const res = await fetch(`/api/admin/notes?targetType=${targetType}&targetId=${targetId}`);
      const json = await res.json();
      if (json?.success) setNotes(json.data ?? []);
    } catch {}
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim(), targetType, targetId }),
      });
      const json = await res.json();
      if (json?.success) {
        setNotes((prev) => [json.data, ...prev]);
        setNewNote("");
        showToast("تمت إضافة الملاحظة");
      } else {
        showToast(json?.error ?? "فشل الإضافة", "error");
      }
    } catch {
      showToast("فشل الإضافة", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذه الملاحظة؟")) return;
    try {
      const res = await fetch(`/api/admin/notes?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json?.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        showToast("تم الحذف");
      }
    } catch {
      showToast("فشل الحذف", "error");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-primary">ملاحظات الإدارة</h3>

      {isAdmin && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="أضف ملاحظة..."
            className="flex-1 h-9 px-3 rounded-xl bg-surface-elevated border border-border text-sm placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-4 rounded-xl bg-accent text-surface text-sm font-medium hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? "..." : "إضافة"}
          </button>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="text-xs text-text-muted">لا توجد ملاحظات بعد.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="p-3 rounded-xl bg-surface-elevated border border-border">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-text-primary whitespace-pre-wrap flex-1">{note.content}</p>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-[10px] text-danger hover:text-danger/80 shrink-0"
                  >
                    حذف
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted">
                <span>{note.author?.name ?? note.author?.email ?? "مشرف"}</span>
                <span>{new Date(note.createdAt).toLocaleDateString("ar-SA")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
