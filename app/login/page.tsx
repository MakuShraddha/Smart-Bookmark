<<<<<<< HEAD
"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Login() {
  const [darkMode, setDarkMode] = useState(false);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
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
=======
"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const quotes = [
  "Organize your thoughts, amplify your ideas",
  "Save what matters, find it faster",
  "A bookmark today, inspiration tomorrow",
  "Never lose track of your best finds",
  "Collect. Organize. Discover.",
  "Your digital memory, perfected",
  "Smart saving, smarter searching",
];

export default function Login() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        if (!session.user.user_metadata?.avatar_url) {
          await setDefaultAvatar();
        }
        router.push("/");
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  async function setDefaultAvatar() {
    const defaultAvatarSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzVjM2EyMSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjcwIiByPSIyNSIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNIDUwIDE0MCBRIDUwIDExMCA3NSAxMTAgTCAxMjUgMTEwIFEgMTUwIDExMCAxNTAgMTQwIFogZmlsbD0id2hpdGUiLz48L3N2Zz4=";
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: defaultAvatarSvg },
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
    }
  }

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const testimonials = [
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
  ];

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen transition-all duration-500 py-10 ${
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
        className={`max-w-md w-full p-10 rounded-3xl bg-[#faf5f0] dark:bg-[#6b4a2f] border border-[#e8cdb8] dark:border-[#5c3a21] shadow-xl backdrop-blur-md`}
      >
        <h1 className="text-4xl font-extrabold mb-3 text-center text-[#5c3a21] dark:text-[#f5e6d3]">
          Smart Bookmark
        </h1>
        
        {/* Animated Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm font-medium mb-8 text-[#5c3a21] dark:text-[#f5e6d3]"
        >
          Organize and access your bookmarks efficiently anytime, anywhere.
        </motion.p>

        {/* Rotating Motivational Quotes */}
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="mb-8 p-4 rounded-xl bg-gradient-to-r from-[#f5e6d3] to-[#e8d8c3] dark:from-gray-800 dark:to-gray-700 border-l-4 border-[#5c3a21] dark:border-[#f5e6d3]"
        >
          <p className="text-center text-sm italic font-semibold text-[#5c3a21] dark:text-[#f5e6d3]">
            "{quotes[currentQuote]}"
          </p>
        </motion.div>

        {/* Animated Call-to-Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-center text-xs font-medium text-[#5c3a21] dark:text-[#f5e6d3] mb-4">
            Get started in seconds
          </p>
        </motion.div>

        {/* Google Login Button with Enhanced Logo */}
        <motion.button
          onClick={handleLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-[#5c3a21] dark:text-[#f5e6d3] font-bold shadow-md hover:shadow-lg transition"
        >
          {/* Google Logo SVG */}
          <svg
            width="20"
            height="20"
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
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continue with Google
        </motion.button>

        {/* Motivational Bottom Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-xs text-[#5c3a21] dark:text-[#f5e6d3] opacity-70"
        >
          🔐 Secure • 🚀 Fast • 📚 Smart
        </motion.p>
      </motion.div>

      {/* User Reviews Grid - Bottom with Right-to-Left Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="w-full max-w-5xl mt-12 overflow-hidden"
      >
        <motion.div
          animate={{ x: [500, -500] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-6 pb-4"
        >
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className={`flex-shrink-0 w-80 p-6 rounded-2xl backdrop-blur-md border ${
                darkMode
                  ? "bg-gray-800 bg-opacity-50 border-gray-700"
                  : "bg-white bg-opacity-50 border-[#e8cdb8]"
              }`}
            >
              <div className="text-4xl mb-3">{testimonial.icon}</div>
              <p className="text-sm font-semibold mb-1">{testimonial.name}</p>
              <p
                className={`text-xs mb-3 ${
                  darkMode ? "text-gray-400" : "text-[#5c3a21] text-opacity-60"
                }`}
              >
                {testimonial.role}
              </p>
              <p className="text-sm italic">{testimonial.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
>>>>>>> 64c055e11a3bf6f00694f1cf8d69cb7d377b95b7
