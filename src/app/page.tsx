"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { categories } from "@/data/categories";
import { SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/constants";
import { MagicWand, UserCircle } from "@phosphor-icons/react";

export default function Home() {
  const { data: session } = useSession();
  const [totalPrompts, setTotalPrompts] = useState(0);

  useEffect(() => {
    fetch("/api/prompts?limit=1")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success) setTotalPrompts(json.data?.pagination?.total ?? 0);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 size-[700px] rounded-full bg-accent/[0.08] blur-[150px]" />
          <div className="absolute -bottom-20 -left-20 size-[500px] rounded-full bg-accent/[0.06] blur-[130px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 w-full">
          <div className="max-w-2xl mx-auto text-center">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-accent text-[11px] font-medium mb-5"
            >
              منصة البرومتات العربية الأولى
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-text-primary mb-3"
            >
              {SITE_TAGLINE}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base text-text-secondary max-w-md mx-auto mb-7 leading-relaxed"
            >
              {SITE_DESCRIPTION}. اختر تصنيفاً وابدأ بتوليد برومتات جاهزة أو صمم برومتاتك المخصصة
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2.5"
            >
              <Link href="/categories">
                <Button size="lg" icon={<MagicWand weight="fill" className="size-4" />}>
                  ابدأ التوليد
                </Button>
              </Link>
              <Link href="/#about">
                <Button variant="secondary" size="lg">
                  تعرف على المنصة
                </Button>
              </Link>
            </motion.div>

            {!session && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="mt-5 text-xs text-text-muted"
              >
                <Link href="/login" className="text-accent hover:underline font-medium">دخول</Link>
                {" · "}
                <Link href="/register" className="text-accent hover:underline font-medium">تسجيل</Link>
              </motion.p>
            )}
          </div>
        </div>
      </section>

      <section id="about" className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-accent/[0.06] blur-[120px]" />
          <div className="absolute bottom-0 -right-20 size-[400px] rounded-full bg-accent-secondary/[0.05] blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
            {[
              { label: "برومت جاهز", value: totalPrompts, color: "accent" },
              { label: "تصنيف", value: categories.length, color: "accent-secondary" },
              { label: "مجال متخصص", value: categories.length, color: "warning" },
              { label: "توليد ذكي", value: "AI", color: "danger" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group relative rounded-2xl border border-border-light bg-surface-secondary p-5 text-center overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.06]"
                  style={{ background: `radial-gradient(circle at 50% 0%, var(--color-${stat.color}), transparent 70%)` }}
                />
                <div className="relative">
                  <div
                    className="text-4xl sm:text-5xl font-bold leading-none mb-2"
                    style={{ color: `var(--color-${stat.color})` }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-text-muted tracking-wide">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl mx-auto text-center"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">لماذا مختصر البرومت؟</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              منصتنا تقدم لك برومتات جاهزة واحترافية في أكثر من 10 مجالات مختلفة، مع مولد ذكي يتيح لك
              تخصيص البرومتات حسب احتياجاتك الخاصة. وفر وقتك وجهدك مع برومتات مصممة بعناية.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-accent transition-colors"
                  >
                    <span style={{ color: cat.color }}><cat.icon /></span>
                    {cat.name}
                  </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
