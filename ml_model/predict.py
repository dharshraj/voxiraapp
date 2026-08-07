"""
predict.py
══════════
Loads the trained model.pkl and predicts speech quality from an audio file.
Used by the FastAPI server to serve predictions to the app.

Usage (CLI):
    python predict.py path/to/audio.wav

Returns JSON:
    {
      "label":       "Good",
      "label_index": 2,
      "confidence":  0.87,
      "probabilities": { "Poor": 0.05, "Average": 0.08, "Good": 0.87 },
      "features":    { ... }
    }
"""

import os
import json
import joblib
import numpy as np
from extract_features import extract_features, features_to_vector

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_PKL = os.path.join(BASE_DIR, "model.pkl")

# ── Load model once at import time ────────────────────────────────────────────
_payload = None

def _load_model():
    global _payload
    if _payload is None:
        if not os.path.exists(MODEL_PKL):
            raise FileNotFoundError(
                f"model.pkl not found at {MODEL_PKL}. "
                "Run: python train_model.py"
            )
        print(f"[Predict] Loading model from {MODEL_PKL}…")
        _payload = joblib.load(MODEL_PKL)
        acc = _payload.get("accuracy", 0)
        print(f"[Predict] Model loaded — test accuracy: {acc*100:.2f}%")
    return _payload


def predict_from_features(features: dict) -> dict:
    """
    Run prediction from an already-extracted feature dict.
    Used by the FastAPI server (Whisper already ran, features are ready).
    """
    payload = _load_model()
    clf     = payload["model"]
    scaler  = payload["scaler"]

    vec     = features_to_vector(features).reshape(1, -1)
    vec_s   = scaler.transform(vec)

    label_idx   = int(clf.predict(vec_s)[0])
    proba       = clf.predict_proba(vec_s)[0]
    class_names = payload["class_names"]

    confidence  = float(proba[label_idx])
    proba_dict  = {name: round(float(p), 4) for name, p in zip(class_names, proba)}

    result = {
        "label":         class_names[label_idx],
        "label_index":   label_idx,
        "confidence":    round(confidence, 4),
        "probabilities": proba_dict,
        "model_accuracy": round(payload.get("accuracy", 0), 4),
    }

    print(f"[Predict] → {result['label']} ({result['confidence']*100:.1f}% confidence) | "
          f"proba={proba_dict}")
    return result


def predict_from_audio(audio_path: str) -> dict:
    """
    Full pipeline: audio file → features → prediction.
    """
    features = extract_features(audio_path, use_whisper=True)
    result   = predict_from_features(features)
    result["features"] = features
    return result


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python predict.py <audio_file>")
        sys.exit(1)

    out = predict_from_audio(sys.argv[1])
    print("\nPrediction Result:")
    print(json.dumps(out, indent=2))
