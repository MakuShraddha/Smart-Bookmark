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
        console.log("User signed in, redirecting to /");
        router.push("/");
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
          <img
            src="https://www.vecteezy.com/png/42165816-google-logo-transparent-png"
            alt="Google Logo"
            className="w-6 h-6"
          />
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
