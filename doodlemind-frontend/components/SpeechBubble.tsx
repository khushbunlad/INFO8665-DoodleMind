'use client';
import React from 'react';

type SpeechBubbleProps = {
  message: string;
};

function getBubbleColor(message: string) {
  if (message.includes('🎉')) return { bg: 'bg-pink-100', border: 'border-pink-100' };
  if (message.includes('🤔')) return { bg: 'bg-blue-100', border: 'border-blue-100' };
  if (message.includes('🍳')) return { bg: 'bg-orange-100', border: 'border-orange-100' };
  if (message.includes('🧠')) return { bg: 'bg-purple-100', border: 'border-purple-100' };
  if (message.includes('🚀')) return { bg: 'bg-indigo-100', border: 'border-indigo-100' };
  if (message.includes('🐱') || message.includes('🐶'))
    return { bg: 'bg-yellow-100', border: 'border-yellow-100' };

  return { bg: 'bg-yellow-100', border: 'border-yellow-100' };
}

export default function SpeechBubble({ message }: SpeechBubbleProps) {
  const { bg, border } = getBubbleColor(message);

  return message ? (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
      <div
        className={`relative ${bg} rounded-3xl px-6 py-4 max-w-md text-center text-xl font-bold text-gray-800 shadow-xl animate-bubble`}
      >
        {message}
        <div
          className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[14px] ${border}`}
        ></div>
      </div>
    </div>
  ) : null;
}
