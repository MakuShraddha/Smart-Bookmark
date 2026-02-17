"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Recharts dynamic imports
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  user_id: string;
  created_at?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentBookmarkIndex, setCurrentBookmarkIndex] = useState(0);

  // Check auth on mount
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  // Auto-cycle through bookmarks carousel
  useEffect(() => {
    if (bookmarks.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBookmarkIndex((prev) => (prev + 1) % bookmarks.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [bookmarks.length]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
    } else {
      setUser(data.user);
      fetchBookmarks(data.user.id);
      setLoading(false);
    }
  }

  // Fetch bookmarks and weekly chart data
  async function fetchBookmarks(userId?: string) {
    if (!userId && user) userId = user.id;

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setBookmarks(data || []);

    // Weekly chart data
    const last7Days: any = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      last7Days[key] = 0;
    }

    (data || []).forEach((item) => {
      const created = new Date(item.created_at || "");
      const diff = (new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 7) {
        const key = created.toLocaleDateString("en-US", { weekday: "short" });
        if (last7Days[key] !== undefined) last7Days[key]++;
      }
    });

    setWeeklyData(
      Object.keys(last7Days).map((key) => ({ name: key, value: last7Days[key] }))
    );
  }

  // Add or update bookmark
  async function addOrUpdateBookmark() {
    if (!title || !url || !user) {
      alert("Please fill in title and URL");
      return;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from("bookmarks")
          .update({ title, url, category })
          .eq("id", editId)
          .eq("user_id", user.id);
        if (error) {
          console.error("Update error:", error);
          alert("Failed to update bookmark");
          return;
        }
        setEditId(null);
      } else {
        const { error } = await supabase.from("bookmarks").insert([{ title, url, category, user_id: user.id }]);
        if (error) {
          console.error("Insert error:", error);
          alert("Failed to create bookmark");
          return;
        }
      }

      setTitle("");
      setUrl("");
      setCategory("");
      await fetchBookmarks();
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  async function deleteBookmark(id: string) {
    if (!confirm("Are you sure you want to delete this bookmark?")) {
      return;
    }
    
    try {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id).eq("user_id", user.id);
      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete bookmark");
        return;
      }
      await fetchBookmarks();
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }

  function handleEdit(bookmark: Bookmark) {
    setTitle(bookmark.title || "");
    setUrl(bookmark.url || "");
    setCategory(bookmark.category || "");
    setEditId(bookmark.id);
    
    // Scroll to form after state update
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setBookmarks([]);
    router.push("/login");
  }

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl font-bold">Loading...</div>;
  if (!user) return null;

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-[#3d2817] via-[#4b2e1e] to-[#2a1810] text-[#f5e6d3]"
          : "bg-gradient-to-br from-[#fdf6e3] via-[#f5e6d3] to-[#e8d8c3] text-[#4b2e1e]"
      }`}
    >
      <div className="max-w-6xl mx-auto p-6 lg:p-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12"
        >
          <div>
            <h1 className="text-5xl font-extrabold tracking-wide mb-2">Smart Bookmark</h1>
            <p className="text-sm opacity-70">Welcome back, {user?.email?.split("@")[0]}!</p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg font-semibold transition border-2 ${
                darkMode
                  ? "border-[#f5e6d3] bg-[#5c3a21] text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#5c3a21]"
                  : "border-[#5c3a21] bg-[#faf5f0] text-[#5c3a21] hover:bg-[#5c3a21] hover:text-[#f5e6d3]"
              }`}
            >
              {darkMode ? "☀ Light" : "🌙 Dark"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/profile")}
              className={`px-4 py-2 rounded-lg font-semibold transition border-2 ${
                darkMode
                  ? "border-[#f5e6d3] bg-[#5c3a21] text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#5c3a21]"
                  : "border-[#5c3a21] bg-[#faf5f0] text-[#5c3a21] hover:bg-[#5c3a21] hover:text-[#f5e6d3]"
              }`}
            >
              👤 Profile
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-semibold transition border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              🚪 Logout
            </motion.button>
          </div>
        </motion.div>

        {/* YOUR BOOKMARKS CAROUSEL - ONE CARD AT A TIME */}
        {bookmarks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-2xl font-bold mb-6">📖 Your Recent Bookmarks</h2>
            <div className="w-full flex justify-center">
              <motion.div
                key={currentBookmarkIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className={`w-full max-w-5xl p-12 rounded-3xl shadow-2xl border-2 transition flex flex-col justify-between min-h-96 ${
                  darkMode
                    ? "bg-gradient-to-br from-[#6b4a2f] to-[#5c3a21] border-[#f5e6d3] bg-opacity-60"
                    : "bg-gradient-to-br from-white to-[#faf5f0] border-[#e8cdb8]"
                }`}
              >
                <div>
                  <h3 className="font-bold text-4xl mb-6 line-clamp-2">
                    {bookmarks[currentBookmarkIndex].title}
                  </h3>
                  <a
                    href={bookmarks[currentBookmarkIndex].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-base underline font-semibold mb-8 break-words line-clamp-2 transition ${
                      darkMode ? "text-[#a8d5ff] hover:text-[#f5e6d3]" : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    🔗 {bookmarks[currentBookmarkIndex].url}
                  </a>
                </div>
                <div
                  className="flex items-center justify-between pt-8 border-t-2"
                  style={{ borderTopColor: darkMode ? "#f5e6d3" : "#e8cdb8" }}
                >
                  <p className={`font-bold text-xl ${darkMode ? "text-[#d4c5b0]" : "text-[#7a5a3a]"}`}>
                    📂 {bookmarks[currentBookmarkIndex].category || "Uncategorized"}
                  </p>
                  <p className={`text-base font-semibold ${darkMode ? "text-[#f5e6d3]" : "text-[#5c3a21]"}`}>
                    {bookmarks[currentBookmarkIndex].created_at
                      ? new Date(bookmarks[currentBookmarkIndex].created_at!).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: new Date(bookmarks[currentBookmarkIndex].created_at!).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
                        })
                      : "No date"}
                  </p>
                </div>
              </motion.div>
            </div>
            {/* Carousel indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {bookmarks.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentBookmarkIndex(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`h-3 rounded-full transition ${
                    index === currentBookmarkIndex
                      ? darkMode
                        ? "bg-[#f5e6d3] w-8"
                        : "bg-[#5c3a21] w-8"
                      : darkMode
                      ? "bg-[#5c3a21] w-3"
                      : "bg-[#d4c5b0] w-3"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ADD / EDIT FORM */}
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-8 rounded-2xl shadow-lg border-2 mb-10 ${
            darkMode
              ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-30"
              : "bg-[#faf5f0] border-[#e8cdb8]"
          }`}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {editId ? "Edit Bookmark" : "➕ Add New Bookmark"}
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <motion.input
              whileFocus={{ scale: 1.02 }}
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value || "")}
              className={`p-3 rounded-lg border-2 font-semibold focus:ring-2 transition ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3] placeholder:text-[#d4c5b0] focus:ring-[#f5e6d3]"
                  : "bg-white border-[#5c3a21] text-[#5c3a21] placeholder:text-[#a08570] focus:ring-[#5c3a21]"
              }`}
            />
            <motion.input
              whileFocus={{ scale: 1.02 }}
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value || "")}
              className={`p-3 rounded-lg border-2 font-semibold focus:ring-2 transition col-span-2 ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3] placeholder:text-[#d4c5b0] focus:ring-[#f5e6d3]"
                  : "bg-white border-[#5c3a21] text-[#5c3a21] placeholder:text-[#a08570] focus:ring-[#5c3a21]"
              }`}
            />
            <motion.input
              whileFocus={{ scale: 1.02 }}
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value || "")}
              className={`p-3 rounded-lg border-2 font-semibold focus:ring-2 transition ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3] placeholder:text-[#d4c5b0] focus:ring-[#f5e6d3]"
                  : "bg-white border-[#5c3a21] text-[#5c3a21] placeholder:text-[#a08570] focus:ring-[#5c3a21]"
              }`}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addOrUpdateBookmark}
            className={`px-8 py-3 border-2 font-bold rounded-lg transition ${
              darkMode
                ? "border-[#f5e6d3] text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#5c3a21]"
                : "border-[#5c3a21] text-[#5c3a21] bg-[#f5e6d3] hover:bg-[#5c3a21] hover:text-[#f5e6d3]"
            }`}
          >
            {editId ? "📝 Update" : "➕ Add"}
          </motion.button>
        </motion.div>

        {/* SEARCH */}
        <motion.input
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileFocus={{ scale: 1.02 }}
          placeholder="🔎 Search by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value || "")}
          className={`w-full p-4 rounded-2xl border-2 font-semibold focus:ring-2 transition mb-10 ${
            darkMode
              ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3] placeholder:text-[#d4c5b0] focus:ring-[#f5e6d3]"
              : "bg-white border-[#5c3a21] text-[#5c3a21] placeholder:text-[#a08570] focus:ring-[#5c3a21]"
          }`}
        />

        {/* STATS ROW */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Total Bookmarks */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl shadow-lg border-2 ${
              darkMode
                ? "bg-gradient-to-br from-[#5c3a21] to-[#4b2e1e] border-[#f5e6d3] bg-opacity-50"
                : "bg-gradient-to-br from-[#faf5f0] to-[#f5e6d3] border-[#e8cdb8]"
            }`}
          >
            <p className="text-sm opacity-70 mb-2">Total Bookmarks</p>
            <p className="text-4xl font-extrabold">{bookmarks.length}</p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl shadow-lg border-2 ${
              darkMode
                ? "bg-gradient-to-br from-[#5c3a21] to-[#4b2e1e] border-[#f5e6d3] bg-opacity-50"
                : "bg-gradient-to-br from-[#faf5f0] to-[#f5e6d3] border-[#e8cdb8]"
            }`}
          >
            <p className="text-sm opacity-70 mb-2">Categories</p>
            <p className="text-4xl font-extrabold">{new Set(bookmarks.map(b => b.category)).size}</p>
          </motion.div>

          {/* This Week */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl shadow-lg border-2 ${
              darkMode
                ? "bg-gradient-to-br from-[#5c3a21] to-[#4b2e1e] border-[#f5e6d3] bg-opacity-50"
                : "bg-gradient-to-br from-[#faf5f0] to-[#f5e6d3] border-[#e8cdb8]"
            }`}
          >
            <p className="text-sm opacity-70 mb-2">Added This Week</p>
            <p className="text-4xl font-extrabold">{weeklyData.reduce((sum, d) => sum + d.value, 0)}</p>
          </motion.div>
        </div>

        {/* BOOKMARK GRID */}
        <div>
          <h2 className="text-2xl font-bold mb-6">📚 Your Bookmarks {filteredBookmarks.length > 0 && `(${filteredBookmarks.length})`}</h2>
          {filteredBookmarks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-12 rounded-2xl text-center border-2 border-dashed ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#d4c5b0]"
                  : "bg-[#fffaf3] border-[#d4c5b0] text-[#a08570]"
              }`}
            >
              <p className="text-lg">No bookmarks found. Start adding your favorites! 🎉</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookmarks.map((bookmark, index) => (
                <motion.div
                  key={bookmark.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`p-6 rounded-2xl shadow-lg border-2 transition ${
                    darkMode
                      ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-40"
                      : "bg-white border-[#e8cdb8]"
                  }`}
                >
                  <h3 className="font-bold text-lg mb-3 line-clamp-2">{bookmark.title}</h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    className={`block text-sm underline font-semibold mb-4 break-words line-clamp-2 transition ${
                      darkMode ? "text-[#a8d5ff] hover:text-[#f5e6d3]" : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    {bookmark.url}
                  </a>
                  <p className={`font-semibold mb-5 text-sm ${darkMode ? "text-[#d4c5b0]" : "text-[#7a5a3a]"}`}>
                    📂 {bookmark.category || "Uncategorized"}
                  </p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBookmark(bookmark)}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition border-2 ${
                        darkMode
                          ? "border-[#f5e6d3] text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#5c3a21]"
                          : "border-[#5c3a21] text-[#5c3a21] hover:bg-[#5c3a21] hover:text-white"
                      }`}
                    >
                      View
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(bookmark)}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition border-2 ${
                        darkMode
                          ? "border-[#f5e6d3] text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#5c3a21]"
                          : "border-[#5c3a21] text-[#5c3a21] hover:bg-[#5c3a21] hover:text-white"
                      }`}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="flex-1 px-3 py-2 rounded-lg font-semibold transition border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* WEEKLY CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-8 rounded-2xl shadow-lg border-2 mb-10 ${
            darkMode
              ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-30"
              : "bg-[#faf5f0] border-[#e8cdb8]"
          }`}
        >
          <h2 className="text-2xl font-bold mb-6">📊 Weekly Activity</h2>
          <div className="w-full h-72">
            <ResponsiveContainer>
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" stroke={darkMode ? "#f5e6d3" : "#5c3a21"} />
                <YAxis stroke={darkMode ? "#f5e6d3" : "#5c3a21"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#4b2e1e" : "#faf5f0",
                    border: `2px solid ${darkMode ? "#f5e6d3" : "#5c3a21"}`,
                  }}
                />
                <Bar dataKey="value" fill="#5c3a21" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* USER REVIEWS - SCROLLING CAROUSEL */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-16 pt-12 border-t-2"
          style={{ borderTopColor: darkMode ? "#f5e6d3" : "#e8cdb8" }}
        >
          <h2 className="text-2xl font-bold mb-8 text-center">💬 What Our Users Say</h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full overflow-hidden"
          >
            <motion.div
              animate={{ x: [500, -500] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="flex gap-6 pb-6"
            >
              {[
                {
                  name: "Sarah M.",
                  role: "Content Creator",
                  text: "Smart Bookmark changed how I organize my research. Finding saved articles is instant!",
                  icon: "👩‍💼",
                },
                {
                  name: "Alex K.",
                  role: "Software Engineer",
                  text: "Finally, a bookmark manager that actually works. Clean, fast, and intuitive.",
                  icon: "👨‍💻",
                },
                {
                  name: "Emma L.",
                  role: "Student",
                  text: "No more lost tabs! This app keeps my study materials perfectly organized.",
                  icon: "👩‍🎓",
                },
                {
                  name: "James R.",
                  role: "Product Manager",
                  text: "The best bookmark tool I've used. The UI is beautiful and the functionality is excellent.",
                  icon: "👨‍💼",
                },
                {
                  name: "Lisa Chen",
                  role: "Marketing Specialist",
                  text: "Saves me hours every week. I can't imagine managing bookmarks without Smart Bookmark now!",
                  icon: "👩‍💻",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className={`flex-shrink-0 w-80 p-6 rounded-2xl backdrop-blur-md border-2 shadow-lg ${
                    darkMode
                      ? "bg-[#5c3a21] bg-opacity-40 border-[#f5e6d3]"
                      : "bg-white bg-opacity-60 border-[#e8cdb8]"
                  }`}
                >
                  <div className="text-4xl mb-3">{testimonial.icon}</div>
                  <p className="font-semibold mb-1 text-lg">{testimonial.name}</p>
                  <p
                    className={`text-xs mb-4 font-medium ${
                      darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"
                    }`}
                  >
                    {testimonial.role}
                  </p>
                  <p className={`text-sm italic ${darkMode ? "text-[#f5e6d3]" : "text-[#4b2e1e]"}`}>
                    "{testimonial.text}"
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* BOOKMARK DETAILS MODAL */}
        {selectedBookmark && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBookmark(null)}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl shadow-2xl border-2 max-w-2xl w-full p-8 ${
                darkMode
                  ? "bg-[#5c3a21] border-[#f5e6d3]"
                  : "bg-[#faf5f0] border-[#e8cdb8]"
              }`}
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBookmark(null)}
                className={`absolute top-4 right-4 text-2xl font-bold transition ${
                  darkMode ? "text-[#f5e6d3] hover:text-[#FFB526]" : "text-[#5c3a21] hover:text-[#FFB526]"
                }`}
              >
                ✕
              </motion.button>

              {/* Modal Content */}
              <div className="mt-6">
                <h1 className="text-3xl font-bold mb-6">{selectedBookmark.title}</h1>

                {/* URL Section */}
                <div className="mb-6">
                  <p className={`font-semibold mb-2 text-sm ${darkMode ? "text-[#d4c5b0]" : "text-[#7a5a3a]"}`}>
                    🔗 URL:
                  </p>
                  <a
                    href={selectedBookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 rounded-lg font-semibold transition border-2"
                    style={{
                      borderColor: "#FFB526",
                      color: "#FFB526",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFB526";
                      e.currentTarget.style.color = "#2d1d0f";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#FFB526";
                    }}
                  >
                    Open Link →
                  </a>
                  <p className={`mt-2 break-all text-sm ${darkMode ? "text-[#e8d8c3]" : "text-[#5c3a21]"}`}>
                    {selectedBookmark.url}
                  </p>
                </div>

                {/* Category Section */}
                <div className="mb-6">
                  <p className={`font-semibold mb-2 text-sm ${darkMode ? "text-[#d4c5b0]" : "text-[#7a5a3a]"}`}>
                    📂 Category:
                  </p>
                  <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                    darkMode
                      ? "bg-[#4b2e1e] text-[#f5e6d3] border-2 border-[#f5e6d3]"
                      : "bg-[#e8d8c3] text-[#5c3a21] border-2 border-[#5c3a21]"
                  }`}>
                    {selectedBookmark.category || "Uncategorized"}
                  </span>
                </div>

                {/* Created Date Section */}
                {selectedBookmark.created_at && (
                  <div className="mb-6">
                    <p className={`font-semibold mb-2 text-sm ${darkMode ? "text-[#d4c5b0]" : "text-[#7a5a3a]"}`}>
                      📅 Created:
                    </p>
                    <p className={`text-sm ${darkMode ? "text-[#e8d8c3]" : "text-[#5c3a21]"}`}>
                      {new Date(selectedBookmark.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleEdit(selectedBookmark);
                      setSelectedBookmark(null);
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold transition border-2 ${
                      darkMode
                        ? "border-[#FFB526] text-[#FFB526] hover:bg-[#FFB526] hover:text-[#2d1d0f]"
                        : "border-[#FFB526] text-[#FFB526] hover:bg-[#FFB526] hover:text-[#2d1d0f]"
                    }`}
                  >
                    ✏️ Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      deleteBookmark(selectedBookmark.id);
                      setSelectedBookmark(null);
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold transition border-2 ${
                      darkMode
                        ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-[#2d1d0f]"
                        : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    }`}
                  >
                    🗑️ Delete
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedBookmark(null)}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold transition border-2 ${
                      darkMode
                        ? "border-[#f5e6d3] text-[#f5e6d3] hover:bg-[#f5e6d3] hover:text-[#5c3a21]"
                        : "border-[#5c3a21] text-[#5c3a21] hover:bg-[#5c3a21] hover:text-white"
                    }`}
                  >
                    ✕ Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
