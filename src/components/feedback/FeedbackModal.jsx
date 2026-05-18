import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ThumbsUp, ThumbsDown, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { feedbackService } from '../../services/feedbackService';

const satisfactionOptions = [
    { value: 'very_dissatisfied', label: '😡', text: 'Very Dissatisfied' },
    { value: 'dissatisfied', label: '😞', text: 'Dissatisfied' },
    { value: 'neutral', label: '😐', text: 'Neutral' },
    { value: 'satisfied', label: '😊', text: 'Satisfied' },
    { value: 'very_satisfied', label: '🤩', text: 'Very Satisfied' },
];

export function FeedbackModal({ isOpen, onClose, ticket, userId, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Rating, 2: Details, 3: Done
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [satisfaction, setSatisfaction] = useState(null);
    const [technicianRating, setTechnicianRating] = useState(0);
    const [responseTimeRating, setResponseTimeRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please provide a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await feedbackService.submitFeedback({
                ticketId: ticket.id,
                userId,
                rating,
                reviewText,
                resolutionSatisfaction: satisfaction,
                wouldRecommend,
                responseTimeRating: responseTimeRating || null,
                technicianRating: technicianRating || null,
            });

            setStep(3);
            onSuccess?.();
        } catch (err) {
            console.error('Feedback submission error:', err);
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-solar" />
                            <h2 className="font-bold text-gray-900">Rate Your Experience</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-5 space-y-6">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {/* Star Rating */}
                                <div className="text-center space-y-3">
                                    <p className="text-sm text-gray-600 font-medium">How was your overall experience?</p>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <motion.button
                                                key={star}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    className={`h-10 w-10 transition-colors ${
                                                        star <= (hoverRating || rating)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-gray-200'
                                                    }`}
                                                />
                                            </motion.button>
                                        ))}
                                    </div>
                                    {rating > 0 && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs font-bold text-gray-500 uppercase tracking-wider"
                                        >
                                            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Satisfaction Emoji Scale */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolution Satisfaction</p>
                                    <div className="flex justify-between bg-gray-50 rounded-xl p-2 border border-gray-100">
                                        {satisfactionOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSatisfaction(opt.value)}
                                                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${
                                                    satisfaction === opt.value
                                                        ? 'bg-white shadow-sm ring-2 ring-solar/30 scale-110'
                                                        : 'hover:bg-white/50'
                                                }`}
                                            >
                                                <span className="text-xl">{opt.label}</span>
                                                <span className="text-[8px] text-gray-400 font-bold uppercase">{opt.text.split(' ').pop()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={rating === 0}
                                    className="w-full bg-solar hover:bg-[#00c958] text-white h-12"
                                >
                                    Continue
                                </Button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                {/* Technician Rating */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Technician Service</p>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} onClick={() => setTechnicianRating(star)} className="focus:outline-none">
                                                <Star className={`h-7 w-7 transition-colors ${
                                                    star <= technicianRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                                                }`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Response Time Rating */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Response Time</p>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} onClick={() => setResponseTimeRating(star)} className="focus:outline-none">
                                                <Star className={`h-7 w-7 transition-colors ${
                                                    star <= responseTimeRating ? 'fill-blue-400 text-blue-400' : 'text-gray-200'
                                                }`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Review Text */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Review (Optional)</p>
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Tell us more about your experience..."
                                        rows={3}
                                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-solar focus:ring-1 focus:ring-solar outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Would Recommend */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Would you recommend SolarCare?</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setWouldRecommend(true)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                                                wouldRecommend === true
                                                    ? 'border-green-400 bg-green-50 text-green-700'
                                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                            }`}
                                        >
                                            <ThumbsUp className="h-5 w-5" /> Yes!
                                        </button>
                                        <button
                                            onClick={() => setWouldRecommend(false)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                                                wouldRecommend === false
                                                    ? 'border-red-400 bg-red-50 text-red-700'
                                                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                            }`}
                                        >
                                            <ThumbsDown className="h-5 w-5" /> No
                                        </button>
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-gray-200">
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="flex-1 bg-solar hover:bg-[#00c958] text-white h-12"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Submit</>}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="h-20 w-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto"
                                >
                                    <span className="text-4xl">🎉</span>
                                </motion.div>
                                <h3 className="text-xl font-bold text-gray-900">Thank You!</h3>
                                <p className="text-sm text-gray-500">Your feedback helps us improve our service.</p>
                                <Button onClick={onClose} className="bg-solar text-white hover:bg-[#00c958]">
                                    Done
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
