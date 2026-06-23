"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Copy, Check, Heart, HeartBreak, ShareNetwork, ArrowsClockwise, Sparkle, DownloadSimple, CloudArrowUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import CompanySaveButton from "@/components/prompt/CompanySaveButton";
import { usePromptStore } from "@/store/promptStore";
import { useClipboard } from "@/hooks/useClipboard";
import { showToast } from "@/components/ui/Toast";
import type { GeneratedPrompt } from "@/lib/ai-generator";

interface PromptResultProps {
  prompt: GeneratedPrompt;
  onRegenerate?: () => void;
  onEnhance?: () => void;
  enhancing?: boolean;
  enhancerReady?: boolean;
}

export function PromptResult({ prompt, onRegenerate, onEnhance, enhancing, enhancerReady }: PromptResultProps) {
  const { copy, copied } = useClipboard();
  const { addToSaved, removeFromSaved, isSaved, user } = usePromptStore();
  const saved = isSaved(prompt.id);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handleDownloadMd = () => {
    const md = `# ${prompt.title}\n\n${prompt.content}\n\n---\n\n` + prompt.tips.map((t) => `- ${t}`).join("\n") + "\n";
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prompt.title.replace(/[\/\?<>\\:*|"]/g, "_")}.md`;
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
          title: prompt.title,
          content: prompt.content,
          tips: prompt.tips,
          categoryId: prompt.categoryId,
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

  const handleCopy = async () => {
    await copy(prompt.content);
    showToast("تم النسخ!");
  };

  const handleSave = () => {
    if (saved) {
      removeFromSaved(prompt.id);
      showToast("تمت الإزالة", "info");
    } else {
      addToSaved(prompt);
      showToast("تم الحفظ!");
    }
  };

  const handleShare = async () => {
    const text = `${prompt.title}\n\n${prompt.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      await copy(text);
      showToast("تم نسخ نص المشاركة!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--color-accent-soft)" }}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-accent/[0.04] border-b" style={{ borderColor: "var(--color-accent-soft)" }}>
        <span className="text-xs font-medium text-accent">البرومت المولد</span>
      </div>

      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-text-primary mb-2.5">{prompt.title}</h3>

        <div className="bg-surface/50 rounded-xl p-3 border border-border/40 mb-3 font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
          {prompt.content}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-medium">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 transition-colors",
              copied ? "text-accent" : "text-text-muted hover:text-text-primary"
            )}
          >
            {copied ? <Check weight="bold" className="size-3" /> : <Copy weight="bold" className="size-3" />}
            {copied ? "تم النسخ" : "نسخ"}
          </button>

          <CompanySaveButton prompt={prompt} />

          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <ShareNetwork weight="bold" className="size-3" />
            مشاركة
          </button>

          <button
            onClick={handleDownloadMd}
            className="flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors"
          >
            <DownloadSimple weight="bold" className="size-3" />
            .md تحميل
          </button>

          {user && !published && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors"
            >
              <CloudArrowUp weight={publishing ? "fill" : "bold"} className={cn("size-3", publishing && "animate-pulse")} />
              {publishing ? "جارٍ النشر..." : "نشر للمجتمع"}
            </button>
          )}

          {enhancerReady && onEnhance && (
            <button
              onClick={onEnhance}
              disabled={enhancing}
              className={cn(
                "flex items-center gap-1 transition-colors",
                enhancing ? "text-accent/50" : "text-accent-secondary hover:text-accent-secondary/80"
              )}
            >
              <Sparkle weight={enhancing ? "fill" : "bold"} className={cn("size-3", enhancing && "animate-pulse")} />
              {enhancing ? "جارٍ التحسين..." : "تحسين بالذكاء المحلي"}
            </button>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-accent hover:text-accent/80 transition-colors mr-auto"
            >
              <ArrowsClockwise weight="bold" className="size-3" />
              توليد مجدداً
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
