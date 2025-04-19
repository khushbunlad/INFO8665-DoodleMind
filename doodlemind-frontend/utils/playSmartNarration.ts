import { playGeminiNarration, playGenericNarration } from './generateNarration';

let lastLabel = '';
let genericCooldown = 0;

export async function playSmartNarration(
  label: string,
  confidence: number,
  setNarrationText: (text: string) => void
) {
  const CONFIDENCE_THRESHOLD = 0.65;
  const GENERIC_COOLDOWN_LIMIT = 2;

  if (confidence >= CONFIDENCE_THRESHOLD && label !== lastLabel) {
    lastLabel = label;
    await playGeminiNarration(label, setNarrationText);
    genericCooldown = GENERIC_COOLDOWN_LIMIT;
  } else if (genericCooldown <= 0) {
    await playGenericNarration(label, setNarrationText);
    genericCooldown = GENERIC_COOLDOWN_LIMIT;
  } else {
    genericCooldown--;
  }
}
