"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Login() {
  const [darkMode, setDarkMode] = useState(false);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <div
      className={`flex items-center justify-center min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800 text-[#f5e6d3]"
          : "bg-gradient-to-br from-[#f5e6d3] to-[#e8d8c3] text-[#4b2e1e]"
      }`}
    >
      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 border-2 rounded-lg font-semibold transition hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border-2 border-[#5c3a21] max-w-md w-full text-center`}
      >
        <h1 className="text-4xl font-extrabold mb-4 text-[#5c3a21] dark:text-[#f5e6d3]">
          Smart Bookmark
        </h1>
        <p className="mb-8 font-semibold text-[#5c3a21] dark:text-[#f5e6d3]">
          Organize your bookmarks efficiently and access them anytime!
        </p>

        <button
          onClick={handleLogin}
          className="flex items-center justify-center gap-3 w-full bg-white dark:bg-gray-700 text-[#5c3a21] dark:text-[#f5e6d3] px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="Google Logo"
            className="w-6 h-6"
          />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
