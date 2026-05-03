import { useState } from 'react';
import { Button } from '../ui/Button';
import { Calendar, Clock } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';

export function SlotBookingModal({ isOpen, onClose, userId, systemId, serviceType, onSuccess }) {
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    if (!isOpen) return null;

    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + 1 + i); // Start from tomorrow
        return d;
    });

    // Generate slots 10 AM to 5 PM
    const slots = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

    const handleSubmit = async () => {
        if (!selectedDate || !selectedSlot) {
            toast.error('Please select both a date and time slot.');
            return;
        }

        setLoading(true);
        try {
            // Construct booking timestamp
            const bookingDate = new Date(selectedDate);
            const [time, period] = selectedSlot.split(' ');
            let [hours, minutes] = time.split(':');
            if (period === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
            if (period === 'AM' && hours === '12') hours = 0;
            bookingDate.setHours(hours, 0, 0, 0);

            await ticketService.createTicket({
                customer_id: userId,
                system_id: systemId,
                issue_type: serviceType,
                description: `Slot Booking: ${selectedDate.toDateString()} at ${selectedSlot}`,
                status: 'raised',
                priority: 'medium',
                booking_date: bookingDate.toISOString(),
                service_metadata: {
                    type: 'slot_booking',
                    date: selectedDate.toDateString(),
                    slot: selectedSlot
                }
            });
            toast.success('Slot Booked Successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to book slot.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-solar" />
                    Book {serviceType.replaceAll('_', ' ').toUpperCase()}
                </h2>

                <div className="space-y-4 overflow-y-auto pr-1">
                    {/* Date Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Date</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 noscroll">
                            {dates.map(date => {
                                const isSelected = selectedDate?.toDateString() === date.toDateString();
                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 w-20 p-3 rounded-lg border text-center transition-all ${isSelected ? 'border-solar bg-yellow-50 text-solar-dark ring-1 ring-solar' : 'border-gray-200 hover:border-gray-400'}`}
                                    >
                                        <div className="text-xs text-gray-400 font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="text-lg font-bold text-gray-900">{date.getDate()}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slot Selection */}
                    {selectedDate && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Time</label>
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`p-2 rounded border text-sm font-medium transition-all ${selectedSlot === slot ? 'bg-solar text-gray-900 border-solar' : 'hover:bg-gray-50 border-gray-200'}`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedDate || !selectedSlot}>
                        {loading ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
