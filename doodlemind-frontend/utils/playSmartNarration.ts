import { playGeminiNarration, playGenericNarration } from './generateNarration';

let lastLabel = '';
let genericCooldown = 0;

export async function playSmartNarration(label: string, confidence: number) {
  const CONFIDENCE_THRESHOLD = 0.70;
  const GENERIC_COOLDOWN_LIMIT = 2;

  if (confidence >= CONFIDENCE_THRESHOLD && label !== lastLabel) {
    lastLabel = label;
    await playGeminiNarration(label);
    genericCooldown = GENERIC_COOLDOWN_LIMIT;
  } else if (genericCooldown <= 0) {
    await playGenericNarration();
    genericCooldown = GENERIC_COOLDOWN_LIMIT;
  } else {
    genericCooldown--;
  }
}
