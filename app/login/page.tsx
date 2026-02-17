"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Login() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Auth state listener mounted");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, "Session:", session);
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, redirecting to /#");
        window.location.href = "/#";
      }
    });
    return () => subscription?.unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div
      className={`flex items-center justify-center min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-[#f5e6d3]"
          : "bg-gradient-to-br from-[#fdf6e3] via-[#f5e6d3] to-[#e8d8c3] text-[#4b2e1e]"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full p-10 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-md`}
      >
        <h1 className="text-4xl font-extrabold mb-3 text-center text-[#5c3a21] dark:text-[#f5e6d3]">
          Smart Bookmark
        </h1>
        <p className="text-center text-sm font-medium mb-8 text-[#5c3a21] dark:text-[#f5e6d3]">
          Organize and access your bookmarks efficiently anytime, anywhere.
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-[#5c3a21] dark:text-[#f5e6d3] font-bold shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
