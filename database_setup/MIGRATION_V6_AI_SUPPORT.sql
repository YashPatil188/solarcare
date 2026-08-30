-- ============================================================
-- MIGRATION_V6_AI_SUPPORT.sql
-- SolarCare AI Support Ecosystem - Database Schema
-- ============================================================

-- 1. EXTEND EXISTING TICKETS TABLE
-- Add AI-related columns to existing tickets
ALTER TABLE public.tickets 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS conversation_id UUID,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estimated_resolution_hours INTEGER,
  ADD COLUMN IF NOT EXISTS customer_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_diagnosis TEXT;

-- Update status check constraint to include new statuses
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_status_check 
  CHECK (status IN ('raised', 'open', 'assigned', 'in_progress', 'completed', 'closed', 'resolved', 'escalated'));

-- Update priority check constraint
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_priority_check;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_priority_check 
  CHECK (priority IN ('low', 'medium', 'high', 'emergency'));

-- 2. CHATBOT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'converted_to_ticket')),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  context_summary TEXT,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CHATBOT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TECHNICIAN SPECIALIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.technician_specializations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  current_load INTEGER DEFAULT 0,
  max_load INTEGER DEFAULT 5,
  avg_resolution_hours NUMERIC(5,1) DEFAULT 24,
  rating NUMERIC(3,2) DEFAULT 4.00,
  phone TEXT,
  service_area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CUSTOMER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  resolution_satisfaction TEXT CHECK (resolution_satisfaction IN ('very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied')),
  would_recommend BOOLEAN,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_sentiment_score NUMERIC(4,3),
  response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  technician_rating INTEGER CHECK (technician_rating >= 1 AND technician_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user ON public.chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON public.chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON public.chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created ON public.chatbot_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_technician_specs_category ON public.technician_specializations(category);
CREATE INDEX IF NOT EXISTS idx_technician_specs_available ON public.technician_specializations(is_available);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_ticket ON public.customer_feedback(ticket_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_user ON public.customer_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_ai_generated ON public.tickets(ai_generated);
CREATE INDEX IF NOT EXISTS idx_tickets_escalated ON public.tickets(escalated);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES

-- Chatbot Conversations: Users see only their own
CREATE POLICY "Users view own conversations"
ON public.chatbot_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own conversations"
ON public.chatbot_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own conversations"
ON public.chatbot_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own conversations"
ON public.chatbot_conversations FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins view all conversations"
ON public.chatbot_conversations FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Chatbot Messages: Users see messages from their conversations
CREATE POLICY "Users view own messages"
ON public.chatbot_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chatbot_conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users create own messages"
ON public.chatbot_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chatbot_conversations 
  WHERE id = conversation_id AND user_id = auth.uid()
));

-- Admins view all messages
CREATE POLICY "Admins view all messages"
ON public.chatbot_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Technician Specializations: Everyone can read, admins can write
CREATE POLICY "Everyone can view technician specs"
ON public.technician_specializations FOR SELECT
USING (true);

CREATE POLICY "Admins manage technician specs"
ON public.technician_specializations FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Customer Feedback: Users see own, admins see all
CREATE POLICY "Users view own feedback"
ON public.customer_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own feedback"
ON public.customer_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all feedback"
ON public.customer_feedback FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. SEED TECHNICIAN SPECIALIZATIONS (for existing technicians)
-- This will populate based on existing technician profiles
INSERT INTO public.technician_specializations (technician_id, category, experience_years, max_load, service_area)
SELECT 
  p.id, 
  unnest(ARRAY['panel_issue', 'inverter_issue', 'cleaning_maintenance']),
  2,
  5,
  'Local'
FROM public.profiles p
WHERE p.role = 'technician'
ON CONFLICT DO NOTHING;

-- 10. AUTO-UPDATE TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chatbot_conversations_updated_at
BEFORE UPDATE ON public.chatbot_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
