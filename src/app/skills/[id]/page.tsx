"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { useClipboard } from "@/hooks/useClipboard";
import { usePromptStore } from "@/store/promptStore";
import { cn } from "@/lib/utils";
import AdminNotes from "@/components/admin/AdminNotes";
import { ArrowRight, Copy, Check, Lightning, Share, BookmarkSimple, HeartBreak, Sparkle, FloppyDisk } from "@phosphor-icons/react";

interface SkillDetail {
  id: string;
  title: string;
  description: string;
  systemPrompt: string;
  variables: string;
  exampleInput: string | null;
  tags: string;
  usageCount: number;
  categoryId: string;
  author: { id: string; name: string; image?: string } | null;
  _count: { likes: number; savedBy: number };
  createdAt: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function SkillDetailPage({ params }: Props) {
  const { id } = use(params);
  const { copy, copied } = useClipboard();
  const { addToSaved, removeFromSaved, isSaved, user } = usePromptStore();

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [useMode, setUseMode] = useState(false);
  const [filledVars, setFilledVars] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const res = await fetch(`/api/skills/${id}`);
        if (!res.ok) throw new Error("not found");
        const json = await res.json();
        const data = json.success ? json.data : json;
        setSkill(data);
        setSaved(isSaved(data.id));
      } catch {
        setSkill(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSkill();
  }, [id, isSaved]);

  if (loading) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-surface-elevated" />
            <div className="h-8 w-3/4 rounded bg-surface-elevated" />
            <div className="h-64 rounded-2xl bg-surface-elevated" />
          </div>
        </div>
      </main>
    );
  }

  if (!skill) notFound();

  const tags: string[] = JSON.parse(skill.tags || "[]");
  const variables: string[] = JSON.parse(skill.variables || "[]");

  const handleCopy = async () => {
    await copy(skill.systemPrompt);
    showToast("تم نسخ التعليمات!");
  };

  const handleSave = () => {
    if (saved) {
      removeFromSaved(skill.id);
      setSaved(false);
      showToast("تمت الإزالة", "info");
    } else {
      addToSaved({
        id: skill.id,
        title: skill.title,
        content: skill.systemPrompt,
        tips: [],
        categoryId: skill.categoryId,
        createdAt: new Date(),
      });
      setSaved(true);
      showToast("تم الحفظ!");
    }
  };

  const handleShare = async () => {
    const text = `${skill.title}\n\n${skill.description}\n\n${skill.systemPrompt}`;
    if (navigator.share) {
      try { await navigator.share({ title: skill.title, text, url: window.location.href }); } catch {}
    } else {
      await copy(window.location.href);
      showToast("تم نسخ الرابط!");
    }
  };

  const handleUse = () => {
    const initial: Record<string, string> = {};
    variables.forEach((v) => { initial[v] = ""; });
    setFilledVars(initial);
    setUseMode(true);
  };

  const handleGeneratePrompt = async () => {
    const missing = variables.filter((v) => !filledVars[v]?.trim());
    if (missing.length > 0) {
      showToast(`املأ المتغيرات: ${missing.join(", ")}`, "info");
      return;
    }
    let result = skill.systemPrompt;
    Object.entries(filledVars).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
    });
    await copy(result);
    showToast("تم تجهيز البرومت ونسخه!");
    setUseMode(false);
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/skills"
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors mb-4"
          >
            <ArrowRight weight="bold" className="size-3" />
            المهارات
          </Link>

          <div className="rounded-2xl border border-border-light bg-surface-secondary p-5 sm:p-6 mb-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightning weight="fill" className="size-4 text-accent" />
                  <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{skill.title}</h1>
                </div>
                {skill.author && (
                  <p className="text-xs text-text-muted mb-2">بواسطة {skill.author.name}</p>
                )}
                <p className="text-sm text-text-secondary">{skill.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-text-muted bg-surface-elevated px-2 py-0.5 rounded-md">#{tag}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSave}
                className={cn(
                  "shrink-0 size-9 rounded-xl border transition-all flex items-center justify-center",
                  saved ? "bg-danger/10 border-danger/20 text-danger" : "border-border-light text-text-muted hover:text-text-secondary hover:bg-surface-elevated"
                )}
              >
                {saved ? <HeartBreak weight="fill" className="size-4" /> : <BookmarkSimple weight="bold" className="size-4" />}
              </button>
            </div>

            {!useMode ? (
              <>
                <div className="bg-surface rounded-xl p-4 mb-5 border border-border-light">
                  <div className="relative max-h-80 overflow-y-auto">
                    <pre className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono whitespace-pre-wrap rtl:text-right">
                      {skill.systemPrompt}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={handleCopy} icon={copied ? <Check weight="bold" className="size-3.5" /> : <Copy weight="bold" className="size-3.5" />}>
                    {copied ? "تم النسخ" : "نسخ التعليمات"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleShare} icon={<Share weight="bold" className="size-3.5" />}>
                    مشاركة
                  </Button>
                  {variables.length > 0 && (
                    <Button size="sm" onClick={handleUse} icon={<Sparkle weight="fill" className="size-3.5" />}>
                      استخدم المهارة
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-text-primary">املأ المتغيرات</h3>
                {variables.map((v) => (
                  <Input
                    key={v}
                    label={v}
                    value={filledVars[v] ?? ""}
                    onChange={(e) => setFilledVars((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`أدخل قيمة {${v}}`}
                  />
                ))}
                {skill.exampleInput && (
                  <p className="text-[10px] text-text-muted">مثال: {skill.exampleInput}</p>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleGeneratePrompt} icon={<FloppyDisk weight="bold" className="size-3.5" />}>
                    تجهيز البرومت ونسخه
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setUseMode(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <AdminNotes targetType="skill" targetId={skill.id} />
          </div>
        </motion.div>
      </div>
    </main>
  );
}
