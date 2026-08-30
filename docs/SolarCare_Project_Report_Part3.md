# CHAPTER 5 – SYSTEM DESIGN

## 5.1 System Architecture

SolarCare follows a Modern Serverless Architecture, combining a high-performance React Single-Page Application (SPA) frontend with Supabase as a fully managed Backend-as-a-Service (BaaS). This architectural pattern eliminates the need for a traditional custom API server layer, significantly reducing infrastructure complexity while maintaining enterprise-grade capabilities.

The architecture can be conceptually divided into four layers:

**Layer 1 – Client Layer (Users):**
Three distinct client types interact with the system. Admin users access the platform through a standard web browser on a desktop or laptop. Customer users access the platform through a mobile browser or a Progressive Web App (PWA). Technician users access a Capacitor-packaged native Android application.

**Layer 2 – Frontend Layer (React + Vite):**
The entire application logic resides in a React 19 Single-Page Application bundled by Vite. This layer manages client-side routing via React Router DOM, global state management via Context API (AuthContext and ToastContext), and UI rendering via Tailwind CSS 4 components. The Capacitor bridge allows the web application to run inside a native Android WebView with access to device hardware such as the camera and file system.

**Layer 3 – Backend Layer (Supabase):**
Supabase serves as the complete backend infrastructure. It provides:
- **Auth Service**: JWT-based authentication with email/password sign-in, session management, and secure token refresh cycles.
- **PostgreSQL Database**: A fully relational database storing all application data across nine tables. Database-level Row-Level Security (RLS) policies enforce access control directly at the data layer.
- **SQL Triggers and Functions**: Automated database functions (e.g., `handle_new_user()`) that execute business logic upon data events without requiring application-level orchestration.
- **File Storage (S3-Compatible)**: A bucket-based object storage system for service-related media — technician completion photos, voice notes, and ticket attachments.

**Layer 4 – AI Layer (Google Gemini):**
The AI Chat module communicates directly with the Google Gemini API from the frontend using the `@google/generative-ai` SDK. Conversation history is persisted to the Supabase `chatbot_conversations` and `chatbot_messages` tables, enabling cross-session context continuity.

### System Architecture Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  [Admin - Web Browser] [Customer - PWA] [Tech - Android]│
└──────────────────┬──────────────────────────────────────┘
                   │ HTTPS / TLS
┌──────────────────▼──────────────────────────────────────┐
│              FRONTEND LAYER (React 19 + Vite)           │
│  ┌───────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │  Routing  │ │ Context API  │ │  Tailwind CSS UI   │  │
│  │  (RRD v7) │ │Auth + Toast  │ │  Components        │  │
│  └───────────┘ └──────────────┘ └────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Capacitor Bridge (Android WebView)       │   │
│  └──────────────────────────────────────────────────┘   │
└──────┬─────────────────────────────────────┬────────────┘
       │ Supabase JS Client                  │ Gemini API
┌──────▼──────────────────────┐   ┌──────────▼────────────┐
│    BACKEND LAYER (Supabase) │   │  AI LAYER (Gemini)    │
│  ┌──────────┐ ┌───────────┐ │   │  - Chat Completions   │
│  │Auth/JWT  │ │PostgreSQL │ │   │  - Solar Knowledge    │
│  └──────────┘ │  + RLS    │ │   │    Base Prompting     │
│               └───────────┘ │   └───────────────────────┘
│  ┌──────────┐ ┌───────────┐ │
│  │ Storage  │ │ SQL Funcs │ │
│  │(S3 Buckt)│ │& Triggers │ │
│  └──────────┘ └───────────┘ │
└─────────────────────────────┘
```

## 5.2 Flowchart Explanation

### 5.2.1 User Authentication Flow

The authentication flow begins when a user navigates to the application's root URL. The `RootRedirect` component checks for an active Supabase session. If no session exists, the user is redirected to the `/login` page. Upon submitting credentials, Supabase Auth validates the email and password against the `auth.users` table. On successful validation, a JWT access token and refresh token are issued and stored in the browser's local storage. The `AuthContext` provider listens for the `onAuthStateChange` event, reads the user's `role` from the `profiles` table, and stores it in global state. The `ProtectedRoute` component then reads this role and redirects the user to their appropriate dashboard: `/customer-dashboard`, `/admin-dashboard`, or `/technician-dashboard`. If the role does not match the route's `allowedRoles`, the user is redirected back to the root.

### 5.2.2 Service Ticket Lifecycle Flow

Step 1 (Registration): A customer navigates to the Services page and selects a service type. A service-specific modal opens, collects the required information, and calls `ticketService.createTicket()`, which inserts a new row into the `tickets` table with status `raised`.

Step 2 (Admin Assignment): The admin views the ticket on their dashboard's Tickets tab and selects a technician from a dropdown. This triggers `ticketService.updateTicket()` which updates `assigned_technician_id` and sets status to `assigned`.

Step 3 (Field Execution): The technician sees the assigned ticket on their dashboard, clicks "Start Work," which updates status to `in_progress`. After completing the work, the technician fills in remarks, selects a photo, and clicks "Submit Completion." The app uploads the photo to Supabase Storage, creates a `ticket_updates` record, and updates the ticket status to `completed` with the photo URL appended to the `photos` JSONB array.

Step 4 (Closure): The admin reviews the completed ticket, sees the technician's remarks and photo proof, and clicks "Close Ticket," updating the status to `closed`. The full lifecycle is complete.

### 5.2.3 AI Chat to Ticket Escalation Flow

Step 1: The customer opens the AI Chat page. If no active conversation exists, `startNewConversation()` creates a new `chatbot_conversations` record in the database.

Step 2: The customer types a message. `sendMessage()` appends the user message to the `chatbot_messages` table, then calls the Google Gemini API with the full conversation history and a system prompt containing the solar domain knowledge base.

Step 3: The Gemini API response is streamed back, displayed in the chat interface, and saved to `chatbot_messages` as an `assistant` role message.

Step 4: The AI response is analyzed by the `useChat` hook. If the response contains a ticket-creation signal (based on keywords and context), a `pendingTicket` state object is populated with AI-extracted issue details and displayed as a `TicketPrompt` card above the chat input.

Step 5: The customer clicks "Create Ticket." `createTicketFromChat()` calls `ticketService.createTicket()` with the AI-generated ticket data, and updates the `chatbot_conversations` record status to `converted_to_ticket`.

## 5.3 Data Flow Diagrams (DFD)

### 5.3.1 DFD Level 0 – Context Diagram

The Level 0 DFD represents the SolarCare system as a single process interacting with three external entities.

- **Customer** sends service requests, chat messages, and AMC subscription requests TO the SolarCare System, and receives service status updates, AI responses, and AMC information FROM the system.
- **Technician** sends ticket status updates, completion remarks, and proof photos TO the system, and receives assigned ticket details FROM the system.
- **Administrator** sends customer pre-registration data, technician assignments, ticket closures, and AMC approvals TO the system, and receives operational statistics, customer database, and all ticket data FROM the system.
- **Google Gemini AI** receives conversation history and system prompts FROM the system, and returns AI-generated responses TO the system.

### 5.3.2 DFD Level 1 – Main Processes

The Level 1 DFD decomposes the SolarCare system into five major processes:

**Process 1.0 – Authentication and Authorization:** Receives credentials from all user types. Validates against Supabase Auth. Issues JWT tokens. Reads user role from Profiles data store. Outputs role-specific session to the appropriate process.

**Process 2.0 – Ticket Management:** Receives service requests from Customer, assignment commands from Administrator, and status updates from Technician. Reads/writes to the Tickets data store and Ticket Updates data store. Outputs current ticket status to Customer and Technician. Outputs all tickets to Administrator.

**Process 3.0 – AI Chat Support:** Receives chat messages from Customer. Reads conversation history from Chatbot Conversations and Chatbot Messages data stores. Sends prompts to Google Gemini AI external entity. Receives AI responses. Outputs responses to Customer. When escalation is triggered, outputs to Process 2.0.

**Process 4.0 – AMC Management:** Receives subscription requests from Customer and approval commands from Administrator. Reads/writes to AMC Subscriptions and AMC Plans data stores. Outputs plan information and subscription status to Customer. Outputs pending requests to Administrator.

**Process 5.0 – User and Customer Management:** Receives pre-registration data and verification commands from Administrator. Reads/writes to Customers Master and Profiles data stores. Triggers Profile and Solar System record creation upon customer registration (via database trigger).

### 5.3.3 DFD Level 2 – Ticket Management Process Detail

The Ticket Management process (2.0) is further decomposed into four sub-processes:

**Process 2.1 – Create Ticket:** Customer → service details → validate system ownership (via Solar Systems data store) → insert ticket record → Tickets data store.

**Process 2.2 – Assign Ticket:** Administrator → technician selection → update ticket record (assigned_technician_id, status) → Tickets data store → notify Technician dashboard.

**Process 2.3 – Execute and Document Ticket:** Technician → start work (status: in_progress) → complete work with remarks and photo → upload photo to Storage data store → create Ticket Update record → update Ticket record (status: completed, photos array).

**Process 2.4 – Close Ticket:** Administrator → review completion evidence → update ticket status to closed → Tickets data store → Customer can view final status via Ticket Tracker.

## 5.4 Module Explanations

### 5.4.1 Authentication and Authorization Module

This module is implemented across the `AuthContext.jsx` context provider, the `ProtectedRoute.jsx` component, and the `RootRedirect.jsx` component. The `AuthContext` uses Supabase's `onAuthStateChange` listener to reactively manage session state throughout the application lifecycle. Upon sign-in, it fetches the user's complete profile record (including role) from the `profiles` table and stores it in context. The `ProtectedRoute` component wraps all role-specific route definitions in `App.jsx` and enforces that the current user's role matches the route's `allowedRoles` prop, redirecting unauthorized users to the root path. The entire authentication flow is stateless from the server's perspective — the JWT token included with every Supabase client request carries the user's identity, which is then validated against RLS policies at the database level.

### 5.4.2 Customer Dashboard Module

The `CustomerDashboard.jsx` component provides the primary landing page for customer users. On mount, it fetches the customer's `solar_systems` record from Supabase. From the system's `capacity_kw` field, it computes estimated performance metrics: current output (75% of capacity), today's generation (4.2 kWh per kW), monthly generation (120 kWh per kW), and lifetime generation (3.5 MWh per kW). These estimates are displayed in a grid of metric cards with colorful, role-specific iconography. The dashboard also displays the customer's AMC status badge and validity date from the `solar_systems` table. Quick-access navigation cards link to the AI Chat and Ticket Tracker modules. A prominent CTA button navigates to the Services page.

### 5.4.3 Services Module

The `Services.jsx` page provides the service request interface. It presents four service type cards: Site Visit, Panel Cleaning, Inverter Issue, and Health Check. Clicking any card opens a service-specific modal component. The `SiteVisitModal` collects a free-text description of the issue. The `SlotBookingModal` presents a slot selection interface for Panel Cleaning and Health Check services. The `InverterQuestionnaire` collects structured answers to diagnostic questions about the inverter issue. Upon modal submission, the `ticketService.createTicket()` function is called, creating a new ticket record with `service_metadata` populated from the questionnaire responses. The page also displays the customer's recent service requests as status-badged cards. An Emergency Support card provides a one-tap call button to the service company's emergency line.

### 5.4.4 AI Chat Module

The `AIChat.jsx` page is the most sophisticated component in the customer interface. It uses the `useChat` custom hook which encapsulates all chat logic. The hook manages conversation creation and loading from the `chatbot_conversations` table, message sending and persistence to `chatbot_messages`, the Gemini API call with the full conversation context and solar domain system prompt, typing indicator state, and the pending ticket detection and creation logic. The chat interface presents a sliding sidebar for conversation history, animated message bubbles with role-differentiated styling (user messages right-aligned in amber, AI messages left-aligned in white), quick action buttons for common queries, a TicketPrompt overlay when escalation is triggered, and a chat input with send button and voice input capabilities. Conversation history is accessible across sessions, with each conversation titled by its first user message.

### 5.4.5 AMC Module

The `AMC.jsx` page implements a two-view architecture: a dashboard view for customers with active subscriptions and a shop view for customers without. The dashboard view displays the active subscription's plan name, validity period, services remaining, and a Warranty Details section showing expiry dates for solar panels (25 years), inverters (10 years), and structural components (5 years). The shop view fetches available plans from the `amc_plans` table, runs the `solarRecommendationEngine` against the customer's solar system data to generate an AI recommendation card, and renders each plan as a selectable card with features and benefits lists. The recommendation engine evaluates system age and capacity to categorize customers into Bronze, Silver, or Gold plan tiers and generates a personalized recommendation message.

### 5.4.6 Ticket Tracker Module

The `TicketTracker.jsx` page provides customers with a chronological view of all their service tickets. Each ticket is displayed as an expandable card showing issue type, creation date, current status (with color-coded badges), assigned technician name, ticket description, and any attached media (voice notes with audio player, photos in a grid). A status filter tab bar allows customers to filter tickets by All, Open, In Progress, and Completed states.

### 5.4.7 Admin Dashboard Module

The `AdminDashboard.jsx` page is the most data-dense component in the system. Its tab-based navigation exposes five operational sections. The Tickets tab displays all system tickets with priority-based sorting. Each ticket card shows issue type, customer name, system capacity, description, service metadata details, attached media previews, a technician assignment dropdown, and a close button for completed tickets. The AMC tab shows pending subscription requests with customer details and an Approve & Activate button. The Verification tab contains the customer pre-registration form and a list of pending verification customers. The Customers tab displays the active customer database. The Users tab provides a complete list of all platform profiles with inline role-change dropdowns.

### 5.4.8 Technician Dashboard Module

The `TechnicianDashboard.jsx` page is optimized for field use on mobile devices. It fetches all tickets assigned to the current technician user from the `tickets` table. Each ticket card displays a 3-step process stepper (Assigned → In Progress → Completed), customer address with a deep-link to Google Maps navigation, customer phone number with a clickable `tel:` link, system capacity, issue description, and contextual action buttons. Depending on ticket status, the action area shows a "Start Work" button (status: assigned), a "Mark Completed" button (status: in_progress), or an expandable completion form (remarks textarea + photo upload) when the completion workflow is active.

## 5.5 Database Design

The SolarCare database consists of nine primary tables across two migration generations. The schema was designed with normalization, referential integrity, and Row-Level Security as primary concerns.

### Table 1: `auth.users` (Supabase Managed)
Managed by Supabase Auth. Contains email, encrypted password, and raw user metadata. Linked to `profiles` via UUID primary key. The `on_auth_user_created` trigger fires on every new row insert.

### Table 2: `profiles`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, FK → auth.users(id) |
| name | text | NOT NULL |
| phone | text | |
| role | text | CHECK (customer/admin/technician) |
| address | text | |
| created_at | timestamptz | DEFAULT now() |

### Table 3: `customers_master`
Pre-registration whitelist managed exclusively by administrators. Contains name, email, phone, address, system_capacity_kw, installation_date, amc_status, amc_valid_until. Only admin role can SELECT or INSERT via RLS policy.

### Table 4: `solar_systems`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK → profiles(id) |
| capacity_kw | numeric | NOT NULL |
| installation_date | date | NOT NULL |
| amc_status | text | CHECK (active/expired) |
| amc_valid_until | date | |

### Table 5: `tickets`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK → profiles(id) |
| system_id | uuid | FK → solar_systems(id) |
| issue_type | text | NOT NULL |
| description | text | |
| priority | text | CHECK (low/medium/high/emergency) |
| status | text | CHECK (raised/open/assigned/in_progress/completed/closed/resolved/escalated) |
| assigned_technician_id | uuid | FK → profiles(id) |
| category | text | DEFAULT general |
| ai_generated | boolean | DEFAULT false |
| conversation_id | uuid | |
| photos | jsonb | Array of photo objects |
| voice_note_url | text | |
| service_metadata | jsonb | Questionnaire responses |
| booking_date | timestamptz | For scheduled services |
| ai_diagnosis | text | AI-generated summary |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Table 6: `ticket_updates`
Stores incremental updates made by technicians during field execution. Contains ticket_id, technician_id, status_change, remarks, photo_url, created_at.

### Table 7: `chatbot_conversations`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users(id) |
| title | text | DEFAULT 'New Conversation' |
| status | text | CHECK (active/archived/converted_to_ticket) |
| ticket_id | uuid | FK → tickets(id) |
| message_count | integer | DEFAULT 0 |
| updated_at | timestamptz | Auto-updated by trigger |

### Table 8: `chatbot_messages`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → chatbot_conversations(id) |
| role | text | CHECK (user/assistant/system) |
| content | text | NOT NULL |
| metadata | jsonb | DEFAULT {} |

### Table 9: `amc_subscriptions`
Links customers to AMC plans. Contains user_id, plan_id, status (pending_payment/active), start_date, end_date, services_total, services_used.

### SQL Trigger: `handle_new_user()`
This PostgreSQL function fires automatically after every new row insert into `auth.users`. It queries the `customers_master` table for the new user's email. If found, it creates a `profiles` record (populated from master data) and a `solar_systems` record (populated from system specifications in master data). If not found and no role metadata is present, it raises an exception rejecting the registration — this is the controlled onboarding mechanism that prevents unauthorized self-registration.

## 5.6 Detailed Diagram Explanations

### Entity-Relationship (ER) Diagram Summary

The ER diagram shows the following key relationships:
- One `profiles` record has zero or one `solar_systems` record (one-to-one for customers).
- One `profiles` record can have many `tickets` (as customer_id) and many assigned `tickets` (as assigned_technician_id).
- One `tickets` record can have many `ticket_updates`.
- One `profiles` record can have many `chatbot_conversations`.
- One `chatbot_conversations` record has many `chatbot_messages`.
- One `tickets` record can have zero or one `chatbot_conversations` (when AI-escalated).
- One `profiles` record can have one `amc_subscriptions` record linked to one `amc_plans` record.

### Row-Level Security Policy Architecture

RLS policies form the security backbone of the entire system. The key policies are:

- `profiles`: Public SELECT (all authenticated users can read profile names for display), restricted UPDATE (users can only update their own row).
- `solar_systems`: Customers see only `WHERE customer_id = auth.uid()`. Admins and Technicians see all rows.
- `tickets`: Customers see only `WHERE customer_id = auth.uid()`. Technicians see assigned tickets. Admins see all.
- `chatbot_conversations` and `chatbot_messages`: Strict user isolation — users see only their own conversations and messages.
- `customers_master`: Admin-only access.
- `amc_subscriptions`: Users see their own; Admins see all.
