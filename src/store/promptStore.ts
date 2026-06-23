"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedPrompt } from "@/lib/ai-generator";
import type { Category } from "@/data/categories";
import { categories as fallbackCategories } from "@/data/categories";

export interface Prompt {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  level: string;
  tags: string[] | string;
  usageCount: number;
  author?: { id: string; name: string; image?: string } | null;
  likes?: number;
  isLiked?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "user" | "admin";
}

interface SavedPrompt extends Omit<GeneratedPrompt, "createdAt"> {
  savedAt: string;
  createdAt: string;
}

interface PromptStore {
  savedPrompts: SavedPrompt[];
  recentGenerations: GeneratedPrompt[];
  user: User | null;
  isLoading: boolean;
  addToSaved: (prompt: GeneratedPrompt, companyId?: string | null) => void;
  removeFromSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  addToHistory: (prompt: GeneratedPrompt) => void;
  clearHistory: () => void;
  clearAll: () => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  syncSavedFromAPI: () => Promise<void>;
  fetchPrompts: (filters?: Record<string, string>) => Promise<Prompt[]>;
  fetchCategories: () => Promise<Category[]>;
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      savedPrompts: [],
      recentGenerations: [],
      user: null,
      isLoading: false,

      get isLoggedIn(): boolean {
        return get().user !== null;
      },

      addToSaved: (prompt, companyId) => {
        const existing = get().savedPrompts.find((p) => p.id === prompt.id);
        if (existing) return;
        set((state) => ({
          savedPrompts: [
            { ...prompt, createdAt: prompt.createdAt instanceof Date ? prompt.createdAt.toISOString() : prompt.createdAt, savedAt: new Date().toISOString() },
            ...state.savedPrompts,
          ],
        }));
        if (get().user) {
          fetch("/api/user/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              promptId: prompt.id,
              title: prompt.title,
              content: prompt.content,
              tips: prompt.tips,
              categoryId: prompt.categoryId,
              companyId: companyId ?? undefined,
            }),
          }).catch(() => {});
        }
      },

      removeFromSaved: (id) => {
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
        }));
        if (get().user) {
          fetch("/api/user/saved", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptId: id }),
          }).catch(() => {});
        }
      },

      isSaved: (id) => {
        return get().savedPrompts.some((p) => p.id === id);
      },

      addToHistory: (prompt) => {
        set((state) => ({
          recentGenerations: [prompt, ...state.recentGenerations].slice(0, 20),
        }));
      },

      clearHistory: () => set({ recentGenerations: [] }),
      clearAll: () => set({ savedPrompts: [], recentGenerations: [] }),

      setUser: (user) => set({ user }),

      logout: () => set({ user: null }),

      syncSavedFromAPI: async () => {
        try {
          const res = await fetch("/api/user/saved");
          if (res.ok) {
            const json = await res.json();
            const list = Array.isArray(json?.data) ? json.data : [];
            const saved: SavedPrompt[] = list
              .map((row: { prompt: SavedPrompt & { createdAt: string }; createdAt: string }) => ({
                ...row.prompt,
                createdAt: row.prompt.createdAt ?? row.createdAt,
                savedAt: row.createdAt,
              }));
            set({ savedPrompts: saved });
          }
        } catch {
          // Silent fallback to local state
        }
      },

      fetchPrompts: async (filters) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams(filters);
          const res = await fetch(`/api/prompts?${params}`);
          if (res.ok) {
            const json = await res.json();
            set({ isLoading: false });
            return json.data?.prompts ?? [];
          }
        } catch {
          // API unavailable
        }
        set({ isLoading: false });
        return [];
      },

      fetchCategories: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/categories");
          if (res.ok) {
            const data: Category[] = await res.json();
            set({ isLoading: false });
            return data;
          }
        } catch {
          // Fallback to static data
        }
        set({ isLoading: false });
        return fallbackCategories;
      },
    }),
    {
      name: "prompt-lab-storage",
      partialize: (state) => ({
        savedPrompts: state.savedPrompts,
        recentGenerations: state.recentGenerations,
        user: state.user,
      }),
    }
  )
);
