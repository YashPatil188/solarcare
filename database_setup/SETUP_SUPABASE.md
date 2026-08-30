# 🔌 How to Connect Supabase (Step-by-Step)

Follow these steps to connect your SolarCare app to a live Supabase backend.

## 1. Create a Supabase Project
1.  Go to [database.new](https://database.new) and sign in with GitHub.
2.  Click **"New Project"**.
3.  Enter a **Name** (e.g., `SolarCare`).
4.  Set a **Database Password** (Make sure to save this!).
5.  Choose a **Region** close to you.
6.  Click **"Create new project"**.

## 2. Get API Credentials
Once your project is created (it takes a minute):
1.  Go to **Project Settings** (Cog icon at the bottom left).
2.  Click on **API** in the sidebar.
3.  Look for the **Project URL** and **anon public key**.

## 3. Configure Local Environment
1.  In your project folder (`c:\Users\yash6\Desktop\nyvion phase1\solarcare`), create a new file named `.env`.
2.  Paste the following content, replacing the placeholders with your actual keys from Step 2:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Note:** Do NOT use the `service_role` key. Use the `anon` key.

## 4. Setup Database Schema
1.  Open your project in Supabase Dashboard.
2.  Click on **SQL Editor** (Icon looking like `>_` on the left sidebar).
3.  Click **"New query"**.
4.  Copy the entire content of the `supabase_schema.sql` file located in your project folder.
5.  Paste it into the Supabase SQL Editor.
6.  Click **"Run"** (Bottom right).

## 5. Setup Storage (Images)
1.  Go to **Storage** (Folder icon in sidebar).
2.  Click **"New Bucket"**.
3.  Name it `service-photos`.
4.  Toggle **"Public bucket"** to ON.
5.  Click **"Save"**.

## 6. Restart App
1.  Stop the terminal command (Ctrl + C).
2.  Run `npm run dev` again.
3.  Open the link provided (e.g., `http://localhost:5173`).

---

## ✅ Verification
*   Go to **Sign Up**.
*   Since the app has "Controlled Onboarding", you first need to add a customer manually via SQL or Admin Dashboard.
*   **Quick Test:** Go to SQL Editor in Supabase and run:
    ```sql
    INSERT INTO customers_master (name, email, system_capacity_kw, amc_status)
    VALUES ('Test User', 'test@example.com', 5.5, 'active');
    ```
*   Now Sign Up with `test@example.com`. It should work!
