"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    setUser(data.user);
    fetchBookmarks(data.user.id);
    setLoading(false);
  }

  async function fetchBookmarks(userId: string) {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId);

    setBookmarks(data || []);
  }

  async function addBookmark() {
    if (!title) return;

    await supabase.from("bookmarks").insert([
      {
        title,
        user_id: user.id,
      },
    ]);

    setTitle("");
    fetchBookmarks(user.id);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <button
        onClick={logout}
        className="mb-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

      <div className="mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bookmark title"
          className="border p-2 mr-2"
        />
        <button
          onClick={addBookmark}
          className="bg-green-500 text-white px-4 py-2"
        >
          Add
        </button>
      </div>

      <ul>
        {bookmarks.map((b) => (
          <li key={b.id} className="border p-2 mb-2">
            {b.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
