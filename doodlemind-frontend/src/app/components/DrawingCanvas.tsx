'use client';

import { useRef, useState, useEffect } from 'react';

export default function DrawingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [strokes, setStrokes] = useState<number[][][]>([]);
    const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
    const [drawing, setDrawing] = useState(false);
    const [suggestedPrediction, setSuggestedPrediction] = useState<{
        prediction: string;
        confidence: number;
        top3: { class: string; confidence: number }[];
    } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = canvas.parentElement?.clientWidth || 0;
            canvas.height = canvas.parentElement?.clientHeight || 0;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setDrawing(true);
        setCurrentStroke([]);
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

        setCurrentStroke((prev) => [...prev, { x, y }]);

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    // const stopDrawing = () => {
    //     setDrawing(false);
    //     if (currentStroke.length > 0) {
    //         setStrokes((prev) => [...prev, [currentStroke.map((p) => p.x), currentStroke.map((p) => p.y)]]);
    //         fetchSuggestedImage([...strokes, [currentStroke.map((p) => p.x), currentStroke.map((p) => p.y)]]);
    //     }
    //     setCurrentStroke([]);
    //     const canvas = canvasRef.current;
    //     if (!canvas) return;
    //     const ctx = canvas.getContext('2d');
    //     if (!ctx) return;
    //     ctx.beginPath();
    // };
    const stopDrawing = () => {
        setDrawing(false);
        
        if (currentStroke.length > 0 && canvasRef.current) {
            const canvas = canvasRef.current;
            const { width, height } = canvas;
    
            // Scale stroke points to [0, 256] range
            const scaledStroke = [
                currentStroke.map((p) => Math.round((p.x / width) * 256)),  // Scaled X values
                currentStroke.map((p) => Math.round((p.y / height) * 256))  // Scaled Y values
            ];
    
            // Update strokes state
            setStrokes((prev) => [...prev, scaledStroke]);
    
            // Call API with updated strokes
            fetchSuggestedImage([...strokes, scaledStroke]);
        }
    
        setCurrentStroke([]);
    
        // Reset canvas drawing path
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.beginPath();
    };


    const fetchSuggestedImage = async (updatedStrokes: number[][][]) => {
        try {
            const requestBody = { drawing: JSON.stringify(updatedStrokes) };

            const response = await fetch('http://localhost:5004/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) throw new Error('Failed to fetch prediction');
            const data = await response.json();

            console.log('API Response:', data);

            setSuggestedPrediction({
                prediction: data.prediction,
                confidence: data.confidence,
                top3: data.top_3_classes.map((cls:string, index:number) => ({
                    class: cls,
                    confidence: data.top_3_confidences[index],
                })),
            });
        } catch (error) {
            console.error('Error fetching prediction:', error);
        }
    };

    const scaleStrokes = (strokes: { x: number; y: number }[][], canvasWidth: number, canvasHeight: number) => {
        return strokes.map(stroke =>
            [
                stroke.map(point => Math.round((point.x / canvasWidth) * 256)), // Scale X
                stroke.map(point => Math.round((point.y / canvasHeight) * 256)) // Scale Y
            ]
        );
    };
    
    // Scale the stroke data from canvas dimensions to targetSize (256x256)
    // const scaleStrokes = (strokes) => {
    //     const targetSize = 256;
    //     return strokes.map(([xCoords, yCoords]) => {
    //     if (xCoords.length === 0 || yCoords.length === 0) return [[], []];
    //     // Scale each coordinate relative to the canvas dimensions
    //     const newX = xCoords.map(x => Math.round((x / canvasWidth) * targetSize));
    //     const newY = yCoords.map(y => Math.round((y / canvasHeight) * targetSize));
    //     return [newX, newY];
    //     });
    // };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setStrokes([]);
        setSuggestedPrediction(null);
    };

    return (
        <div className="flex h-screen">
            <div className="w-3/4 bg-gray-200 relative">
                <canvas 
                    ref={canvasRef} 
                    onMouseDown={startDrawing} 
                    onMouseMove={draw} 
                    onMouseUp={stopDrawing} 
                    className="w-full h-full"
                />
                <button 
                    onClick={clearCanvas} 
                    className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                    Clear Canvas
                </button>
            </div>
            <div className="w-1/4 p-4 bg-gray-600 overflow-y-auto">
                <h3 className="text-lg font-bold">Predictions:</h3>
                {suggestedPrediction ? (
                    <div className="mt-4">
                        <p className="text-xl font-semibold">{suggestedPrediction.prediction} ({(suggestedPrediction.confidence * 100).toFixed(2)}%)</p>
                        <h4 className="mt-2 text-md font-bold">Top 3 Predictions:</h4>
                        <ul className="list-disc pl-4">
                            {suggestedPrediction.top3.map((item, index) => (
                                <li key={index}>
                                    {item.class}: {(item.confidence * 100).toFixed(2)}%
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>No predictions yet.</p>
                )}
            </div>
        </div>
    );
}
