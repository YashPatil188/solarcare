import { supabase } from '../lib/supabase';
import { analyzeSentiment } from './geminiService';

export const feedbackService = {
    // ─── Submit Feedback ───────────────────────────────────────
    async submitFeedback({ ticketId, userId, rating, reviewText, resolutionSatisfaction, wouldRecommend, responseTimeRating, technicianRating }) {
        // Run sentiment analysis on review text
        let sentiment = { sentiment: 'neutral', score: 0.5 };
        if (reviewText && reviewText.trim().length > 0) {
            sentiment = await analyzeSentiment(reviewText);
        }

        const payload = {
            ticket_id: ticketId,
            user_id: userId,
            rating,
            review_text: reviewText || null,
            resolution_satisfaction: resolutionSatisfaction || null,
            would_recommend: wouldRecommend ?? null,
            ai_sentiment: sentiment.sentiment,
            ai_sentiment_score: sentiment.score,
            response_time_rating: responseTimeRating || null,
            technician_rating: technicianRating || null,
        };

        const { data, error } = await supabase
            .from('customer_feedback')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ─── Get Feedback for Ticket ───────────────────────────────
    async getFeedbackForTicket(ticketId) {
        const { data, error } = await supabase
            .from('customer_feedback')
            .select('*')
            .eq('ticket_id', ticketId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // ─── Get User's All Feedback ───────────────────────────────
    async getUserFeedback(userId) {
        const { data, error } = await supabase
            .from('customer_feedback')
            .select('*, tickets(issue_type, category, customer_summary)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ─── Get Aggregate Stats (Admin) ───────────────────────────
    async getFeedbackStats() {
        const { data, error } = await supabase
            .from('customer_feedback')
            .select('rating, ai_sentiment, resolution_satisfaction, technician_rating, response_time_rating, created_at');

        if (error) throw error;

        const feedbacks = data || [];
        const total = feedbacks.length;
        if (total === 0) return { avgRating: 0, total: 0, sentimentBreakdown: {}, satisfactionBreakdown: {} };

        const avgRating = (feedbacks.reduce((a, f) => a + f.rating, 0) / total).toFixed(1);
        const avgTechRating = (feedbacks.filter(f => f.technician_rating).reduce((a, f) => a + f.technician_rating, 0) / (feedbacks.filter(f => f.technician_rating).length || 1)).toFixed(1);

        const sentimentBreakdown = {};
        feedbacks.forEach(f => {
            const s = f.ai_sentiment || 'neutral';
            sentimentBreakdown[s] = (sentimentBreakdown[s] || 0) + 1;
        });

        const satisfactionBreakdown = {};
        feedbacks.forEach(f => {
            if (f.resolution_satisfaction) {
                satisfactionBreakdown[f.resolution_satisfaction] = (satisfactionBreakdown[f.resolution_satisfaction] || 0) + 1;
            }
        });

        // Monthly trend
        const monthlyTrend = {};
        feedbacks.forEach(f => {
            const month = new Date(f.created_at).toLocaleString('en', { month: 'short', year: '2-digit' });
            if (!monthlyTrend[month]) monthlyTrend[month] = { ratings: [], count: 0 };
            monthlyTrend[month].ratings.push(f.rating);
            monthlyTrend[month].count++;
        });

        const trendData = Object.entries(monthlyTrend).map(([month, d]) => ({
            month,
            avgRating: (d.ratings.reduce((a, r) => a + r, 0) / d.count).toFixed(1),
            count: d.count,
        }));

        return {
            avgRating: parseFloat(avgRating),
            avgTechRating: parseFloat(avgTechRating),
            total,
            sentimentBreakdown,
            satisfactionBreakdown,
            trendData,
        };
    },
};
