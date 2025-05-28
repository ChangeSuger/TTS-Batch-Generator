import { client } from '@gradio/client';
import path from 'path';
import { promises as fs, readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = yaml.load(readFileSync(path.join(__dirname, 'config.yaml'), 'utf-8'));
const example_audios = yaml.load(readFileSync(path.join(__dirname, 'example', 'example_describe.yaml'), 'utf-8'));
const origin_texts = JSON.parse(readFileSync(path.join(__dirname, 'origin_text.json'), 'utf-8'));

const { url, batch, TTS_config } = config;
const {
    origin_lang,
    target_lang,
    slice_method,
    sampling_step,
    speed,
    pause_between_sentences,
    top_k,
    top_p,
    temperature,
} = TTS_config;

async function file_to_buffer(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        console.log('Buffer length:', fileBuffer.length);
        return fileBuffer;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

/**
 *
 * @param {string} emotion
 * @returns {{ audio: string; text: string }}
 */
function get_example_audio(emotion) {
    return example_audios[emotion] || example_audios['default'];
}

/**
 *
 * @param {{ id: string; text: string; emotion: string }} originText
 * @param {number} times
 */
async function tts_wav_generate(originText, times = 3) {
    const { id: textID, text, emotion } = originText;
    const example_audio = get_example_audio(emotion);

    const example_audio_path = path.join(__dirname, 'example', example_audio.audio);

    const example_audio_buffer = await file_to_buffer(example_audio_path);

    const app = await client(url);

    for (let i = 1; i <= times; i++) {
        const result = await app.predict('/get_tts_wav', [
            example_audio_buffer,
            example_audio.text,
            origin_lang,
            text,
            target_lang,
            slice_method,
            top_k,
            top_p,
            temperature,
            false,
            speed,
            false,
            undefined,
            sampling_step,
            false,
            pause_between_sentences,
        ]);

        const audio = await fetch(result.data[0].url);
        const audio_array_buffer = await audio.arrayBuffer();
        const audio_buffer = Buffer.from(audio_array_buffer)

        writeFileSync(path.join(__dirname, 'output', `${textID}_v${i}.wav`), audio_buffer);
    }
}

for (const origin_text of origin_texts) {
    await tts_wav_generate(origin_text, batch);
}
