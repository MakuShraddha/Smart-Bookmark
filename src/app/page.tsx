"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  category: string | null;
  created_at: string;
};

export default function Home() {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    [isSupabaseConfigured],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [status, setStatus] = useState(
    isSupabaseConfigured
      ? ""
      : "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);

  const user = session?.user;

  const fetchBookmarks = useCallback(async (userId: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("bookmarks")
      .select("id,title,url,category,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(error.message);
      return;
    }

    setBookmarks(data ?? []);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus(error.message);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setBookmarks([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;

    queueMicrotask(() => {
      fetchBookmarks(user.id);
    });

    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookmarks(user.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookmarks, supabase, user]);

  const signInWithGoogle = async () => {
    if (!supabase) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });
    if (error) {
      setStatus(error.message);
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("");
    }
  };

  const addOrUpdateBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    const trimmedCategory = category.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setStatus("Title and URL are required.");
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setStatus("Please enter a valid URL, for example https://example.com.");
      return;
    }

    setSaving(true);
    const payload = {
      title: trimmedTitle,
      url: trimmedUrl,
      category: trimmedCategory || null,
      user_id: user.id,
    };

    const { error } = editId
      ? await supabase
          .from("bookmarks")
          .update({
            title: payload.title,
            url: payload.url,
            category: payload.category,
          })
          .eq("id", editId)
          .eq("user_id", user.id)
      : await supabase.from("bookmarks").insert(payload);

    if (error) {
      setStatus(error.message);
    } else {
      setTitle("");
      setUrl("");
      setCategory("");
      setEditId(null);
      setStatus("");
    }
    setSaving(false);
  };

  const deleteBookmark = async (id: string) => {
    if (!supabase) return;

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
    }
  };

  const startEditBookmark = (bookmark: Bookmark) => {
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setCategory(bookmark.category ?? "");
    setEditId(bookmark.id);
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      bookmark.title.toLowerCase().includes(needle) ||
      bookmark.url.toLowerCase().includes(needle) ||
      (bookmark.category ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <main
      className={`mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 ${
        darkMode ? "bg-zinc-900 text-zinc-100" : "text-zinc-900"
      }`}
    >
      <header
        className={`rounded-xl border p-6 shadow-sm ${
          darkMode
            ? "border-zinc-700 bg-zinc-800"
            : "border-zinc-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Smart Bookmark</h1>
          <button
            onClick={() => setDarkMode((value) => !value)}
            className={`rounded-md border px-3 py-2 text-sm ${
              darkMode
                ? "border-zinc-600 hover:bg-zinc-700"
                : "border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-600">
          Private bookmark manager powered by Supabase Auth and Realtime.
        </p>
      </header>

      {loading ? (
        <section
          className={`rounded-xl border p-6 shadow-sm ${
            darkMode
              ? "border-zinc-700 bg-zinc-800"
              : "border-zinc-200 bg-white"
          }`}
        >
          <p className="text-sm text-zinc-600">Loading session...</p>
        </section>
      ) : !user ? (
        <section
          className={`rounded-xl border p-6 shadow-sm ${
            darkMode
              ? "border-zinc-700 bg-zinc-800"
              : "border-zinc-200 bg-white"
          }`}
        >
          <p className="mb-4 text-sm text-zinc-700">
            Sign in with Google to manage your private bookmarks.
          </p>
          <button
            onClick={signInWithGoogle}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Continue with Google
          </button>
        </section>
      ) : (
        <>
          <section
            className={`rounded-xl border p-6 shadow-sm ${
              darkMode
                ? "border-zinc-700 bg-zinc-800"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-600">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
              <button
                onClick={signOut}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Sign out
              </button>
            </div>

            <form onSubmit={addOrUpdateBookmark} className="grid gap-3 sm:grid-cols-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Bookmark title"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm sm:col-span-1"
              />
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Category (optional)"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:col-span-3"
              >
                {saving ? "Saving..." : editId ? "Update bookmark" : "Add bookmark"}
              </button>
              {editId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setTitle("");
                    setUrl("");
                    setCategory("");
                  }}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm sm:col-span-3"
                >
                  Cancel edit
                </button>
              ) : null}
            </form>
          </section>

          <section
            className={`rounded-xl border p-6 shadow-sm ${
              darkMode
                ? "border-zinc-700 bg-zinc-800"
                : "border-zinc-200 bg-white"
            }`}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, URL, or category"
              className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Your bookmarks ({filteredBookmarks.length})
            </h2>

            {filteredBookmarks.length === 0 ? (
              <p className="text-sm text-zinc-600">
                No matching bookmarks.
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredBookmarks.map((bookmark) => (
                  <li
                    key={bookmark.id}
                    className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">{bookmark.title}</p>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-700 hover:underline"
                      >
                        {bookmark.url}
                      </a>
                      {bookmark.category ? (
                        <p className="text-xs text-zinc-500">
                          Category: {bookmark.category}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditBookmark(bookmark)}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {status ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {status}
        </p>
      ) : null}
    </main>
  );
}
