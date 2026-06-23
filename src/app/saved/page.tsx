"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { usePromptStore } from "@/store/promptStore";
import { PromptCard } from "@/components/prompt/PromptCard";
import { PromptDetailModal } from "@/components/prompt/PromptDetailModal";
import { Button } from "@/components/ui/Button";
import { BookmarkSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

export default function SavedPage() {
  const { savedPrompts, clearAll } = usePromptStore();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingPrompt = viewingId ? savedPrompts.find((p) => p.id === viewingId) ?? null : null;
  const [filter, setFilter] = useState<"all" | "my" | "company">("all");
  const [companiesMap, setCompaniesMap] = useState<Record<string, string>>({});

  const handleClearAll = () => {
    clearAll();
    showToast("تم مسح جميع المحفوظات", "info");
  };

  useEffect(() => {
    fetch('/api/user/company').then((r) => r.json()).then((j) => {
      if (j?.success) {
        const map: Record<string, string> = {};
        (j.data ?? []).forEach((c: any) => (map[c.id] = c.name));
        setCompaniesMap(map);
      }
    }).catch(() => {});
  }, []);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">البرومتات المحفوظة</h1>
              <p className="text-sm text-text-secondary mt-1">{savedPrompts.length} برومت محفوظ</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-9 px-3 rounded-xl bg-surface-elevated border border-border text-sm">
                <option value="all">الكل</option>
                <option value="my">خاص بي</option>
                <option value="company">خاص بالشركة</option>
              </select>
              {savedPrompts.length > 0 && (
                <Button variant="danger" size="sm" onClick={handleClearAll} icon={<Trash weight="bold" className="size-4" />}>
                  مسح الكل
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {savedPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPrompts
              .filter((p) => {
                if (filter === 'all') return true;
                if (filter === 'my') return !p.companyId;
                return !!p.companyId;
              })
              .map((prompt, i) => (
                <PromptCard
                  key={prompt.id}
                  prompt={{
                    id: prompt.id,
                    categoryId: prompt.categoryId,
                    title: prompt.title,
                    content: prompt.content,
                    level: "intermediate",
                    tags: [],
                    usageCount: 0,
                  }}
                  index={i}
                  onView={(p) => setViewingId(p.id)}
                />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="size-16 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
              <BookmarkSimple weight="thin" className="size-8 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">لا توجد برومتات محفوظة</h2>
            <p className="text-text-secondary mb-6 max-w-sm mx-auto">
              ابدأ بتصفح التصنيفات أو استخدم مولد البرومتات لحفظ برومتاتك المفضلة هنا
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/">
                <Button variant="secondary">
                  استعرض التصنيفات
                </Button>
              </Link>
              <Link href="/category/marketing">
                <Button>
                  مولد البرومتات
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {viewingPrompt && (
        <PromptDetailModal
          prompt={{
            id: viewingPrompt.id,
            title: viewingPrompt.title,
            content: viewingPrompt.content,
            categoryId: viewingPrompt.categoryId,
            companyId: viewingPrompt.companyId ?? null,
          }}
          onClose={() => setViewingId(null)}
        />
      )}
    </main>
  );
}
