'use client';

import { useRef, useState, useEffect } from 'react';

export default function DrawingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
    const [drawing, setDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            if (!canvas) return;
            canvas.width = canvas.parentElement?.clientWidth || 0;
            canvas.height = canvas.parentElement?.clientHeight || 0;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = () => {
        setDrawing(true);
        setPoints([]);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPoints((prevPoints) => [...prevPoints, { x, y }]);
        
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
    };

    return (
        <div className="flex h-screen">
            <div className="w-3/4 bg-gray-200">
                <canvas 
                    ref={canvasRef} 
                    onMouseDown={startDrawing} 
                    onMouseMove={draw} 
                    onMouseUp={stopDrawing} 
                    className="w-full h-full"
                />
            </div>
            <div className="w-1/4 p-4 bg-gray-300 overflow-y-auto">
                <h3 className="text-lg font-bold">Drawn Points:</h3>
                <ul>
                    {points.map((point, index) => (
                        <li key={index}>{`(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
