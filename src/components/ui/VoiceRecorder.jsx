import { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export function VoiceRecorder({ onRecordingComplete, onDelete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
                onRecordingComplete(blob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied or not available.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleDelete = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        onDelete();
        chunksRef.current = [];
    };

    return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
            {!audioUrl ? (
                <>
                    <Button
                        variant={isRecording ? "danger" : "default"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`rounded-full w-10 h-10 p-0 flex items-center justify-center ${isRecording ? 'animate-pulse' : ''}`}
                    >
                        {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <span className="text-sm text-gray-600">
                        {isRecording ? 'Recording... Tap to stop' : 'Tap mic to record voice note'}
                    </span>
                </>
            ) : (
                <>
                    <audio src={audioUrl} controls className="h-8 w-48" />
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </>
            )}
        </div>
    );
}
