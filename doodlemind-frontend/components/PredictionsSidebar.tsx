import { Card, CardBody } from '@nextui-org/card';
import { useState } from 'react';
import { Button } from '@nextui-org/button';
import Image from 'next/image';

// Import stencil JSON with correct typing
import stencilDataRaw from '../stencils.json';
import ImageModel from '@/models/image.model';
import { Tools } from '@/enums/Tools';
import { X } from 'lucide-react';

const stencilData = stencilDataRaw as Record<string, { src: string; collection: string }[]>;

interface PredictionsSidebarProps {
  prediction: {
    confidence: number;
    prediction: string;
    top_3_classes: string[];
    top_3_confidences: number[];
  };
  parentRef: React.RefObject<HTMLDivElement>;
  // replaceStrokesWithImage: () => void;
  replaceStrokesWithImage: () => { x: number; y: number };
  setSelectedTool: React.Dispatch<React.SetStateAction<Tools>>;
}

export default function PredictionsSidebar({
  prediction,
  setSelectedTool,
  parentRef,
  replaceStrokesWithImage,
}: PredictionsSidebarProps) {
  const [isVisible, setIsVisible] = useState(false);

  const predictedDoodle =
    stencilData[prediction?.prediction]?.[0]?.src || '/default-placeholder.svg';

  return (
    <div className="absolute bottom-0 right-0 flex flex-col items-end p-4">
      {isVisible && (
        <Card className="h-auto w-80 p-4 shadow-lg bg-[#ffffff] dark:bg-[#18181b] border-gray-300 mb-4">
          <CardBody>
            {/* Replace the single predicted doodle section with this block */}
            <div className="mb-4">
              <strong className="text-xl mb-2 block">Predicted Doodles:</strong>
              {prediction?.top_3_classes.map((cls, index) => {
                // Get all images for this predicted class from your stencil data
                const images = stencilData[cls] || [];
                return (
                  <div key={cls} className="mb-4">
                    <h4 className="text-lg font-semibold mb-2">
                      {cls.substring(0,1).toUpperCase()}{cls.substring(1)} ({(prediction?.top_3_confidences[index] * 100).toFixed(1)}%)
                    </h4>
                    <div className="relative">
                      <div className="flex space-x-2 overflow-x-auto w-full pb-2 hide-scrollbar">
                        {images.map((img, index) => (
                          <div
                            key={index}
                            className="min-w-[100px] cursor-pointer"
                            onClick={() => {
                              //replaceStrokesWithImage();
                              //ImageModel.getImageFromURL(img.src, parentRef);
                              const { x, y } = replaceStrokesWithImage();
                              ImageModel.getImageFromURL(img.src, parentRef, x, y);
                              setSelectedTool(Tools.Select);
                            }}
                            aria-label={`Insert doodle from ${img.collection}`}
                          >
                            <Image
                              src={img.src}
                              alt={`${cls} - ${img.collection}`}
                              width={90}
                              height={90}
                              className="border border-gray-400 rounded-md hover:shadow-lg "
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white px-3 py-1 rounded-md shadow mb-2 z-10"
      >
        {isVisible ? 'Hide Predictions' : 'Show Predictions'}
      </Button>
    </div>
  );
}
