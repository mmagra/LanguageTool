import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Move, Upload, Save } from 'lucide-react';

const ImageCropper = ({
    isOpen,
    onClose,
    onCropComplete,
    aspectRatio = 200 / 75, // Matches the logo container ratio
}) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setImageSrc(null);
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target.result);
                setScale(1);
                setPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

    const handleSave = () => {
        if (!imageRef.current || !containerRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = imageRef.current;

        // Target Dimensions (High Res)
        const targetWidth = 400; // Output width
        const targetHeight = targetWidth / aspectRatio;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 1. Clear Canvas
        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // 2. Calculate Scale Factors
        // The container is the "Crop Box" (Overlay)
        const cropBoxRect = containerRef.current.getBoundingClientRect();

        // The parent is the "View Area" (Gray Box) where the image is contained
        const viewAreaRect = imageRef.current.parentElement.getBoundingClientRect();

        // Calculate how the image is currently rendered in the DOM (Base "object-contain" fit)
        const contentWidth = image.naturalWidth;
        const contentHeight = image.naturalHeight;

        // Visual fit logic (matches CSS max-w-full max-h-full)
        // Check if image is constrained by width or height of the View Area
        const scaleX = viewAreaRect.width / contentWidth;
        const scaleY = viewAreaRect.height / contentHeight;
        // In CSS object-contain, it uses the smaller scale to fit entirely
        // We also usually don't upscale if image is small, but let's assume we fit to view.
        // If image is larger than view, it shrinks. If smaller, it stays (if no width:100%).
        // Let's assume standard "fit to available space" behavior for a tool like this.
        let domFitScale = Math.min(scaleX, scaleY);

        // However, if the image is smaller than the view area, it might not scale up in DOM unless we force it.
        // To be safe and consistent, the calculation should match exactly what is on screen.
        // It's safer to calculate 'domFitScale' by measuring the rendered size directly if possible, 
        // but 'transform: scale' complicates it.
        // So we stick to the theoretical fit:
        if (domFitScale > 1) domFitScale = 1; // Usually browsers don't upscale intrinsic images automatically

        // 3. Map Screen Pixels to Canvas Pixels
        // pixelRatio: How many Canvas pixels per Screen Pixel (relative to the Crop Box)
        const pixelRatio = targetWidth / cropBoxRect.width;

        ctx.save();

        // Center coordinate system
        ctx.translate(targetWidth / 2, targetHeight / 2);

        // Apply User Transform (Scale & Pan)
        // Pan is in screen pixels, so we multiply by pixelRatio
        ctx.translate(position.x * pixelRatio, position.y * pixelRatio);
        ctx.scale(scale, scale);

        // Draw Image
        // We need to draw the image at its "Base Rendered Size" * "pixelRatio"
        // But centered.

        const drawWidth = contentWidth * domFitScale * pixelRatio;
        const drawHeight = contentHeight * domFitScale * pixelRatio;

        ctx.drawImage(
            image,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );

        ctx.restore();

        onCropComplete(canvas.toDataURL('image/png'));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#f0f4fe]">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Upload & Adjust Logo</h3>
                        <p className="text-xs text-gray-500 mt-1">Crop and resize your image</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col overflow-y-auto">
                    {!imageSrc ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all group flex-1"
                        >
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload size={40} className="text-indigo-600" />
                            </div>
                            <p className="text-gray-600 font-medium text-lg">Click to upload image</p>
                            <p className="text-gray-400 text-sm mt-2">PNG, JPG up to 5MB</p>
                        </div>
                    ) : (
                        <div className="space-y-6 flex-1 flex flex-col">
                            <div className="flex-1 min-h-[300px] bg-gray-100 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-200 checkerboard-bg"
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                {/* Crop Overlay/Guidelines */}
                                <div
                                    ref={containerRef}
                                    className="absolute border-2 border-indigo-500 z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                                    style={{
                                        width: '80%',
                                        aspectRatio: `${aspectRatio}`,
                                    }}
                                />

                                {/* Draggable Image */}
                                <img
                                    ref={imageRef}
                                    src={imageSrc}
                                    alt="Preview"
                                    draggable={false}
                                    onMouseDown={handleMouseDown}
                                    className="cursor-move transition-transform duration-75 ease-out max-w-full max-h-full object-contain"
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    }}
                                />

                                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                    Drag to Move
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={handleZoomOut}
                                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                    >
                                        <ZoomOut size={20} />
                                    </button>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={scale}
                                        onChange={(e) => setScale(parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleZoomIn}
                                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                    >
                                        <ZoomIn size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <button onClick={() => fileInputRef.current?.click()} className="text-indigo-600 hover:text-indigo-800 font-medium">
                                    Upload Different Image
                                </button>
                                <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }) }} className="text-gray-400 hover:text-gray-600">
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                    >
                        <X size={16} />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!imageSrc}
                        className={`px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 ${!imageSrc ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save size={16} />
                        Save Logo
                    </button>
                </div>
            </div>

            <style jsx>{`
                .checkerboard-bg {
                    background-color: #f3f4f6;
                    background-image:
                        linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
            `}</style>
        </div>
    );
};

export default ImageCropper;
