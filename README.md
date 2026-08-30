# ☀️ SolarCare — Solar Energy Asset & Maintenance Platform

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Google Gemini AI](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google)](https://ai.google.dev/)

**SolarCare** is a production-ready, cross-platform solar asset management ecosystem designed for **Customers**, **Technicians**, and **Administrators**. It streamlines solar panel maintenance, real-time ticket tracking, Annual Maintenance Contracts (AMC), and features an **AI-powered troubleshooting assistant** driven by Google Gemini 2.0.

---

## ✨ Key Features

### 👤 Role-Based Portals
- **Customer Portal**: Track solar energy output, raise maintenance tickets, schedule AMC visits, view live status timelines, and chat with AI Support.
- **Technician Portal**: View assigned field jobs, update ticket progress, upload photo evidence, call customers directly, and manage task status.
- **Admin Portal**: User onboarding (Customers, Technicians, Admins), directory management, ticket assignment, AMC approvals, and system analytics.

### 🤖 Gemini AI Support Assistant
- Intelligent diagnostic chatbot for solar inverter faults, panel degradation, and battery issues.
- Automatic ticket generation & escalation when complex hardware issues are detected.
- Multilingual support for global and regional user bases.

### 📱 Cross-Platform (Web & Android Mobile)
- Web Application built with React & Vite.
- Native Android Mobile App integration via Capacitor JS (`/android`).

### 🔒 Enterprise Security & Realtime DB
- Row-Level Security (RLS) policies on Supabase PostgreSQL.
- Pre-onboarded profile role inheritance and secure email-first authentication.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion, i18next |
| **Mobile Integration** | Capacitor JS, Android SDK |
| **Backend & DB** | Supabase (PostgreSQL, Realtime, Auth, Storage, RLS Policies) |
| **AI Engine** | Google Gemini 2.0 API (`@google/generative-ai`) |

---

## 📂 Repository Structure

```
Solarcare (Final)/
├── android/               # Native Android Studio project (Capacitor)
├── database_setup/        # SQL Migrations, RLS Policies, & Supabase schema
│   ├── MIGRATION_V10_PRESERVE_ONBOARDED_PROFILES.sql
│   ├── MIGRATION_V11_RLS_POLICIES.sql
│   ├── PURGE_TEST_EMAILS.sql
│   └── supabase_schema.sql
├── docs/                  # Architecture docs, system diagrams, & research reports
│   ├── figures/           # Architecture & flow diagrams
│   └── SolarCare_Architecture.md
├── src/                   # React Frontend Application
│   ├── components/        # UI & Auth Layout components
│   ├── context/           # Global Auth & Toast state
│   ├── pages/             # Customer, Tech & Admin Dashboards
│   ├── services/          # Supabase & Gemini API service layers
│   └── utils/             # Phone & text formatting helpers
├── .env.example           # Environment template (NO secrets stored)
├── capacitor.config.json  # Capacitor mobile configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Supabase Account**: Active project with database enabled
- **Google Gemini API Key**: [Get API Key](https://aistudio.google.com/)

---

### 1. Installation

```bash
# Clone repository
git clone https://github.com/YashPatil188/solarcare.git
cd solarcare

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** The `.env` file is excluded from Git via `.gitignore` to prevent secret exposure.

---

### 3. Run Web Application

```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### 4. Build Android Mobile App

```bash
# Build production web bundle
npm run build

# Sync Capacitor assets with Android
npx cap sync android

# Open project in Android Studio
npx cap open android
```

---

## 🗄️ Database Setup

All database migrations and RLS policies are located in `database_setup/`:

1. Run `database_setup/supabase_schema.sql` in your Supabase SQL Editor to initialize core tables.
2. Execute `database_setup/MIGRATION_V11_RLS_POLICIES.sql` to configure Row-Level Security policies.
3. Execute `database_setup/MIGRATION_V10_PRESERVE_ONBOARDED_PROFILES.sql` for automated onboarding role triggers.

---

## 📜 License & Acknowledgments

Built for efficient solar energy asset management and smart field operations.
