import { client } from '@gradio/client';
import path from 'path';
import {
    promises as fs,
    readFileSync,
    writeFileSync,
    existsSync,
} from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const EXAMPLE_AUDIO_DIRNAME = 'example';
const INPUT_DIRNAME = 'input';
const OUTPUT_DIRNAME = 'output';
const CONFIG_FILENAME = 'config.yaml';
const EXAMPLE_AUDIO_FILENAME = 'example_describe.yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = yaml.load(
    readFileSync(
        path.join(
            __dirname,
            CONFIG_FILENAME,
        ),
        'utf-8',
    )
);

const example_audios = yaml.load(
    readFileSync(
        path.join(
            __dirname,
            EXAMPLE_AUDIO_DIRNAME,
            EXAMPLE_AUDIO_FILENAME,
        ),
        'utf-8',
    )
);

const {
    url,
    text_file,
    batch,
    max_retry,
    TTS_config,
} = config;

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

const origin_texts = JSON.parse(
    readFileSync(
        path.join(
            __dirname,
            INPUT_DIRNAME,
            text_file,
        ),
        'utf-8',
    )
);

async function file_to_buffer(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        return fileBuffer;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

/**
 *
 * @param {string} emotion
 * @returns {{ audio_file: string; text: string }}
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
    const {
        id: textID,
        text,
        emotion,
    } = originText;

    const example_audio = get_example_audio(emotion);

    const example_audio_path = path.join(
        __dirname,
        'example',
        example_audio.audio_file,
    );

    const example_audio_buffer = await file_to_buffer(example_audio_path);

    let retry_count = 0;
    let batch_count = 0;

    while (retry_count < max_retry) {
        try {
            const app = await client(url);

            while (batch_count < batch) {
                const result_filename = `${textID}_v${batch_count + 1}.wav`;

                // 跳过已经生成的音频。
                if (existsSync(path.join(__dirname, OUTPUT_DIRNAME, result_filename))) {
                    console.log(`【info】audio ${result_filename} is existed, skip generate.`);
                } else {
                    const result = await app.predict(
                        '/get_tts_wav',
                        [
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
                        ],
                    );

                    const audio = await fetch(result.data[0].url);
                    const audio_array_buffer = await audio.arrayBuffer();
                    const audio_buffer = Buffer.from(audio_array_buffer);

                    writeFileSync(
                        path.join(
                            __dirname,
                            OUTPUT_DIRNAME,
                            result_filename,
                        ),
                        audio_buffer,
                    );
                }

                batch_count++;
            }
        } catch (e) {
            console.log(e);
            retry_count++;
        }
    }

}

for (const origin_text of origin_texts) {
    await tts_wav_generate(origin_text, batch);
}
