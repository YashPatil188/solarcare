import { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function ImageUploader({ onImagesChange, maxImages = 3 }) {
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newPreviews = [];
        const validFiles = [];

        files.forEach(file => {
            if (previews.length + newPreviews.length >= maxImages) return;

            // Validate: Image only, max 5MB
            if (!file.type.startsWith('image/')) return;
            if (file.size > 5 * 1024 * 1024) return;

            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        });

        const updatedPreviews = [...previews, ...newPreviews];
        setPreviews(updatedPreviews);

        // Pass complete list of files (we need to manage state of files too, but simpler for now to assume additive)
        // For a robust implementation, we should maintain a file array state.
        // Simplified: triggers callback with NEW files. Parent should handle accumulation if needed, 
        // OR we handle it here. Let's make it simpler: Parent handles accumulation? No, better here.
    };

    // Changing approach: Let's keep file objects in state
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleFiles = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const currentCount = selectedFiles.length;
        const availableSlots = maxImages - currentCount;
        const filesToAdd = files.slice(0, availableSlots);

        const newFiles = [...selectedFiles, ...filesToAdd];
        setSelectedFiles(newFiles);

        // Generate previews
        const newPreviews = filesToAdd.map(f => URL.createObjectURL(f));
        setPreviews([...previews, ...newPreviews]);

        onImagesChange(newFiles);
    };

    const removeImage = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);

        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
        onImagesChange(newFiles);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
                {previews.map((src, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {previews.length < maxImages && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-solar hover:text-solar transition-colors"
                    >
                        <ImagePlus className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Add Photo</span>
                    </button>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFiles}
                accept="image/*"
                multiple
                className="hidden"
            />
            {previews.length > 0 && <p className="text-xs text-gray-500">{previews.length}/{maxImages} images selected</p>}
        </div>
    );
}
