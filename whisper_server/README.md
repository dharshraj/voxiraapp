# Voxira — Local Whisper Transcription Server

This is the **local ML component** of Voxira's hybrid speech analysis pipeline.

It runs OpenAI's open-source [Whisper](https://github.com/openai/whisper) model
entirely on your machine — no internet, no API key, no cost.

---

## What it does

| Task | Where it runs |
|---|---|
| Audio → Transcript | **This server (Whisper base, local CPU)** |
| WPM calculation | JavaScript in the app (from transcript) |
| Pace score | JavaScript in the app (from WPM) |
| Filler word count | JavaScript in the app (regex scan) |
| Clarity / Confidence scores | Groq API (cloud) |
| Rephrasing / Feedback | Groq API (cloud) |

---

## Quick Start

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Python | 3.9 or higher | https://python.org |
| ffmpeg | Any recent | https://ffmpeg.org or `winget install ffmpeg` |

> **ffmpeg is required.** Whisper uses it to decode `.m4a` and `.webm` audio files.
> Without it, transcription will fail with a codec error.

### Run (Windows)

```powershell
# From the project root
cd whisper_server
.\start.ps1
```

The script will:
1. Create a Python virtual environment (`venv/`)
2. Install all dependencies
3. Download the Whisper `base` model on first run (~74 MB, cached after that)
4. Start the server on `http://localhost:8000`

### Run (manual / any OS)

```bash
cd whisper_server
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

---

## API

### `GET /health`

Returns server status and loaded model name.

```json
{ "status": "ok", "model": "base" }
```

### `POST /transcribe`

Accepts a multipart audio file upload. Supported formats: `.m4a`, `.webm`, `.wav`, `.mp3`, `.ogg`, `.flac`.

**Request**
```
Content-Type: multipart/form-data
Field name:   audio
```

**Response**
```json
{
  "transcript": "Hello, my name is Alex and today I want to talk about...",
  "words": [
    { "word": "Hello", "start": 0.0,  "end": 0.42 },
    { "word": "my",    "start": 0.44, "end": 0.56 }
  ],
  "duration": 45.2,
  "language": "en"
}
```

---

## Model sizes

Change the model by setting the `WHISPER_MODEL` environment variable before starting:

```powershell
$env:WHISPER_MODEL = "tiny"   # fastest, least accurate (~39 MB)
$env:WHISPER_MODEL = "base"   # recommended for demos (~74 MB)  ← default
$env:WHISPER_MODEL = "small"  # more accurate, slower (~244 MB)
```

---

## Testing on a phone (Expo Go / dev build)

The Expo app on your phone cannot reach `localhost` on your PC. Use your machine's
local network IP instead.

1. Find your PC's IP: run `ipconfig` in PowerShell, look for **IPv4 Address**
   (e.g. `192.168.1.42`)
2. Update `.env` in the project root:
   ```
   EXPO_PUBLIC_WHISPER_SERVER_URL=http://192.168.1.42:8000
   ```
3. Make sure both devices are on the **same Wi-Fi network**
4. Restart the Expo dev server (`npx expo start`)

---

## Hybrid pipeline flow

```
User taps "Analyse"
        │
        ▼
RecordScreen passes audioUri → AnalyzingScreen
        │
        ├── [LOCAL ML — no internet] ────────────────────────────────────┐
        │   POST /transcribe (this server)                               │
        │   Whisper base model processes audio on CPU                    │
        │   Returns: transcript, word timings, duration                  │
        │   App calculates: WPM, pace score, filler word counts          │
        └── [GROQ API — cloud] ───────────────────────────────────────── ┤
            analyzeSpeech(transcript)                                     │
            Groq llama-3.3-70b scores clarity, confidence, structure     │
            Returns: scores, rephrasing, feedback, improvement tips       │
                                                                          │
        Both finish → results merged → single TranscriptResultScreen ◄──┘
```

---

## Troubleshooting

**`Network request failed` in the app**
- The server is not running. Start it with `.\start.ps1`
- Check the URL in `.env` — use your LAN IP when testing on a phone

**`FileNotFoundError: ffmpeg`**
- Install ffmpeg: `winget install ffmpeg` (Windows) or `brew install ffmpeg` (Mac)
- Restart the server after installing

**First transcription is slow**
- Whisper downloads model weights on the first call (~74 MB for `base`)
- Subsequent calls are fast — model stays loaded in memory

**`CUDA / GPU errors`**
- The server uses `fp16=False` so it runs on CPU by default — no GPU needed
- If you have a CUDA GPU and want to use it, set `fp16=True` in `main.py`
