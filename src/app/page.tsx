"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Bookmark = {
  id: string;
  title: string;
  url: string;
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
      .select("id,title,url,created_at")
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

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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

  const addBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

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
    const { error } = await supabase.from("bookmarks").insert({
      title: trimmedTitle,
      url: trimmedUrl,
      user_id: user.id,
    });

    if (error) {
      setStatus(error.message);
    } else {
      setTitle("");
      setUrl("");
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Smart Bookmark</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Private bookmark manager powered by Supabase Auth and Realtime.
        </p>
      </header>

      {loading ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Loading session...</p>
        </section>
      ) : !user ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
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
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
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

            <form onSubmit={addBookmark} className="grid gap-3 sm:grid-cols-3">
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
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:col-span-3"
              >
                {saving ? "Saving..." : "Add bookmark"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Your bookmarks ({bookmarks.length})
            </h2>

            {bookmarks.length === 0 ? (
              <p className="text-sm text-zinc-600">
                No bookmarks yet. Add your first one above.
              </p>
            ) : (
              <ul className="space-y-3">
                {bookmarks.map((bookmark) => (
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
                    </div>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
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
