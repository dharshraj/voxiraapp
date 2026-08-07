"""
Voxira — Local Whisper + Random Forest Server
═══════════════════════════════════════════════
Two endpoints:

  POST /transcribe        — Whisper transcription only (legacy / testing)
  POST /analyze-speech    — Full ML pipeline:
                              1. Whisper transcribes audio  (local, free)
                              2. librosa extracts 13 features
                              3. Random Forest predicts quality label
                            Returns everything the app needs in one call.
  GET  /health            — Server status

Start:
    python main.py
"""

import os, sys, tempfile, time, logging
import whisper
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict

# ── Allow importing from ml_model/ ───────────────────────────────────────────
ML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ml_model')
if ML_DIR not in sys.path:
    sys.path.insert(0, ML_DIR)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("voxira_server")

# ── Load Whisper model ────────────────────────────────────────────────────────
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
log.info(f"Loading Whisper '{MODEL_SIZE}' model…")
_t = time.time()
whisper_model = whisper.load_model(MODEL_SIZE)
log.info(f"Whisper '{MODEL_SIZE}' loaded in {time.time()-_t:.1f}s")

# ── Load Random Forest model (optional — works without it) ───────────────────
_rf_payload = None

def _load_rf():
    global _rf_payload
    if _rf_payload is not None:
        return _rf_payload
    try:
        import joblib
        model_path = os.path.join(ML_DIR, "model.pkl")
        if os.path.exists(model_path):
            _rf_payload = joblib.load(model_path)
            acc = _rf_payload.get("accuracy", 0)
            log.info(f"Random Forest model loaded — accuracy: {acc*100:.2f}%")
        else:
            log.warning("model.pkl not found — run: cd ml_model && python train_model.py")
    except Exception as e:
        log.warning(f"Could not load RF model: {e}")
    return _rf_payload

_load_rf()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Voxira ML Server", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["POST", "GET"], allow_headers=["*"],
)

# ── Pydantic response models ──────────────────────────────────────────────────

class WordTiming(BaseModel):
    word:  str
    start: float
    end:   float

class TranscriptResponse(BaseModel):
    transcript: str
    words:      List[WordTiming]
    duration:   float
    language:   Optional[str] = None

class MLPrediction(BaseModel):
    label:          str               # "Good" | "Average" | "Poor"
    label_index:    int               # 2 | 1 | 0
    confidence:     float             # 0.0 – 1.0
    probabilities:  Dict[str, float]  # { "Good": 0.87, "Average": 0.08, "Poor": 0.05 }
    model_accuracy: float             # reported test accuracy of the trained model

class AnalysisResponse(BaseModel):
    # ── From Whisper (local ML) ──────────────────────────────────────────────
    transcript:      str
    words:           List[WordTiming]
    duration:        float
    language:        Optional[str]  = None
    # ── Computed locally in Python (no API) ──────────────────────────────────
    wpm:             float
    filler_count:    int
    filler_rate:     float
    pace_score:      int
    filler_breakdown: Dict[str, int]
    # ── Random Forest prediction ──────────────────────────────────────────────
    ml_prediction:   Optional[MLPrediction] = None
    ml_available:    bool = False
    # ── Raw features (for faculty transparency) ───────────────────────────────
    features:        Dict[str, float]

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    rf = _load_rf()
    return {
        "status":       "ok",
        "whisper_model": MODEL_SIZE,
        "rf_loaded":    rf is not None,
        "rf_accuracy":  round(rf.get("accuracy", 0) * 100, 2) if rf else None,
    }

# ── /transcribe  (legacy endpoint kept for compatibility) ────────────────────

@app.post("/transcribe", response_model=TranscriptResponse)
async def transcribe(audio: UploadFile = File(...)):
    log.info(f"/transcribe — file={audio.filename!r}")
    tmp_path = None
    try:
        suffix = _ext(audio)
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name
        result   = _run_whisper(tmp_path)
        transcript, words, duration, language = _parse_whisper(result)
        return TranscriptResponse(transcript=transcript, words=words,
                                   duration=duration, language=language)
    except Exception as e:
        log.exception("/transcribe failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        _cleanup(tmp_path)

# ── /analyze-speech  (main endpoint used by the app) ─────────────────────────

@app.post("/analyze-speech", response_model=AnalysisResponse)
async def analyze_speech(audio: UploadFile = File(...)):
    """
    Full local ML pipeline:
      1. Save upload to temp file
      2. Whisper transcribes → transcript + word timings
      3. librosa extracts 13 acoustic features
      4. Random Forest predicts Good / Average / Poor
      5. Return everything merged — one response, zero external APIs
    """
    log.info(f"/analyze-speech — file={audio.filename!r} type={audio.content_type}")
    tmp_path = None
    try:
        suffix = _ext(audio)
        content = await audio.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        log.info(f"Saved {len(content)} bytes → {tmp_path}")

        # ── Step 1: Whisper transcription ─────────────────────────────────────
        t0     = time.time()
        result = _run_whisper(tmp_path)
        transcript, words, duration, language = _parse_whisper(result)
        log.info(f"Whisper done in {time.time()-t0:.2f}s | "
                 f"words={len(words)} | duration={duration:.1f}s")

        # ── Step 2: Extract features via librosa + transcript ─────────────────
        t1 = time.time()
        try:
            from extract_features import extract_features, FEATURE_NAMES
            # Pass the transcript so extract_features doesn't re-run Whisper
            features = _extract_with_transcript(tmp_path, transcript, result, duration)
        except Exception as fe:
            log.warning(f"Feature extraction failed: {fe} — using computed fallback")
            features = _fallback_features(transcript, duration, result)

        log.info(f"Features done in {time.time()-t1:.2f}s")

        # ── Step 3: Derived metrics ───────────────────────────────────────────
        wpm             = features.get("wpm", 0.0)
        filler_count    = int(features.get("filler_count", 0))
        filler_rate     = features.get("filler_rate", 0.0)
        pace_score      = _calc_pace_score(wpm)
        filler_breakdown = _count_fillers(transcript)

        # ── Step 4: Random Forest prediction ──────────────────────────────────
        ml_prediction = None
        ml_available  = False
        rf = _load_rf()
        if rf is not None:
            try:
                from extract_features import features_to_vector
                vec   = features_to_vector(features).reshape(1, -1)
                vec_s = rf["scaler"].transform(vec)
                clf   = rf["model"]
                idx   = int(clf.predict(vec_s)[0])
                proba = clf.predict_proba(vec_s)[0]
                names = rf["class_names"]
                ml_prediction = MLPrediction(
                    label          = names[idx],
                    label_index    = idx,
                    confidence     = round(float(proba[idx]), 4),
                    probabilities  = {n: round(float(p), 4) for n, p in zip(names, proba)},
                    model_accuracy = round(float(rf.get("accuracy", 0)), 4),
                )
                ml_available = True
                log.info(f"RF prediction → {ml_prediction.label} "
                         f"({ml_prediction.confidence*100:.1f}%)")
            except Exception as re:
                log.warning(f"RF prediction failed: {re}")

        return AnalysisResponse(
            transcript       = transcript,
            words            = words,
            duration         = duration,
            language         = language,
            wpm              = round(wpm, 2),
            filler_count     = filler_count,
            filler_rate      = round(filler_rate, 4),
            pace_score       = pace_score,
            filler_breakdown = filler_breakdown,
            ml_prediction    = ml_prediction,
            ml_available     = ml_available,
            features         = {k: round(float(v), 4) for k, v in features.items()
                                 if isinstance(v, (int, float))},
        )

    except Exception as e:
        log.exception("/analyze-speech failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        _cleanup(tmp_path)

# ── Internal helpers ──────────────────────────────────────────────────────────

def _run_whisper(path: str) -> dict:
    return whisper_model.transcribe(
        path, word_timestamps=True, language=None, fp16=False, verbose=False,
    )

def _parse_whisper(result: dict):
    transcript = (result.get("text") or "").strip()
    language   = result.get("language")
    words: List[WordTiming] = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            wt = (w.get("word") or "").strip()
            if wt:
                words.append(WordTiming(
                    word  = wt,
                    start = round(float(w.get("start", 0)), 3),
                    end   = round(float(w.get("end", 0)), 3),
                ))
    duration = words[-1].end if words else (
        float(result["segments"][-1].get("end", 0)) if result.get("segments") else 0.0
    )
    return transcript, words, round(duration, 2), language

def _extract_with_transcript(path: str, transcript: str, result: dict, duration: float) -> dict:
    """
    Call extract_features but inject the already-computed Whisper result
    so Whisper doesn't run twice.
    """
    import re, numpy as np
    from extract_features import (
        extract_features, FILLER_WORDS, MIN_PAUSE_DURATION,
        SILENCE_THRESHOLD_DB, _detect_pauses,
    )
    import librosa

    # librosa features
    y, sr       = librosa.load(path, sr=16000, mono=True)
    f0, vf, _   = librosa.pyin(y, fmin=librosa.note_to_hz('C2'),
                                fmax=librosa.note_to_hz('C7'), sr=sr)
    voiced_f0   = f0[vf] if vf is not None else np.array([])
    rms         = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    rms_db      = librosa.amplitude_to_db(rms, ref=np.max) if np.max(rms) > 0 else rms * 0
    hop_dur     = 512 / sr
    is_silent   = rms_db < SILENCE_THRESHOLD_DB
    pauses      = _detect_pauses(is_silent, hop_dur, MIN_PAUSE_DURATION)

    pitch_mean  = float(np.mean(voiced_f0))  if len(voiced_f0) > 0 else 0.0
    pitch_std   = float(np.std(voiced_f0))   if len(voiced_f0) > 0 else 0.0
    energy_mean = float(np.mean(rms))
    energy_std  = float(np.std(rms))
    silence_ratio = float(np.sum(is_silent) / len(is_silent)) if len(is_silent) > 0 else 0.0
    pause_count   = len(pauses)
    avg_pause     = float(np.mean(pauses)) if pauses else 0.0
    pause_rate    = (pause_count / duration * 60) if duration > 0 else 0.0

    # WPM + fillers from pre-computed transcript
    words_list  = transcript.lower().split()
    word_count  = len([w for w in words_list if re.match(r"[a-z]", w)])
    wpm         = (word_count / duration * 60) if duration > 0 else 0.0

    text_lower  = transcript.lower()
    filler_cnt  = 0
    for phrase in sorted(FILLER_WORDS, key=len, reverse=True):
        pat = (rf"(?<!\w){re.escape(phrase)}(?!\w)" if ' ' in phrase
               else rf"\b{re.escape(phrase)}\b")
        m = re.findall(pat, text_lower)
        filler_cnt += len(m)
        text_lower  = re.sub(pat, ' ' * len(phrase), text_lower)

    filler_rate = (filler_cnt / duration * 60) if duration > 0 else 0.0

    seg_wpms = []
    for seg in result.get("segments", []):
        sd = seg.get("end", 0) - seg.get("start", 0)
        sw = len((seg.get("text") or "").split())
        if sd > 0.5:
            seg_wpms.append(sw / sd * 60)
    speech_rate_std = float(np.std(seg_wpms)) if len(seg_wpms) > 1 else 0.0

    return {
        "wpm":                round(wpm, 2),
        "filler_count":       filler_cnt,
        "filler_rate":        round(filler_rate, 4),
        "pause_count":        pause_count,
        "pause_rate":         round(pause_rate, 4),
        "avg_pause_duration": round(avg_pause, 4),
        "speech_rate_std":    round(speech_rate_std, 4),
        "pitch_mean":         round(pitch_mean, 2),
        "pitch_std":          round(pitch_std, 2),
        "energy_mean":        round(energy_mean, 6),
        "energy_std":         round(energy_std, 6),
        "silence_ratio":      round(silence_ratio, 4),
        "duration":           round(duration, 2),
    }

def _fallback_features(transcript: str, duration: float, result: dict) -> dict:
    """Minimal feature set when librosa fails."""
    import re
    words     = [w for w in transcript.lower().split() if re.match(r"[a-z]", w)]
    wpm       = (len(words) / duration * 60) if duration > 0 else 0.0
    fillers   = sum(1 for w in words if w in {
        'um','uh','like','basically','literally','actually','so','right','okay','well'
    })
    return {
        "wpm": round(wpm, 2), "filler_count": fillers,
        "filler_rate": round((fillers/duration*60) if duration > 0 else 0, 4),
        "pause_count": 0, "pause_rate": 0.0, "avg_pause_duration": 0.0,
        "speech_rate_std": 0.0, "pitch_mean": 0.0, "pitch_std": 0.0,
        "energy_mean": 0.0, "energy_std": 0.0, "silence_ratio": 0.0,
        "duration": round(duration, 2),
    }

FILLER_LIST = [
    'you know','i mean','kind of','sort of','basically','literally',
    'actually','seriously','honestly','obviously','totally',
    'like','right','okay','well','so','um','uh','er','hmm','mm',
]

def _count_fillers(transcript: str) -> Dict[str, int]:
    import re
    text    = transcript.lower()
    result  = {}
    for phrase in FILLER_LIST:
        pat = (rf"(?<!\w){re.escape(phrase)}(?!\w)" if ' ' in phrase
               else rf"\b{re.escape(phrase)}\b")
        m = re.findall(pat, text)
        if m:
            result[phrase] = len(m)
            text = re.sub(pat, ' ' * len(phrase), text)
    return result

def _calc_pace_score(wpm: float) -> int:
    if wpm == 0:
        return 60
    return int(max(40, min(100, round(100 - abs(wpm - 130) / 1.5))))

def _ext(upload: UploadFile) -> str:
    if upload.filename:
        _, e = os.path.splitext(upload.filename)
        if e:
            return e
    ct = upload.content_type or ""
    for mime, ext in [("audio/webm",".webm"),("audio/m4a",".m4a"),
                      ("audio/mp4",".mp4"),("audio/mpeg",".mp3"),
                      ("audio/wav",".wav"),("audio/ogg",".ogg")]:
        if mime in ct:
            return ext
    return ".webm"

def _cleanup(path):
    try:
        if path and os.path.exists(path):
            os.unlink(path)
    except Exception:
        pass

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    log.info(f"Starting Voxira ML Server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
