"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Gear } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import AdminNotes from "@/components/admin/AdminNotes";
import {
  Users, Quotes, Tag, Trash, Pencil, Shield, ArrowLeft, Plus,
  MagnifyingGlass, CaretLeft, CaretRight, Eye, EyeSlash,
  ChartBar, Stack, UserCircle, ClockCounterClockwise, GearSix
} from "@phosphor-icons/react";

interface AdminStats {
  total: { users: number; prompts: number; categories: number; likes: number; comments: number };
  categoryDistribution: { id: string; name: string; count: number }[];
  recentPrompts: { id: string; title: string; createdAt: string; author: { name: string } | null; _count: { likes: number } }[];
  recentEvents: { id: string; type: string; message: string; userId: string | null; createdAt: string; user: { name: string | null; email: string } | null }[];
}

interface AdminUser {
  id: string; name: string | null; email: string; role: string; image: string | null;
  dailyGenLimit: number; dailyGenCount: number; dailyGenDate: string | null;
  createdAt: string; _count: { prompts: number; likes: number; comments: number };
}

interface AdminPrompt {
  id: string; title: string; content: string; level: string; tags: string;
  usageCount: number; isPublic: boolean; categoryId: string; createdAt: string;
  category: { id: string; name: string };
  author: { id: string; name: string | null; image: string | null } | null;
  _count: { likes: number; savedBy: number; comments: number };
}

interface AdminCategory {
  id: string; name: string; description: string; color: string; icon: string;
  sortOrder: number; _count: { prompts: number };
}

type Tab = "dashboard" | "users" | "prompts" | "categories";

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [editPrompt, setEditPrompt] = useState<AdminPrompt | null>(null);
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);

  const isAdmin = session?.user?.role === "admin";

  const fetchStats = useCallback(async () => {
    try { const r = await fetch("/api/admin/stats"); if (r.ok) { const d = await r.json(); setStats(d.data); } } catch {}
  }, []);

  const fetchUsers = useCallback(async (p = 1, q = "") => {
    try {
      const r = await fetch(`/api/admin/users?page=${p}&limit=20${q ? `&search=${q}` : ""}`);
      if (r.ok) { const d = await r.json(); setUsers(d.data.users); setTotalPages(d.data.pagination.totalPages); }
    } catch {}
  }, []);

  const fetchPrompts = useCallback(async (p = 1, q = "") => {
    try {
      const r = await fetch(`/api/admin/prompts?page=${p}&limit=20${q ? `&search=${q}` : ""}`);
      if (r.ok) { const d = await r.json(); setPrompts(d.data.prompts); setTotalPages(d.data.pagination.totalPages); }
    } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    try { const r = await fetch("/api/admin/categories"); if (r.ok) { const d = await r.json(); setCategories(d.data); } } catch {}
  }, []);

  const sessionStatus = session === undefined ? "loading" : isAdmin ? "authorized" : "unauthorized";

  useEffect(() => {
    if (sessionStatus === "loading") return;
    const load = sessionStatus === "authorized"
      // eslint-disable-next-line react-hooks/set-state-in-effect
      ? (activeTab === "dashboard" ? fetchStats()
        : activeTab === "users" ? fetchUsers(page, search)
        : activeTab === "prompts" ? fetchPrompts(page, search)
        : fetchCategories())
      : Promise.resolve();
    Promise.resolve(load).finally(() => setLoading(false));
  }, [sessionStatus, activeTab, page, search, fetchStats, fetchUsers, fetchPrompts, fetchCategories]);

  if (!isAdmin) {
    return (
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 text-center py-20">
          <div className="size-16 rounded-2xl bg-surface-elevated flex items-center justify-center mx-auto mb-4">
            <Shield weight="thin" className="size-8 text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">غير مصرح</h2>
          <p className="text-sm text-text-secondary mb-6">هذه الصفحة مخصصة للمشرفين فقط</p>
          <Link href="/"><Button variant="secondary" icon={<ArrowLeft weight="bold" className="size-4" />}>العودة للرئيسية</Button></Link>
        </div>
      </main>
    );
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`حذف المستخدم "${name}"؟`)) return;
    try { const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" }); if (r.ok) { showToast("تم الحذف"); fetchUsers(page, search); fetchStats(); } else { const d = await r.json(); showToast(d.error || "فشل الحذف", "error"); } } catch { showToast("خطأ في الاتصال", "error"); }
  };

  const handleToggleRole = async (id: string, role: string) => {
    const newRole = role === "admin" ? "user" : "admin";
    if (!confirm(`تغيير صلاحية المستخدم إلى ${newRole === "admin" ? "مشرف" : "مستخدم"}؟`)) return;
    try { const r = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) }); if (r.ok) { showToast("تم التغيير"); fetchUsers(page, search); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); } } catch { showToast("خطأ", "error"); }
  };

  const handleUpdateLimit = async (id: string, limit: number) => {
    try { const r = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dailyGenLimit: limit }) }); if (r.ok) { showToast("تم التحديث"); fetchUsers(page, search); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); } } catch { showToast("خطأ", "error"); }
  };

  const handleDeletePrompt = async (id: string, title: string) => {
    if (!confirm(`حذف البرومت "${title}"؟`)) return;
    try { const r = await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" }); if (r.ok) { showToast("تم الحذف"); fetchPrompts(page, search); fetchStats(); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); } } catch { showToast("خطأ", "error"); }
  };

  const handleToggleVisibility = async (prompt: AdminPrompt) => {
    try { const r = await fetch(`/api/admin/prompts/${prompt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: !prompt.isPublic }) }); if (r.ok) { showToast(prompt.isPublic ? "إخفاء" : "نشر", "info"); fetchPrompts(page, search); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); } } catch { showToast("خطأ", "error"); }
  };

  const handleEditPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt) return;
    try {
      const r = await fetch(`/api/admin/prompts/${editPrompt.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editPrompt.title, content: editPrompt.content,
          level: editPrompt.level, categoryId: editPrompt.categoryId,
          isPublic: editPrompt.isPublic, description: "",
        }),
      });
      if (r.ok) { showToast("تم التحديث"); setEditPrompt(null); fetchPrompts(page, search); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); }
    } catch { showToast("خطأ", "error"); }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch("/api/admin/prompts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, isPublic: true, tags: (data.tags as string || "").split(",").map(t => t.trim()).filter(Boolean) }),
      });
      if (r.ok) { showToast("تم الإنشاء"); setShowCreatePrompt(false); fetchPrompts(1, ""); fetchStats(); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); }
    } catch { showToast("خطأ", "error"); }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`حذف التصنيف "${name}"؟`)) return;
    try { const r = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" }); if (r.ok) { showToast("تم الحذف"); fetchCategories(); fetchStats(); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); } } catch { showToast("خطأ", "error"); }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch("/api/admin/categories", {
        method: editCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sortOrder: Number(data.sortOrder) || 0 }),
      });
      if (r.ok) { showToast(editCategory ? "تم التحديث" : "تم الإنشاء"); setEditCategory(null); setShowCreateCategory(false); fetchCategories(); } else { const d = await r.json(); showToast(d.error || "فشل", "error"); }
    } catch { showToast("خطأ", "error"); }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "لوحة المعلومات", icon: <ChartBar weight="bold" className="size-3.5" /> },
    { id: "users", label: "المستخدمين", icon: <Users weight="bold" className="size-3.5" /> },
    { id: "prompts", label: "البرومتات", icon: <Quotes weight="bold" className="size-3.5" /> },
    { id: "categories", label: "التصنيفات", icon: <Tag weight="bold" className="size-3.5" /> },
  ];

  const statCards = stats ? [
    { label: "المستخدمين", value: stats.total.users, icon: Users, color: "accent" },
    { label: "البرومتات", value: stats.total.prompts, icon: Quotes, color: "accent-secondary" },
    { label: "التصنيفات", value: stats.total.categories, icon: Tag, color: "warning" },
    { label: "إعجابات", value: stats.total.likes, icon: Shield, color: "danger" },
    { label: "تعليقات", value: stats.total.comments, icon: Stack, color: "accent" },
  ] : [];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-10 rounded-xl bg-danger/15 flex items-center justify-center"><Shield weight="fill" className="size-5 text-danger" /></div>
            <div><h1 className="text-2xl font-bold text-text-primary">لوحة الإدارة</h1><p className="text-sm text-text-secondary">إدارة كاملة للمستخدمين والبرومتات والتصنيفات</p></div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-6 p-0.5 rounded-xl bg-surface-secondary border border-border-light overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setPage(1); setSearch(""); }} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap", activeTab === t.id ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}>
              {t.icon}{t.label}
            </button>
          ))}
          <Link href="/admin/settings" className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-all mr-auto whitespace-nowrap">
            <GearSix weight="bold" className="size-3.5" />الإعدادات
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="size-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-text-muted">جاري التحميل...</p></div>
        ) : (
          <>
            {activeTab === "dashboard" && stats && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} className="rounded-xl border border-border-light bg-surface-secondary p-4 text-center">
                      <div className="size-8 rounded-lg flex items-center justify-center mx-auto mb-2.5" style={{ backgroundColor: `var(--color-${s.color})15` }}>
                        <s.icon weight="bold" className="size-4" style={{ color: `var(--color-${s.color})` }} />
                      </div>
                      <div className="text-xl font-bold text-text-primary mb-0.5">{s.value}</div>
                      <div className="text-[11px] text-text-muted">{s.label}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
                    <h3 className="text-xs font-semibold text-text-primary mb-3">آخر الأحداث والنشاطات</h3>
                    <div className="space-y-1">
                      {stats.recentEvents.length === 0 && <p className="text-xs text-text-muted py-4 text-center">لا توجد أحداث بعد</p>}
                      {stats.recentEvents.map(e => (
                        <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                          <div className="size-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0"><ClockCounterClockwise weight="bold" className="size-3 text-accent" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-text-primary truncate">{e.message}</p>
                            <p className="text-[10px] text-text-muted">{new Date(e.createdAt).toLocaleDateString("ar-SA")} — {e.user?.name ?? e.user?.email ?? "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
                    <h3 className="text-xs font-semibold text-text-primary mb-3">توزيع البرومتات حسب التصنيف</h3>
                    <div className="space-y-2">
                      {stats.categoryDistribution.map(c => {
                        const max = Math.max(...stats.categoryDistribution.map(x => x.count), 1);
                        const pct = (c.count / max) * 100;
                        return (
                          <div key={c.id}>
                            <div className="flex items-center justify-between text-xs mb-1"><span className="text-text-secondary">{c.name}</span><span className="text-text-muted">{c.count}</span></div>
                            <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-accent" /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-light bg-surface-secondary p-4">
                    <h3 className="text-xs font-semibold text-text-primary mb-3">آخر البرومتات</h3>
                    <div className="space-y-2">
                      {stats.recentPrompts.map(p => (
                        <Link key={p.id} href={`/prompt/${p.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors">
                          <div className="min-w-0"><p className="text-xs font-medium text-text-primary truncate">{p.title}</p><p className="text-[10px] text-text-muted">{p.author?.name ?? "بدون"}</p></div>
                          <span className="text-[10px] text-text-muted shrink-0">{p._count.likes} ❤</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <AdminNotes targetType="global" targetId="dashboard" />
                </div>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-xs"><MagnifyingGlass weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث..." className="w-full h-9 pr-9 pl-3 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50" /></div>
                </div>
                <div className="rounded-xl border border-border-light bg-surface-secondary overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border-light text-text-muted">
                        <th className="text-right px-4 py-3 font-medium">المستخدم</th>
                        <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">البريد</th>
                        <th className="text-right px-4 py-3 font-medium">الدور</th>
                        <th className="text-right px-4 py-3 font-medium hidden md:table-cell">البرومتات</th>
                        <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">الحد اليومي</th>
                        <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">التسجيل</th>
                        <th className="text-left px-4 py-3 font-medium">إجراءات</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border-light">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-surface-elevated/50 transition-colors">
                            <td className="px-4 py-3"><div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">{u.name?.charAt(0) ?? "?"}</div>
                              <span className="font-medium text-text-primary">{u.name ?? "بدون اسم"}</span>
                            </div></td>
                            <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{u.email}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleToggleRole(u.id, u.role)} className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors", u.role === "admin" ? "bg-danger/10 text-danger hover:bg-danger/20" : "bg-accent/10 text-accent hover:bg-accent/20")}>
                                {u.role === "admin" ? "مشرف" : "مستخدم"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{u._count.prompts}</td>
                            <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                              <div className="flex items-center gap-1">
                                <select
                                  defaultValue={u.dailyGenLimit}
                                  onChange={e => handleUpdateLimit(u.id, parseInt(e.target.value))}
                                  className="w-14 h-7 px-1 rounded-md bg-surface-elevated border border-border text-xs text-center text-text-primary focus:outline-none focus:border-accent/50 cursor-pointer"
                                >
                                  {[5, 10, 20, 50, 100, 500, 1000, 99999].map(n => (
                                    <option key={n} value={n}>{n === 99999 ? "∞" : n}</option>
                                  ))}
                                </select>
                                <span className="text-[10px] text-text-muted whitespace-nowrap">/ {u.dailyGenCount} اليوم</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                            <td className="px-4 py-3 text-left">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleToggleRole(u.id, u.role)} className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-all" title="تغيير الصلاحية"><UserCircle weight="bold" className="size-3.5" /></button>
                                <button onClick={() => handleDeleteUser(u.id, u.name ?? "")} className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="حذف"><Trash weight="bold" className="size-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-text-muted">لا يوجد مستخدمين</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-4"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-30 transition-all"><CaretRight weight="bold" className="size-3.5" /></button><span className="text-xs text-text-muted">{page} / {totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-30 transition-all"><CaretLeft weight="bold" className="size-3.5" /></button></div>}
              </motion.div>
            )}

            {activeTab === "prompts" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-xs"><MagnifyingGlass weight="bold" className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث..." className="w-full h-9 pr-9 pl-3 rounded-xl bg-surface-secondary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50" /></div>
                  <Button size="sm" icon={<Plus weight="bold" className="size-3.5" />} onClick={() => setShowCreatePrompt(true)}>إضافة</Button>
                </div>

                <div className="rounded-xl border border-border-light bg-surface-secondary overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border-light text-text-muted">
                        <th className="text-right px-4 py-3 font-medium">العنوان</th>
                        <th className="text-right px-4 py-3 font-medium hidden md:table-cell">التصنيف</th>
                        <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">المستوى</th>
                        <th className="text-right px-4 py-3 font-medium">الحالة</th>
                        <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">إعجابات</th>
                        <th className="text-left px-4 py-3 font-medium">إجراءات</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border-light">
                        {prompts.map(p => (
                          <tr key={p.id} className="hover:bg-surface-elevated/50 transition-colors">
                            <td className="px-4 py-3"><span className="font-medium text-text-primary line-clamp-1">{p.title}</span></td>
                            <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{p.category?.name ?? p.categoryId}</td>
                            <td className="px-4 py-3 hidden sm:table-cell"><span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", p.level === "beginner" ? "bg-accent/10 text-accent" : p.level === "advanced" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning")}>{p.level === "beginner" ? "مبتدئ" : p.level === "advanced" ? "متقدم" : "متوسط"}</span></td>
                            <td className="px-4 py-3"><button onClick={() => handleToggleVisibility(p)} className={cn("flex items-center gap-1 text-[10px] font-medium transition-colors", p.isPublic ? "text-accent hover:text-accent/80" : "text-text-muted hover:text-text-secondary")}>{p.isPublic ? <><Eye weight="bold" className="size-3" /> منشور</> : <><EyeSlash weight="bold" className="size-3" /> مخفي</>}</button></td>
                            <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">{p._count.likes}</td>
                            <td className="px-4 py-3 text-left"><div className="flex items-center justify-end gap-1">
                              <button onClick={() => setEditPrompt(p)} className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-all" title="تعديل"><Pencil weight="bold" className="size-3.5" /></button>
                              <button onClick={() => handleDeletePrompt(p.id, p.title)} className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="حذف"><Trash weight="bold" className="size-3.5" /></button>
                            </div></td>
                          </tr>
                        ))}
                        {prompts.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-text-muted">لا يوجد برومتات</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                {totalPages > 1 && <div className="flex items-center justify-center gap-2 mt-4"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-30"><CaretRight weight="bold" className="size-3.5" /></button><span className="text-xs text-text-muted">{page} / {totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-30"><CaretLeft weight="bold" className="size-3.5" /></button></div>}
              </motion.div>
            )}

            {activeTab === "categories" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4"><p className="text-xs text-text-secondary">{categories.length} تصنيف</p><Button size="sm" icon={<Plus weight="bold" className="size-3.5" />} onClick={() => setShowCreateCategory(true)}>إضافة</Button></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map(c => (
                    <div key={c.id} className="rounded-xl border border-border-light bg-surface-secondary p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5"><div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + "15" }}><div className="size-4 rounded" style={{ backgroundColor: c.color }} /></div><div><h4 className="text-sm font-semibold text-text-primary">{c.name}</h4><p className="text-[10px] text-text-muted">{c._count.prompts} برومت</p></div></div>
                        <div className="flex gap-1"><button onClick={() => setEditCategory(c)} className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-accent hover:bg-accent/10 transition-all"><Pencil weight="bold" className="size-3" /></button><button onClick={() => handleDeleteCategory(c.id, c.name)} className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all" disabled={c._count.prompts > 0}><Trash weight="bold" className="size-3" /></button></div>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-2">{c.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-text-muted">ID: {c.id}</span>
                        <span className="text-[10px] text-text-muted">ترتيب: {c.sortOrder}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {editPrompt && (
          <Modal onClose={() => setEditPrompt(null)} title="تعديل البرومت">
            <form onSubmit={handleEditPrompt} className="space-y-3">
              <Input label="العنوان" name="title" defaultValue={editPrompt.title} onChange={e => setEditPrompt({ ...editPrompt, title: e.target.value })} required />
              <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">المحتوى</label><textarea name="content" defaultValue={editPrompt.content} onChange={e => setEditPrompt({ ...editPrompt, content: e.target.value })} required className="w-full min-h-[120px] px-3.5 py-3 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm resize-y focus:outline-none focus:border-accent/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">المستوى</label><select name="level" value={editPrompt.level} onChange={e => setEditPrompt({ ...editPrompt, level: e.target.value })} className="w-full h-10 px-3.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:outline-none focus:border-accent/50"><option value="beginner">مبتدئ</option><option value="intermediate">متوسط</option><option value="advanced">متقدم</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">التصنيف</label><select name="categoryId" value={editPrompt.categoryId} onChange={e => setEditPrompt({ ...editPrompt, categoryId: e.target.value })} className="w-full h-10 px-3.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:outline-none focus:border-accent/50">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="flex items-center gap-2 pt-2"><input type="checkbox" id="isPublic" checked={editPrompt.isPublic} onChange={e => setEditPrompt({ ...editPrompt, isPublic: e.target.checked })} className="rounded border-border" /><label htmlFor="isPublic" className="text-xs text-text-secondary">منشور</label></div>
              <div className="flex gap-2 pt-2"><Button type="submit" size="sm" className="flex-1">حفظ</Button><Button type="button" variant="secondary" size="sm" onClick={() => setEditPrompt(null)}>إلغاء</Button></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreatePrompt && (
          <Modal onClose={() => setShowCreatePrompt(false)} title="إضافة برومت جديد">
            <form onSubmit={handleCreatePrompt} className="space-y-3">
              <Input label="العنوان" name="title" required />
              <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">المحتوى</label><textarea name="content" required className="w-full min-h-[120px] px-3.5 py-3 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm resize-y focus:outline-none focus:border-accent/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">المستوى</label><select name="level" className="w-full h-10 px-3.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:outline-none focus:border-accent/50"><option value="beginner">مبتدئ</option><option value="intermediate">متوسط</option><option value="advanced">متقدم</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">التصنيف</label><select name="categoryId" required className="w-full h-10 px-3.5 rounded-xl bg-surface-elevated border border-border text-text-primary text-sm focus:outline-none focus:border-accent/50">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <Input label="الوسوم (مفصولة بفاصلة)" name="tags" placeholder="تسويق، إعلانات" />
              <div className="flex gap-2 pt-2"><Button type="submit" size="sm" className="flex-1">إنشاء</Button><Button type="button" variant="secondary" size="sm" onClick={() => setShowCreatePrompt(false)}>إلغاء</Button></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateCategory && (
          <Modal onClose={() => setShowCreateCategory(false)} title="إضافة تصنيف جديد">
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <Input label="المعرف (ID)" name="id" required placeholder="marketing" />
              <Input label="الاسم" name="name" required placeholder="التسويق والإعلان" />
              <Input label="الوصف" name="description" placeholder="برومتات تسويقية" />
              <div className="grid grid-cols-3 gap-3">
                <Input label="اللون" name="color" placeholder="#22c55e" />
                <Input label="الأيقونة" name="icon" placeholder="Target" />
                <Input label="الترتيب" name="sortOrder" type="number" placeholder="1" />
              </div>
              <div className="flex gap-2 pt-2"><Button type="submit" size="sm" className="flex-1">إنشاء</Button><Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateCategory(false)}>إلغاء</Button></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editCategory && (
          <Modal onClose={() => setEditCategory(null)} title="تعديل التصنيف">
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <input type="hidden" name="id" value={editCategory.id} />
              <Input label="الاسم" name="name" defaultValue={editCategory.name} required />
              <Input label="الوصف" name="description" defaultValue={editCategory.description} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="اللون" name="color" defaultValue={editCategory.color} />
                <Input label="الأيقونة" name="icon" defaultValue={editCategory.icon} />
                <Input label="الترتيب" name="sortOrder" type="number" defaultValue={String(editCategory.sortOrder)} />
              </div>
              <div className="flex gap-2 pt-2"><Button type="submit" size="sm" className="flex-1">حفظ</Button><Button type="button" variant="secondary" size="sm" onClick={() => setEditCategory(null)}>إلغاء</Button></div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}


