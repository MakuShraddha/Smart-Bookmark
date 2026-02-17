"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic imports for Recharts (SSR disabled)
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAbout, setEditAbout] = useState("");
  const [loading, setLoading] = useState(false);

  // Get user on mount
  useEffect(() => {
    getUser();
  }, []);

  // Fetch stats when user is available
  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login"); // redirect if not logged in
    } else {
      setUser(data.user);
      setEditName(data.user.user_metadata?.full_name || "");
      setEditAbout(data.user.user_metadata?.about || "");
    }
  }

  async function fetchStats() {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setTotalBookmarks(data.length);

    const uniqueCategories = [...new Set(data.map((item) => item.category))];
    setTotalCategories(uniqueCategories.length);

    // Weekly chart data
    const last7Days: any = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      last7Days[key] = 0;
    }

    data.forEach((item) => {
      const created = new Date(item.created_at);
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleSaveProfile() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
          about: editAbout,
        },
      });

      if (error) {
        alert("Error updating profile: " + error.message);
        setLoading(false);
        return;
      }

      // Update the user state
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: editName,
          about: editAbout,
        },
      });

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div
      className={`min-h-screen p-6 transition-all duration-500 ${
        darkMode
          ? "bg-[#1e1b18] text-[#f5e6d3]"
          : "bg-gradient-to-br from-[#f5e6d3] to-[#e8d8c3] text-[#4b2e1e]"
      }`}
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <h1 className="text-3xl font-extrabold">👤 My Profile & Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              {darkMode ? "☀ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* USER INFO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-8 rounded-2xl shadow-md border-2 mb-10 ${
            darkMode
              ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-40"
              : "bg-[#fffaf3] border-[#5c3a21]"
          }`}
        >
          <div className="text-center">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#5c3a21] to-[#4b2e1e] flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-[#fffaf3]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}

            {!isEditing ? (
              // View Mode
              <>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-[#f5e6d3]" : "text-[#5c3a21]"}`}>
                  {user.user_metadata?.full_name || "Anonymous"}
                </h2>
                <p className={`mb-3 ${darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"}`}>{user.email}</p>

                {user.user_metadata?.about && (
                  <p className={`mb-6 italic text-sm ${darkMode ? "text-[#e8d8c3]" : "text-[#4b2e1e]"}`}>
                    "{user.user_metadata.about}"
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className={`px-6 py-2 rounded-lg font-semibold transition border-2 mb-6 ${
                    darkMode
                      ? "border-[#FFB526] text-[#FFB526] hover:bg-[#FFB526] hover:text-[#2d1d0f]"
                      : "border-[#FFB526] text-[#FFB526] hover:bg-[#FFB526] hover:text-[#2d1d0f]"
                  }`}
                >
                  ✏️ Edit Profile
                </motion.button>
              </>
            ) : (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"}`}>
                    Full Name
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full p-3 rounded-lg border-2 font-semibold focus:ring-2 transition ${
                      darkMode
                        ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3] placeholder:text-[#d4c5b0] focus:ring-[#f5e6d3]"
                        : "bg-white border-[#5c3a21] text-[#5c3a21] placeholder:text-[#a08570] focus:ring-[#5c3a21]"
                    }`}
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"}`}>
                    About You
                  </label>
                  <motion.textarea
                    whileFocus={{ scale: 1.02 }}
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    rows={3}
                    className={`w-full p-3 rounded-lg border-2 font-semibold focus:ring-2 transition resize-none ${
                      darkMode
                        ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3] placeholder:text-[#d4c5b0] focus:ring-[#f5e6d3]"
                        : "bg-white border-[#5c3a21] text-[#5c3a21] placeholder:text-[#a08570] focus:ring-[#5c3a21]"
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className={`flex-1 px-6 py-2 rounded-lg font-semibold transition border-2 ${
                      darkMode
                        ? "border-green-400 text-green-400 hover:bg-green-400 hover:text-[#2d1d0f]"
                        : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Saving..." : "💾 Save"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user.user_metadata?.full_name || "");
                      setEditAbout(user.user_metadata?.about || "");
                    }}
                    disabled={loading}
                    className={`flex-1 px-6 py-2 rounded-lg font-semibold transition border-2 ${
                      darkMode
                        ? "border-red-400 text-red-400 hover:bg-red-400 hover:text-[#2d1d0f]"
                        : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    ✕ Cancel
                  </motion.button>
                </div>
              </div>
            )}

            <div className={`grid md:grid-cols-3 gap-4 mt-6 ${isEditing ? "mt-8" : ""}`}>
              <div className={`p-3 rounded-lg border-2 font-semibold ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3]"
                  : "bg-white border-[#5c3a21] text-[#5c3a21]"
              }`}>
                <span className={`block font-bold text-sm mb-1 ${darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"}`}>User ID</span>
                {user.id}
              </div>
              <div className={`p-3 rounded-lg border-2 font-semibold ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3]"
                  : "bg-white border-[#5c3a21] text-[#5c3a21]"
              }`}>
                <span className={`block font-bold text-sm mb-1 ${darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"}`}>Account Created</span>
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div className={`p-3 rounded-lg border-2 font-semibold ${
                darkMode
                  ? "bg-[#3d2817] border-[#f5e6d3] text-[#f5e6d3]"
                  : "bg-white border-[#5c3a21] text-[#5c3a21]"
              }`}>
                <span className={`block font-bold text-sm mb-1 ${darkMode ? "text-[#d4c5b0]" : "text-[#5c3a21]"}`}>Last 7 Days</span>
                {weeklyData.reduce((acc, cur) => acc + cur.value, 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* STATS CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl shadow-md border-2 ${
              darkMode
                ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-40"
                : "bg-[#fffaf3] border-[#5c3a21]"
            }`}
          >
            <h3 className={`font-bold mb-2 ${darkMode ? "text-[#f5e6d3]" : "text-[#5c3a21]"}`}>Total Bookmarks</h3>
            <p className={`text-3xl font-extrabold ${darkMode ? "text-[#FFB526]" : "text-[#5c3a21]"}`}>{totalBookmarks}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl shadow-md border-2 ${
              darkMode
                ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-40"
                : "bg-[#fffaf3] border-[#5c3a21]"
            }`}
          >
            <h3 className={`font-bold mb-2 ${darkMode ? "text-[#f5e6d3]" : "text-[#5c3a21]"}`}>Categories</h3>
            <p className={`text-3xl font-extrabold ${darkMode ? "text-[#FFB526]" : "text-[#5c3a21]"}`}>{totalCategories}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl shadow-md border-2 ${
              darkMode
                ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-40"
                : "bg-[#fffaf3] border-[#5c3a21]"
            }`}
          >
            <h3 className={`font-bold mb-2 ${darkMode ? "text-[#f5e6d3]" : "text-[#5c3a21]"}`}>Last 7 Days</h3>
            <p className={`text-3xl font-extrabold ${darkMode ? "text-[#FFB526]" : "text-[#5c3a21]"}`}>
              {weeklyData.reduce((acc, cur) => acc + cur.value, 0)}
            </p>
          </motion.div>
        </div>

        {/* WEEKLY CHART */}
        <motion.div className={`p-8 rounded-2xl shadow-md border-2 ${
          darkMode
            ? "bg-[#5c3a21] border-[#f5e6d3] bg-opacity-40"
            : "bg-[#fffaf3] border-[#5c3a21]"
        }`}>
          <h2 className={`text-xl font-bold mb-6 ${darkMode ? "text-[#f5e6d3]" : "text-[#5c3a21]"}`}>Weekly Bookmark Activity</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" stroke={darkMode ? "#f5e6d3" : "#5c3a21"} />
                <YAxis stroke={darkMode ? "#f5e6d3" : "#5c3a21"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#4b2e1e" : "#fff",
                    borderColor: "#FFB526",
                    color: darkMode ? "#f5e6d3" : "#5c3a21",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#FFB526" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
