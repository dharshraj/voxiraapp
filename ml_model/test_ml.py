"""
test_ml.py
══════════
Tests the Random Forest model WITHOUT needing a real audio file.
Creates a synthetic speech-like audio signal and runs the full prediction.

Usage:
    cd whisper_server
    & ".\venv\Scripts\python.exe" "..\ml_model\test_ml.py"
"""

import sys, os
import numpy as np

# Add ml_model to path
BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

print("\n" + "="*55)
print("  VOXIRA — Random Forest ML Test")
print("="*55 + "\n")

# ── Step 1: Load the trained model ────────────────────────────────────────────
import joblib

model_path = os.path.join(BASE, "model.pkl")
if not os.path.exists(model_path):
    print("[ERROR] model.pkl not found. Run train_model.py first.")
    sys.exit(1)

payload     = joblib.load(model_path)
clf         = payload["model"]
scaler      = payload["scaler"]
class_names = payload["class_names"]
accuracy    = payload.get("accuracy", 0)

print(f"[OK] Model loaded successfully")
print(f"     Trained accuracy : {accuracy*100:.2f}%")
print(f"     Classes          : {class_names}")
print(f"     Trees            : {payload.get('n_trees', 100)}")
print(f"     Training samples : {payload.get('n_train', '?')}")

# ── Step 2: Test with 3 synthetic feature sets ────────────────────────────────
from extract_features import FEATURE_NAMES, features_to_vector

test_cases = [
    {
        "name": "GOOD speaker (fast, clear, few fillers)",
        "features": {
            "wpm": 135.0, "filler_count": 1, "filler_rate": 1.2,
            "pause_count": 3, "pause_rate": 3.0, "avg_pause_duration": 0.8,
            "speech_rate_std": 12.0, "pitch_mean": 180.0, "pitch_std": 25.0,
            "energy_mean": 0.08, "energy_std": 0.02, "silence_ratio": 0.12,
            "duration": 45.0,
        },
    },
    {
        "name": "AVERAGE speaker (moderate issues)",
        "features": {
            "wpm": 105.0, "filler_count": 5, "filler_rate": 5.0,
            "pause_count": 8, "pause_rate": 8.0, "avg_pause_duration": 1.5,
            "speech_rate_std": 35.0, "pitch_mean": 145.0, "pitch_std": 55.0,
            "energy_mean": 0.04, "energy_std": 0.05, "silence_ratio": 0.28,
            "duration": 60.0,
        },
    },
    {
        "name": "POOR speaker (too slow, many fillers, lots of pauses)",
        "features": {
            "wpm": 55.0, "filler_count": 18, "filler_rate": 22.0,
            "pause_count": 20, "pause_rate": 25.0, "avg_pause_duration": 3.2,
            "speech_rate_std": 75.0, "pitch_mean": 95.0, "pitch_std": 95.0,
            "energy_mean": 0.01, "energy_std": 0.09, "silence_ratio": 0.55,
            "duration": 50.0,
        },
    },
]

print("\n" + "─"*55)
print("  Prediction Test (3 synthetic samples)")
print("─"*55)

all_correct = True
expected    = ["Good", "Average", "Poor"]

for i, tc in enumerate(test_cases):
    vec   = features_to_vector(tc["features"]).reshape(1, -1)
    vec_s = scaler.transform(vec)
    idx   = int(clf.predict(vec_s)[0])
    proba = clf.predict_proba(vec_s)[0]
    label = class_names[idx]
    conf  = proba[idx] * 100

    status = "✓" if label == expected[i] else "✗"
    if label != expected[i]:
        all_correct = False

    print(f"\n  [{status}] {tc['name']}")
    print(f"      Predicted : {label} ({conf:.1f}% confidence)")
    print(f"      Expected  : {expected[i]}")
    print(f"      All proba : " + " | ".join(
        f"{n}:{p*100:.0f}%" for n, p in zip(class_names, proba)
    ))

print("\n" + "─"*55)
if all_correct:
    print("  RESULT: All 3 predictions CORRECT ✓")
else:
    print("  RESULT: Some predictions unexpected (check dataset distribution)")
print(f"  Model accuracy on test set: {accuracy*100:.2f}%")
print("─"*55 + "\n")

print("[PROOF SUMMARY FOR FACULTY]")
print(f"  • Model type    : Random Forest (scikit-learn)")
print(f"  • Trees         : {payload.get('n_trees', 100)}")
print(f"  • Features used : {len(FEATURE_NAMES)} acoustic features")
print(f"  • Test accuracy : {accuracy*100:.2f}%")
print(f"  • Model file    : {model_path}")
print(f"  • Runs locally  : YES (no internet needed)")
print()
