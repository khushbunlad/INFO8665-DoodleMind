import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';

const client = new TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'google-key.json'),
});

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

  try {
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Chirp3-HD-Sulafat',
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
      },
    });

    const buffer = Buffer.from(response.audioContent as Uint8Array);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"',
      },
    });
  } catch (e) {
    console.error('[TTS API Error]', e);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}
