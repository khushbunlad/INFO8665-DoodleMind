import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCachedNarration, setCachedNarration } from './narrationCache';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyAirKVK_MfSl7YspVHYgOTEGwilRW5p1UY'
);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

export async function generateNarrationText(label: string): Promise<string> {
  const prompt = `You're a friendly kids drawing coach. A child is drawing something that looks like a '${label}'. Generate a short, playful sentence for narration that includes a fun emoji relevant to the object or mood. Keep it short and kid-friendly.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  return text || `That looks like a ${label}!`;
}

const genericTemplates = [
  "You're doing great! 🎉",
  'Keep going, artist! 🖌️',
  'I love how this is turning out! 😍',
  'Nice lines! ✏️',
  'This is fun to watch! 😄',
  'Hmm... what could it be? 🤔',
  "You're onto something cool! 🧠",
  'That’s coming along nicely! 🧩',
  "I think you're cooking up something awesome! 🍳",
  "You're drawing like a pro! 🧑‍🎨",
  'That looks like a ${label}! 👀',
  'Hmm, is that a ${label} I see? 👓',
  'Could it be... a ${label}? 🧐',
  'Looks a lot like a ${label} to me! 🤩',
];

function stripEmojis(text: string): string {
  return (
    text
      // remove all Emoji characters (including joined sequences & variation selectors)
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200d]+/gu, '')
      // remove single and double quotes
      .replace(/['"]/g, '')
      .trim()
  );
}

export async function playGenericNarration(
  label?: string,
  setNarrationText?: (text: string) => void
) {
  // prevent overlapping
  if (isPlaying) return;
  isPlaying = true;

  // pick your narration text
  let text = '';
  const MAX_TRIES = 10;
  for (let i = 0; i < MAX_TRIES; i++) {
    const template = genericTemplates[Math.floor(Math.random() * genericTemplates.length)];
    if (!label && template.includes('${label}')) continue;
    text = label ? template.replace('${label}', label) : template;
    if (!text.includes('${label}')) break;
  }
  if (!text || text.includes('${label}')) text = "You're doing great!";

  // check cache
  const cached = getCachedNarration(text);
  if (cached) {
    setNarrationText?.('');
    setTimeout(() => setNarrationText?.(text), 100);

    currentAudio = new Audio(cached);
    currentAudio.onended = () => {
      isPlaying = false;
      currentAudio = null;
    };
    return currentAudio.play();
  }

  // fetch TTS
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: stripEmojis(text) }),
  });
  const buffer = await res.arrayBuffer();
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
  setCachedNarration(text, blobUrl);

  // update UI
  setNarrationText?.('');
  setTimeout(() => {
    console.log('setting narration text', text);
    setNarrationText?.(text);
  }, 50);

  // play audio
  currentAudio = new Audio(blobUrl);
  currentAudio.onended = () => {
    isPlaying = false;
    currentAudio = null;
  };
  await currentAudio.play();
}

export async function playGeminiNarration(
  label: string,
  setNarrationText?: (text: string) => void
) {
  // bail out immediately if something is already playing
  if (isPlaying) return;
  isPlaying = true;

  const cached = getCachedNarration(label);
  let text: string;
  let blobUrl: string;

  if (cached) {
    blobUrl = cached;
  } else {
    // generate narration and fetch TTS
    text = await generateNarrationText(label);
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: stripEmojis(text) }),
    });
    const buffer = await res.arrayBuffer();
    blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }));
    setCachedNarration(label, blobUrl);
  }

  // trigger your UI update
  if (!cached) {
    setNarrationText?.('');
    setTimeout(() => setNarrationText?.(text!), 50);
  }

  // now play, and clear the flag when done
  currentAudio = new Audio(blobUrl);
  currentAudio.onended = () => {
    isPlaying = false;
    currentAudio = null;
  };
  await currentAudio.play();
}
