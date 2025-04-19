import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedNarration, setCachedNarration } from './narrationCache';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyAirKVK_MfSl7YspVHYgOTEGwilRW5p1UY'
);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function generateNarrationText(label: string): Promise<string> {
  const prompt = `You're a friendly kids drawing coach. A child is drawing something that looks like a '${label}'. Generate a short, playful sentence for narration.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  return text || `That looks like a ${label}!`;
}

const genericTemplates = [
  "You're doing great!",
  'Keep going, artist!',
  'I love how this is turning out!',
  'Nice lines!',
  'This is fun to watch!',
  'Hmm... what could it be?',
  "You're onto something cool!",
  'That’s coming along nicely!',
  "I think you're cooking up something awesome!",
  "You're drawing like a pro!",
  'That looks like a ${label}!',
  'Hmm, is that a ${label} I see?',
  'Could it be... a ${label}?',
  'Looks a lot like a ${label} to me!',
];

export async function playGenericNarration(label?: string) {
  let text = '';
  const MAX_TRIES = 10;

  for (let i = 0; i < MAX_TRIES; i++) {
    const template = genericTemplates[Math.floor(Math.random() * genericTemplates.length)];

    if (!label && template.includes('${label}')) {
      continue;
    }

    text = label ? template.replace('${label}', label) : template;
    break;
  }

  if (!text) text = "You're doing great!";

  const cached = getCachedNarration(text);
  if (cached) return new Audio(cached).play();

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const buffer = await res.arrayBuffer();
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
  setCachedNarration(text, blobUrl);
  new Audio(blobUrl).play();
}

export async function playGeminiNarration(label: string) {
  const cached = getCachedNarration(label);
  if (cached) return new Audio(cached).play();

  generateNarrationText(label).then(async (text) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const buffer = await res.arrayBuffer();
    const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
    setCachedNarration(label, blobUrl);
    new Audio(blobUrl).play();
  });
}
