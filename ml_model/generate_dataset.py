"""
generate_dataset.py
═══════════════════
Generates a synthetic labeled dataset of speech features for training
the Random Forest model.

Since we cannot record 200+ real speeches in 48 hours, this script
creates realistic synthetic data based on well-researched speech quality
ranges from communication research literature.

Labels:
  0 = Poor   — many fillers, bad pace, low energy, lots of pauses
  1 = Average — moderate quality, some issues
  2 = Good    — clear speech, good pace, few fillers, confident delivery

After training, you can REPLACE or AUGMENT this with real recordings
by running: python extract_features.py <your_audio.wav>
and adding the output + your label to the CSV manually.

Usage:
    python generate_dataset.py           # generates dataset.csv (300 samples)
    python generate_dataset.py --samples 500
"""

import numpy as np
import pandas as pd
import argparse
import os

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)


def generate_sample(label: int) -> dict:
    """
    Generate one synthetic feature sample for a given quality label.
    Ranges are based on published speech assessment research.

    Good  (2): 120-160 WPM, 0-2 fillers, 2-5 pauses, consistent pace
    Avg   (1): 90-170 WPM, 3-7 fillers, 5-10 pauses, some inconsistency
    Poor  (0): <90 or >180 WPM, 8+ fillers, 10+ pauses, high inconsistency
    """

    if label == 2:  # ── GOOD ──────────────────────────────────────────────
        wpm              = np.random.uniform(120, 160)
        filler_count     = int(np.random.choice([0, 0, 0, 1, 1, 2, 2, 3]))
        duration         = np.random.uniform(30, 120)
        filler_rate      = filler_count / duration * 60
        pause_count      = int(np.random.randint(2, 6))
        pause_rate       = pause_count / duration * 60
        avg_pause        = np.random.uniform(0.5, 1.2)
        speech_rate_std  = np.random.uniform(5, 20)
        pitch_mean       = np.random.uniform(140, 220)
        pitch_std        = np.random.uniform(15, 40)
        energy_mean      = np.random.uniform(0.04, 0.12)
        energy_std       = np.random.uniform(0.01, 0.04)
        silence_ratio    = np.random.uniform(0.05, 0.20)

    elif label == 1:  # ── AVERAGE ───────────────────────────────────────────
        wpm              = np.random.uniform(90, 175)
        filler_count     = int(np.random.randint(3, 9))
        duration         = np.random.uniform(20, 100)
        filler_rate      = filler_count / duration * 60
        pause_count      = int(np.random.randint(5, 12))
        pause_rate       = pause_count / duration * 60
        avg_pause        = np.random.uniform(0.8, 2.0)
        speech_rate_std  = np.random.uniform(20, 45)
        pitch_mean       = np.random.uniform(110, 260)
        pitch_std        = np.random.uniform(30, 70)
        energy_mean      = np.random.uniform(0.02, 0.09)
        energy_std       = np.random.uniform(0.02, 0.07)
        silence_ratio    = np.random.uniform(0.15, 0.35)

    else:  # ── POOR (label == 0) ────────────────────────────────────────────
        # Too fast, too slow, or highly inconsistent
        wpm_type = np.random.choice(['too_slow', 'too_fast', 'inconsistent'])
        if wpm_type == 'too_slow':
            wpm = np.random.uniform(40, 88)
        elif wpm_type == 'too_fast':
            wpm = np.random.uniform(182, 260)
        else:
            wpm = np.random.uniform(70, 190)

        filler_count     = int(np.random.randint(8, 25))
        duration         = np.random.uniform(10, 80)
        filler_rate      = filler_count / duration * 60
        pause_count      = int(np.random.randint(10, 25))
        pause_rate       = pause_count / duration * 60
        avg_pause        = np.random.uniform(1.5, 4.0)
        speech_rate_std  = np.random.uniform(45, 100)
        pitch_mean       = np.random.uniform(80, 300)
        pitch_std        = np.random.uniform(60, 120)
        energy_mean      = np.random.uniform(0.005, 0.06)
        energy_std       = np.random.uniform(0.04, 0.12)
        silence_ratio    = np.random.uniform(0.30, 0.65)

    return {
        "wpm":                round(wpm, 2),
        "filler_count":       filler_count,
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
        "label":              label,
        "label_name":         ["Poor", "Average", "Good"][label],
    }


def generate_dataset(n_samples: int = 300) -> pd.DataFrame:
    """
    Generate a balanced dataset with equal samples per class.
    n_samples must be divisible by 3.
    """
    per_class = n_samples // 3
    remainder = n_samples % 3

    print(f"[Dataset] Generating {n_samples} samples "
          f"({per_class} per class + {remainder} extra)…")

    rows = []
    for label in [0, 1, 2]:
        count = per_class + (1 if label < remainder else 0)
        for _ in range(count):
            rows.append(generate_sample(label))

    # Shuffle
    df = pd.DataFrame(rows).sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)
    print(f"[Dataset] Generated {len(df)} samples.")
    print(f"[Dataset] Class distribution:\n{df['label_name'].value_counts().to_string()}")
    return df


def add_real_sample(
    audio_path: str,
    label: int,
    csv_path: str = "dataset.csv",
) -> None:
    """
    Extract features from a real audio file and append to the dataset CSV.
    Use this to augment the synthetic data with your own recordings.

    label: 0=Poor, 1=Average, 2=Good
    """
    from extract_features import extract_features
    feats = extract_features(audio_path)
    feats["label"]      = label
    feats["label_name"] = ["Poor", "Average", "Good"][label]

    new_row = pd.DataFrame([feats])
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
        df = pd.concat([df, new_row], ignore_index=True)
    else:
        df = new_row

    df.to_csv(csv_path, index=False)
    print(f"[Dataset] Real sample added to {csv_path} → label={feats['label_name']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate speech quality dataset")
    parser.add_argument("--samples", type=int, default=300,
                        help="Number of synthetic samples to generate (default: 300)")
    parser.add_argument("--output", type=str, default="dataset.csv",
                        help="Output CSV path (default: dataset.csv)")
    args = parser.parse_args()

    df = generate_dataset(args.samples)
    out = os.path.join(os.path.dirname(__file__), args.output)
    df.to_csv(out, index=False)
    print(f"\n[Dataset] Saved to: {out}")
    print(f"[Dataset] Shape: {df.shape}")
    print(f"\nFirst 3 rows:\n{df.head(3).to_string()}")
