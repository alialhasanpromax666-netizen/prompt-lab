"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Copy, Check, Heart, HeartBreak, ThumbsUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import CompanySaveButton from "@/components/prompt/CompanySaveButton";

import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { usePromptStore } from "@/store/promptStore";
import { useClipboard } from "@/hooks/useClipboard";
import { showToast } from "@/components/ui/Toast";
interface PromptCardData {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  level: string;
  tags: string[] | string;
  usageCount: number;
  likes?: number;
  author?: { id: string; name: string; image?: string } | null;
}

interface PromptCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prompt: any;
  index?: number;
  onLike?: (id: string) => void;
  isLiked?: boolean;
  onView?: (prompt: any) => void;
}

export function PromptCard({ prompt, index = 0, onLike, isLiked, onView }: PromptCardProps) {
  const tags: string[] = typeof prompt.tags === "string" ? JSON.parse(prompt.tags) : prompt.tags;
  const { copy, copied } = useClipboard();
  const { addToSaved, removeFromSaved, isSaved } = usePromptStore();
  const [saved, setSaved] = useState(isSaved(prompt.id));

  const levelLabel = EXPERIENCE_LEVELS.find((l) => l.id === prompt.level)?.label ?? prompt.level;

  const handleCopy = async () => {
    await copy(prompt.content);
    showToast("تم النسخ!");
  };

  const handleSave = () => {
    if (saved) {
      removeFromSaved(prompt.id);
      setSaved(false);
      showToast("تمت الإزالة", "info");
    } else {
      addToSaved({
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        tips: [],
        categoryId: prompt.categoryId,
        createdAt: new Date(),
      });
      setSaved(true);
      showToast("تم الحفظ!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
      className="group rounded-xl border border-border-light bg-surface-secondary overflow-hidden transition-all duration-300 hover:border-accent/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
    >
      <div className="p-3.5">
        {prompt.author && (
          <div className="flex items-center gap-2 mb-2.5">
            <div className="size-6 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
              {prompt.author.name?.charAt(0) ?? "?"}
            </div>
            <span className="text-[11px] text-text-secondary font-medium">{prompt.author.name}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {onView ? (
              <button onClick={() => onView(prompt)} className="block w-full text-left">
                <h3 className="text-sm font-semibold text-text-primary leading-snug mb-1.5 hover:text-accent transition-colors">
                  {prompt.title}
                </h3>
              </button>
            ) : (
              <Link href={`/prompt/${prompt.id}`} className="block">
                <h3 className="text-sm font-semibold text-text-primary leading-snug mb-1.5 hover:text-accent transition-colors">
                  {prompt.title}
                </h3>
              </Link>
            )}
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <span className="text-[11px] text-accent font-medium">{levelLabel}</span>
              {tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[11px] text-text-muted">#{tag}</span>
              ))}
            </div>
          </div>
          <CompanySaveButton prompt={{ id: prompt.id, title: prompt.title }} />
        </div>

        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3 font-mono">
          {prompt.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-text-muted">{prompt.usageCount}</div>
            {onLike && (
              <button
                onClick={() => onLike(prompt.id)}
                className={cn(
                  "flex items-center gap-1 text-[11px] transition-colors",
                  isLiked ? "text-accent" : "text-text-muted hover:text-text-secondary"
                )}
              >
                <ThumbsUp weight={isLiked ? "fill" : "bold"} className="size-3" />
                <span>{isLiked ? (prompt.likes ?? 0) + 1 : prompt.likes ?? 0}</span>
              </button>
            )}
          </div>
          <button
            onClick={handleCopy}
            className={cn(
              "text-[11px] font-medium transition-colors",
              copied ? "text-accent" : "text-text-muted hover:text-text-primary"
            )}
          >
            {copied ? <Check weight="bold" className="size-3" /> : <Copy weight="bold" className="size-3" />}
            {copied ? "تم" : "نسخ"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
