import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{
            addToast, toast: {
                success: (msg) => addToast(msg, 'success'),
                error: (msg) => addToast(msg, 'error'),
                info: (msg) => addToast(msg, 'info'),
            }
        }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] animate-in slide-in-from-right-full transition-all
                            ${toast.type === 'success' ? 'bg-green-50 text-green-900 border border-green-200' : ''}
                            ${toast.type === 'error' ? 'bg-red-50 text-red-900 border border-red-200' : ''}
                            ${toast.type === 'info' ? 'bg-blue-50 text-blue-900 border border-blue-200' : ''}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
