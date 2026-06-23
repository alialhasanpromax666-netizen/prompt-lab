"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, ShareNetwork, DownloadSimple, HeartBreak, BookmarkSimple, CloudArrowUp } from "@phosphor-icons/react";
import { PromptResult } from "./PromptResult";
import { cn } from "@/lib/utils";
import CompanySaveButton from "@/components/prompt/CompanySaveButton";
import { useClipboard } from "@/hooks/useClipboard";
import { usePromptStore } from "@/store/promptStore";
import { showToast } from "@/components/ui/Toast";

interface ModalPrompt {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  companyId?: string | null;
  level?: string;
  tags?: string[] | string;
  author?: { id: string; name: string; image?: string } | null;
  likes?: number;
}

interface PromptDetailModalProps {
  prompt: ModalPrompt | null;
  onClose: () => void;
}

export function PromptDetailModal({ prompt, onClose }: PromptDetailModalProps) {
  const { copy, copied } = useClipboard();
  const { addToSaved, removeFromSaved, isSaved, user } = usePromptStore();

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any | null>(null);

  if (!prompt) return null;
  const data = prompt;
  const saved = isSaved(data.id);
  const tags: string[] = typeof data.tags === "string" ? JSON.parse(data.tags) : data.tags ?? [];

  const handleCopy = async () => {
    await copy(data.content);
    showToast("تم النسخ!");
  };

  const handleSave = () => {
    if (saved) {
      removeFromSaved(data.id);
      showToast("تمت الإزالة", "info");
    } else {
      addToSaved({
        id: data.id,
        title: data.title,
        content: data.content,
        tips: [],
        categoryId: data.categoryId,
        createdAt: new Date(),
      });
      showToast("تم الحفظ!");
    }
  };

  const handleShare = async () => {
    const text = `${data.title}\n\n${data.content}`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await copy(text);
      showToast("تم نسخ نص المشاركة!");
    }
  };

  const handleDownloadMd = () => {
    const md = `# ${data.title}\n\n${data.content}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title.replace(/[\/\?<>\\:*|"]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("تم التحميل!");
  };

  const handlePublish = async () => {
    if (!user) { showToast("سجّل الدخول أولاً", "error"); return; }
    setPublishing(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          tips: tags,
          categoryId: data.categoryId,
          isPublic: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      setPublished(true);
      showToast("تم النشر إلى المجتمع!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "فشل النشر", "error");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border-light bg-surface-secondary shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border-light shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-text-primary leading-snug line-clamp-1">{data.title}</h2>
              {data.author && (
                <p className="text-[11px] text-text-muted mt-0.5">بواسطة {data.author.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors shrink-0"
            >
              <X weight="bold" className="size-4" />
            </button>
          </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-surface rounded-xl p-4 border border-border-light">
                <pre className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono whitespace-pre-wrap rtl:text-right">
                  {data.content}
                </pre>
              </div>

              {genResult && (
                <div className="mt-4">
                  <PromptResult prompt={genResult} />
                </div>
              )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.map((tag) => (
                  <span key={tag} className="text-[10px] text-text-muted bg-surface-elevated px-2 py-0.5 rounded-md">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-border-light shrink-0 bg-surface/50">
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                copied ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
              )}
            >
              {copied ? <Check weight="bold" className="size-3.5" /> : <Copy weight="bold" className="size-3.5" />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>

            <CompanySaveButton prompt={{ id: data.id, title: data.title }} />

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all"
            >
              <ShareNetwork weight="bold" className="size-3.5" />
              مشاركة
            </button>

            <button
              onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all"
            >
              <DownloadSimple weight="bold" className="size-3.5" />
              .md تحميل
            </button>

            {user && !published && !data.author && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:text-accent/80 hover:bg-accent/5 transition-all"
              >
                <CloudArrowUp weight={publishing ? "fill" : "bold"} className={cn("size-3.5", publishing && "animate-pulse")} />
                {publishing ? "جارٍ النشر..." : "نشر للمجتمع"}
              </button>
            )}

            {user && (
              <button
                onClick={async () => {
                  setGenLoading(true);
                  try {
                    const res = await fetch('/api/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        categoryId: data.categoryId,
                        categoryName: '',
                        goal: data.title,
                        keywords: [],
                        style: 'detailed',
                        audience: undefined,
                        companyId: (data as any).companyId ?? undefined,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok || !json.success) throw new Error(json.error || 'فشل التوليد');
                    setGenResult(json.data);
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'فشل التوليد', 'error');
                  } finally {
                    setGenLoading(false);
                  }
                }}
                disabled={genLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:text-accent/80 hover:bg-accent/5 transition-all"
              >
                {genLoading ? 'جارٍ التوليد...' : 'استخدم للتوليد'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
