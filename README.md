# Smart-Bookmark 📚✨

Smart-Bookmark is a modern web application built with **Next.js** and **Supabase** that helps users manage, organize, and visualize bookmarks efficiently. The app features authentication, a dynamic dashboard, and interactive UI components for a seamless experience.

---

## 🚀 Features

- **User Authentication:** Sign in using Google OAuth via Supabase.
- **Bookmark Management:** Add, edit, delete, and categorize bookmarks.
- **Data Visualization:** Interactive charts to track bookmark usage.
- **Responsive Design:** Optimized for desktop, tablet, and mobile.
- **Modern UI:** Clean, professional interface following current trends.

---

## 🛠️ Technologies Used

- **Frontend:** Next.js 13, React 18, Tailwind CSS
- **Backend & Auth:** Supabase (PostgreSQL + Auth)
- **Data Visualization:** Recharts
- **Deployment:** Vercel

---

## 🔧 Challenges & Solutions

1. **OAuth Redirect Issues**
   - **Problem:** Google OAuth login was not redirecting correctly to the dashboard.
   - **Solution:** Configured `redirectTo` in Supabase OAuth to `window.location.origin + "/app/page"` and updated Vercel environment variables.

2. **Responsive UI Design**
   - **Problem:** Layout was cluttered on mobile devices.
   - **Solution:** Rebuilt components with Tailwind CSS responsive classes for a smooth mobile experience.

3. **Dynamic Bookmark CRUD**
   - **Problem:** Keeping bookmark state real-time with Supabase.
   - **Solution:** Used React hooks (`useState`, `useEffect`) with Supabase subscriptions for live updates without page reloads.

---

## ⚡ Getting Started

1. Install dependencies:
   ```bash
      npm install
   
2. Create a .env file with your Supabase keys:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
3. Run the development server:
      npm run dev

4. Open http://localhost:3000 to view the app.

## 🌟 Future Enhancements

   Tag-based bookmark filtering
   Export/import bookmarks in CSV or JSON
   Dark mode toggle
   Advanced analytics dashboard
   
## 📌 Project Links

   Repository: https://github.com/MakuShraddha/Smart-Bookmark
   Live Demo: https://smart-bookmark-indol.vercel.app/login
