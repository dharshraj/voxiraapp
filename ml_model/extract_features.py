"""
extract_features.py
═══════════════════
Extracts numerical features from a speech audio file.
These features are what the Random Forest model trains on and predicts from.

Features extracted:
  1.  wpm                 — words per minute (from Whisper transcript)
  2.  filler_count        — total filler words (um, uh, like, etc.)
  3.  filler_rate         — fillers per minute
  4.  pause_count         — number of silent pauses > 0.5s
  5.  pause_rate          — pauses per minute
  6.  avg_pause_duration  — mean pause length in seconds
  7.  speech_rate_std     — std dev of word-by-word speaking rate (consistency)
  8.  pitch_mean          — mean fundamental frequency (Hz)
  9.  pitch_std           — pitch variation
  10. energy_mean         — mean RMS energy (loudness)
  11. energy_std          — energy variation
  12. silence_ratio       — fraction of audio that is silence
  13. duration            — total recording duration (seconds)
"""

import numpy as np
import librosa
import whisper
import re
from typing import Optional

# ── Constants ─────────────────────────────────────────────────────────────────

FILLER_WORDS = {
    'um', 'uh', 'hmm', 'mm', 'like', 'basically', 'literally',
    'actually', 'so', 'right', 'okay', 'well', 'you know',
    'i mean', 'kind of', 'sort of', 'er', 'mhm',
}

SILENCE_THRESHOLD_DB = -40   # dBFS below which a frame is considered silent
MIN_PAUSE_DURATION   = 0.5   # seconds — shorter gaps are not counted as pauses

# ── Whisper model (loaded once, reused) ───────────────────────────────────────

_whisper_model: Optional[whisper.Whisper] = None

def get_whisper_model(size: str = "base") -> whisper.Whisper:
    global _whisper_model
    if _whisper_model is None:
        print(f"[Features] Loading Whisper '{size}' model…")
        _whisper_model = whisper.load_model(size)
        print("[Features] Whisper model loaded.")
    return _whisper_model


# ── Main extraction function ──────────────────────────────────────────────────

def extract_features(audio_path: str, use_whisper: bool = True) -> dict:
    """
    Extract all speech features from an audio file.

    Parameters
    ----------
    audio_path : str   Path to audio file (.wav, .m4a, .webm, .mp3, etc.)
    use_whisper: bool  If True, transcribe with Whisper to get WPM + fillers.
                       Set False to skip transcription (faster, but wpm=0).

    Returns
    -------
    dict  Feature dictionary. Keys match FEATURE_NAMES.
    """
    print(f"[Features] Extracting from: {audio_path}")

    # ── Load audio with librosa ───────────────────────────────────────────────
    y, sr = librosa.load(audio_path, sr=16000, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)
    print(f"[Features] Duration: {duration:.2f}s | Sample rate: {sr}Hz")

    # ── Pitch (fundamental frequency) ────────────────────────────────────────
    f0, voiced_flag, _ = librosa.pyin(
        y, fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C7'),
        sr=sr,
    )
    voiced_f0 = f0[voiced_flag] if voiced_flag is not None else np.array([])
    pitch_mean = float(np.mean(voiced_f0))   if len(voiced_f0) > 0 else 0.0
    pitch_std  = float(np.std(voiced_f0))    if len(voiced_f0) > 0 else 0.0

    # ── Energy (RMS) ──────────────────────────────────────────────────────────
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    energy_mean = float(np.mean(rms))
    energy_std  = float(np.std(rms))

    # ── Silence / pause detection ─────────────────────────────────────────────
    # Convert RMS to dBFS, find silent frames, group into pauses
    rms_db = librosa.amplitude_to_db(rms, ref=np.max) if np.max(rms) > 0 else rms * 0
    hop_duration = 512 / sr   # seconds per frame

    is_silent = rms_db < SILENCE_THRESHOLD_DB
    pauses = _detect_pauses(is_silent, hop_duration, MIN_PAUSE_DURATION)

    pause_count        = len(pauses)
    pause_rate         = (pause_count / duration * 60) if duration > 0 else 0
    avg_pause_duration = float(np.mean(pauses)) if pauses else 0.0
    silence_ratio      = float(np.sum(is_silent) / len(is_silent)) if len(is_silent) > 0 else 0.0

    # ── Transcript + WPM + fillers (via Whisper) ──────────────────────────────
    wpm          = 0.0
    filler_count = 0
    filler_rate  = 0.0
    speech_rate_std = 0.0
    transcript   = ""

    if use_whisper:
        model  = get_whisper_model()
        result = model.transcribe(audio_path, word_timestamps=True, fp16=False, verbose=False)
        transcript = (result.get("text") or "").strip()

        words = transcript.lower().split()
        word_count = len([w for w in words if re.match(r"[a-z]", w)])
        wpm = (word_count / duration * 60) if duration > 0 else 0.0

        # Filler count
        text_lower = transcript.lower()
        for phrase in sorted(FILLER_WORDS, key=len, reverse=True):
            pattern = (
                rf"(?<!\w){re.escape(phrase)}(?!\w)"
                if ' ' in phrase
                else rf"\b{re.escape(phrase)}\b"
            )
            matches = re.findall(pattern, text_lower)
            filler_count += len(matches)
            text_lower = re.sub(pattern, ' ' * len(phrase), text_lower)

        filler_rate = (filler_count / duration * 60) if duration > 0 else 0.0

        # Speech rate consistency — std dev of per-segment WPM
        segment_wpms = []
        for seg in result.get("segments", []):
            seg_dur = seg.get("end", 0) - seg.get("start", 0)
            seg_words = len((seg.get("text") or "").split())
            if seg_dur > 0.5:
                segment_wpms.append(seg_words / seg_dur * 60)
        speech_rate_std = float(np.std(segment_wpms)) if len(segment_wpms) > 1 else 0.0

    features = {
        "wpm":                 round(wpm, 2),
        "filler_count":        filler_count,
        "filler_rate":         round(filler_rate, 4),
        "pause_count":         pause_count,
        "pause_rate":          round(pause_rate, 4),
        "avg_pause_duration":  round(avg_pause_duration, 4),
        "speech_rate_std":     round(speech_rate_std, 4),
        "pitch_mean":          round(pitch_mean, 2),
        "pitch_std":           round(pitch_std, 2),
        "energy_mean":         round(float(energy_mean), 6),
        "energy_std":          round(float(energy_std), 6),
        "silence_ratio":       round(silence_ratio, 4),
        "duration":            round(duration, 2),
    }

    print(f"[Features] Done → wpm={features['wpm']} filler={features['filler_count']} "
          f"pause={features['pause_count']} pitch={features['pitch_mean']:.1f}Hz")
    return features


# ── Feature names in fixed order (used by model) ─────────────────────────────

FEATURE_NAMES = [
    "wpm", "filler_count", "filler_rate",
    "pause_count", "pause_rate", "avg_pause_duration",
    "speech_rate_std", "pitch_mean", "pitch_std",
    "energy_mean", "energy_std", "silence_ratio", "duration",
]


def features_to_vector(feat: dict) -> np.ndarray:
    """Convert feature dict to numpy array in the fixed model order."""
    return np.array([feat.get(k, 0.0) for k in FEATURE_NAMES], dtype=np.float32)


# ── Pause detection helper ────────────────────────────────────────────────────

def _detect_pauses(is_silent: np.ndarray, hop_duration: float, min_duration: float) -> list:
    """
    Given a boolean array of silent frames, return a list of pause durations
    (in seconds) for pauses longer than min_duration.
    """
    pauses = []
    count  = 0
    for silent in is_silent:
        if silent:
            count += 1
        else:
            if count * hop_duration >= min_duration:
                pauses.append(count * hop_duration)
            count = 0
    if count * hop_duration >= min_duration:
        pauses.append(count * hop_duration)
    return pauses


# ── CLI usage ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys, json
    if len(sys.argv) < 2:
        print("Usage: python extract_features.py <audio_file>")
        sys.exit(1)
    feats = extract_features(sys.argv[1])
    print("\nExtracted features:")
    for k, v in feats.items():
        print(f"  {k:25s}: {v}")
