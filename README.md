# SolarCare Application

A comprehensive solar system management platform for customers, technicians, and administrators.

## 🚀 Quick Start

### Prerequisites
*   Node.js (v18+)
*   Supabase Account & Project
*   `.env` file configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The app will open at `http://localhost:5173` (or the next available port).

## 🛠️ Tech Stack
*   **Frontend**: React + Vite
*   **Styling**: Tailwind CSS
*   **Backend**: Supabase (Auth, Database, Storage)
*   **Icons**: Lucide React
*   **Router**: React Router DOM

## 🔐 Credentials (Demo)
*   **Admin**: (Create via Supabase Auth, set role to 'admin' in `profiles` table)
*   **Technician**: (Create via Supabase Auth, set role to 'technician' in `profiles` table)
*   **Customer**: Pre-register via Admin Dashboard, then sign up.

## 📂 Project Structure
*   `src/pages`: Main application views
*   `src/components`: Reusable UI components
*   `src/context`: Global state (Auth, Toast)
*   `src/lib`: Database configuration
