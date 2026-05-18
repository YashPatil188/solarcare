# CHAPTER 6 – IMPLEMENTATION

## 6.1 Full Implementation Explanation

The implementation of SolarCare followed an iterative, feature-driven development methodology. The project was organized across six database migration versions (V1 through V6), with each migration corresponding to a major feature addition. The development process began with establishing the foundational architecture — the Supabase schema, authentication flow, and React application scaffold — before progressively layering the service ticket management system, AMC module, media upload capabilities, and finally the AI support ecosystem.

The frontend was bootstrapped using Vite with the React plugin, providing an extremely fast development environment with Hot Module Replacement (HMR). Tailwind CSS 4 was configured as the primary styling framework, utilizing its new CSS-first configuration approach (via `@tailwindcss/vite` plugin) rather than the traditional `tailwind.config.js` file. The application's design system was built around a custom `solar` color palette (a vibrant amber-green, hex `#0ce86b`) which serves as the primary brand color across all interactive elements.

The application is structured with a clear separation of concerns. The `src/pages/` directory contains full-page components (one per route). The `src/components/` directory is organized into sub-directories by feature area (`auth`, `chat`, `feedback`, `layout`, `services`, `tickets`, `ui`). The `src/services/` directory contains data access layer modules (`ticketService.js`, `customerService.js`) that encapsulate all Supabase query logic. The `src/hooks/` directory contains custom React hooks (`useChat.js`) for complex stateful logic. The `src/context/` directory holds global state providers. The `src/utils/` directory contains pure utility functions such as the `solarRecommendationEngine.js`.

## 6.2 Frontend Code Snippets

### 6.2.1 Authentication Context (AuthContext.jsx)

The `AuthContext` is the foundation of the application's security model on the frontend side. It wraps the entire application and provides `user`, `profile`, `signIn`, `signUp`, and `signOut` functions to all child components.

```jsx
// src/context/AuthContext.jsx (simplified)
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Fetch role and profile data
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 6.2.2 Ticket Service (ticketService.js)

The ticket service module centralizes all database interactions related to the tickets table, providing a clean data-access interface for components.

```javascript
// src/services/ticketService.js (simplified)
import { supabase } from '../lib/supabase';

export const ticketService = {
  async getTickets(userId, role) {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        profiles!customer_id(name, phone, address),
        solar_systems(capacity_kw)
      `)
      .order('created_at', { ascending: false });

    // RLS handles data filtering at DB level, but we
    // also apply client-side hints for optimal query planning
    if (role === 'customer') {
      query = query.eq('customer_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTicket(ticketData) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTicket(ticketId, updates) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
```

### 6.2.3 AI Chat Hook (useChat.js - Key Sections)

The `useChat` custom hook encapsulates the complete AI chat workflow, including Gemini API communication and ticket generation logic.

```javascript
// src/hooks/useChat.js (key section - sendMessage)
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

const SOLAR_SYSTEM_PROMPT = `You are SolarCare AI, a specialized expert assistant 
for solar energy system maintenance and troubleshooting. You help customers with:
1. Diagnosing solar system issues (panel, inverter, wiring, battery problems)
2. Providing step-by-step troubleshooting guidance
3. Scheduling maintenance services
4. Explaining AMC plans and warranty coverage

When a customer's issue requires a physical technician visit, include the phrase
[TICKET_REQUIRED] in your response to trigger the ticket creation workflow.

Always be helpful, clear, and empathetic. If unsure, recommend professional service.`;

export function useChat(userId, systemId) {
  // ... state declarations ...

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !conversationId) return;

    // 1. Save user message to DB
    await supabase.from('chatbot_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: content.trim()
    });

    setIsTyping(true);

    try {
      // 2. Fetch full conversation history for context
      const { data: history } = await supabase
        .from('chatbot_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      // 3. Call Gemini API
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const chat = model.startChat({
        history: history.slice(0, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        systemInstruction: SOLAR_SYSTEM_PROMPT
      });

      const result = await chat.sendMessage(content);
      const aiResponse = result.response.text();

      // 4. Save AI response to DB
      await supabase.from('chatbot_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse
      });

      // 5. Check if ticket creation is needed
      if (aiResponse.includes('[TICKET_REQUIRED]')) {
        setPendingTicket({
          issue_type: 'general',
          description: `AI-assisted complaint: ${content}`,
          ai_diagnosis: aiResponse.replace('[TICKET_REQUIRED]', '').trim(),
          priority: 'medium',
          ai_generated: true,
          conversation_id: conversationId
        });
      }

    } catch (error) {
      console.error('Gemini API error:', error);
    } finally {
      setIsTyping(false);
      loadMessages();
    }
  }, [conversationId, userId]);

  // ... other hook functions ...
}
```

### 6.2.4 Solar Recommendation Engine

```javascript
// src/utils/solarRecommendationEngine.js (simplified)
export const solarRecommendationEngine = {
  recommend(system, availablePlans) {
    if (!system || !availablePlans?.length) return null;

    const ageYears = (new Date() - new Date(system.installation_date))
      / (1000 * 60 * 60 * 24 * 365);
    const capacityKw = system.capacity_kw;

    // Scoring logic based on age and capacity
    let tier = 'Bronze';
    let section = 'Standard Protection';

    if (ageYears > 5 || capacityKw > 10) {
      tier = 'Gold';
      section = 'Maximum Protection';
    } else if (ageYears > 2 || capacityKw > 5) {
      tier = 'Silver';
      section = 'Enhanced Protection';
    }

    const recommendedPlan = availablePlans.find(p =>
      p.name.toLowerCase().includes(tier.toLowerCase())
    );

    return {
      tier,
      section,
      recommendedPlanId: recommendedPlan?.id,
      message: `Based on your ${capacityKw}kW system installed ${Math.floor(ageYears)} 
                years ago, we recommend the ${tier} plan.`,
      reasoning: ageYears > 5
        ? 'Older systems benefit from comprehensive coverage.'
        : 'Your system is relatively new and well-maintained.',
      highlights: [
        `Covers ${capacityKw}kW capacity system`,
        `Tailored for ${Math.floor(ageYears)}-year-old installation`,
        'Priority technician dispatch included'
      ]
    };
  }
};
```

### 6.2.5 Protected Route Component

```jsx
// src/components/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 
          border-solar"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

## 6.3 Backend Code — SQL Trigger and Functions

The most critical backend logic resides in the PostgreSQL trigger function that handles controlled customer onboarding.

```sql
-- Automated user provisioning trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  master_record public.customers_master%rowtype;
BEGIN
  -- Check if registering email exists in the pre-approved whitelist
  SELECT * INTO master_record
  FROM public.customers_master
  WHERE email = new.email;

  IF found THEN
    -- Auto-create profile from master record
    INSERT INTO public.profiles (id, name, phone, address, role)
    VALUES (new.id, master_record.name, master_record.phone,
            master_record.address, 'customer');

    -- Auto-create solar system from master record
    INSERT INTO public.solar_systems
      (customer_id, capacity_kw, installation_date, amc_status, amc_valid_until)
    VALUES (new.id, master_record.system_capacity_kw,
            master_record.installation_date, master_record.amc_status,
            master_record.amc_valid_until);
  ELSE
    -- Allow admin/technician creation with explicit role metadata
    IF new.raw_user_meta_data->>'role' IS NULL OR
       new.raw_user_meta_data->>'role' = 'customer' THEN
      RAISE EXCEPTION 'Email not found in customer records.
                       Please contact support.';
    ELSE
      INSERT INTO public.profiles (id, name, role)
      VALUES (new.id, new.raw_user_meta_data->>'name',
              COALESCE(new.raw_user_meta_data->>'role', 'customer'));
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 6.4 APIs Used

| API / Service | Purpose | Integration Point |
|---|---|---|
| Supabase Auth API | User sign-in, sign-up, sign-out, session management | `supabase.auth.*` methods via JS SDK |
| Supabase PostgREST API | All CRUD operations on database tables | `supabase.from().*` query builder |
| Supabase Storage API | Photo and voice note upload/retrieval | `supabase.storage.from().upload()` |
| Supabase Realtime API | Real-time subscription to data changes | `supabase.channel().on()` |
| Google Gemini API (gemini-1.5-flash) | AI chat completions and solar troubleshooting | `@google/generative-ai` SDK |
| Google Maps Directions API | GPS navigation deep-link for technicians | `href` deep-link with encoded address |
| HTML `tel:` Protocol | One-tap customer calling for technicians | `href="tel:phoneNumber"` |
| Capacitor Camera Plugin | Photo capture on Android device | `@capacitor/camera` |

## 6.5 Database Connectivity

The Supabase JavaScript client is initialized once in `src/lib/supabase.js` and imported throughout the application.

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

The `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values are stored in the `.env` file and injected at build time by Vite. The anon key is a public key — it is safe to expose in a frontend application because all data access is controlled by RLS policies at the database level, not by the API key itself.

All database queries use the Supabase PostgREST client which communicates with the database via a secure RESTful API over HTTPS. The client automatically attaches the current user's JWT token to every request as a Bearer token in the Authorization header. PostgreSQL then validates this token and applies the corresponding RLS policies to filter data accordingly.

## 6.6 Authentication Workflow

The complete authentication workflow in SolarCare operates as follows:

**Step 1 – Sign In:** The user submits email and password via the `Login.jsx` form. `supabase.auth.signInWithPassword()` is called. Supabase Auth validates credentials and returns a session object containing an access token (JWT), a refresh token, and the user's `auth.users` record.

**Step 2 – Session Storage:** The Supabase JS client automatically persists the session to `localStorage`. On subsequent page loads, the client reads from localStorage and restores the session without requiring re-authentication.

**Step 3 – Profile Fetch:** The `onAuthStateChange` callback in `AuthContext` fires with the `SIGNED_IN` event. The context immediately queries the `profiles` table for the user's record, fetching their name, phone, and crucially their `role` field.

**Step 4 – Role-Based Redirect:** The `RootRedirect` component reads the `profile.role` from `AuthContext` and navigates the user to their appropriate dashboard.

**Step 5 – Token Refresh:** The Supabase client handles JWT token refresh automatically. Before each request, it checks if the access token (which expires in 1 hour by default) is still valid. If not, it uses the refresh token to obtain a new access token transparently, without any user interaction.

**Step 6 – RLS Enforcement:** Every Supabase query sent from the frontend includes the JWT in the Authorization header. PostgreSQL extracts the user's UUID from the token via the `auth.uid()` function and evaluates all active RLS policies for the queried table against this UUID. Data that does not satisfy the policies is silently excluded from the result set.

**Step 7 – Sign Out:** `supabase.auth.signOut()` clears the session from localStorage, fires the `SIGNED_OUT` auth state event, and the `AuthContext` nullifies the `user` and `profile` states. All `ProtectedRoute` components immediately redirect to `/login`.

**Step 8 – New Customer Sign Up:** A new customer navigates to `/signup`, fills in their email, password, and name, and submits. `supabase.auth.signUp()` creates a new `auth.users` record. The `on_auth_user_created` PostgreSQL trigger fires immediately, queries `customers_master` for the email, and either provisions the profile and solar system automatically or raises an exception if the email is not in the pre-approved list. This exception propagates back to the client as an error, and the `Signup.jsx` component displays the appropriate error message to the user.
