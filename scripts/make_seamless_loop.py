"""
Trims a long tanpura recording down to a short, seamlessly-loopable clip.

Technique: pick a loop window [T0, T1] whose edges fall in quiet moments
(the natural decay/silence between plucks), then crossfade the tail
[T1-C, T1] against the pre-roll [T0-C, T0] -- the audio that *originally*
preceded T0 in the source recording. Because the pre-roll is the true
predecessor of T0, splicing the crossfaded tail into a restart at T0 is
continuous by construction. Several candidate (T0, T1) pairs are rendered
and empirically scored (by decoding the real encoded output and measuring
the actual wrap-point sample jump) since codec edge effects on the final
opus file can't be predicted from the source waveform alone -- rendering
and measuring is more reliable than any static heuristic.

Usage: python make_seamless_loop.py <input> <output> [--bitrate 128k] [--candidates 4]
"""

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np

FFMPEG = r"C:\Users\a5149169\AppData\Roaming\Python\Python313\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

ANALYSIS_SR = 8000
LOOP_LENGTH = 180.0          # seconds of final loop content
CROSSFADE = 1.5              # seconds
MARGIN = 1.0                 # extra seconds either side of the crossfade window
SEARCH_T0_RANGE = (20.0, 50.0)
T1_OFFSET_RANGE = (LOOP_LENGTH - 12, LOOP_LENGTH + 12)
ANALYSIS_END = SEARCH_T0_RANGE[1] + T1_OFFSET_RANGE[1] + 5
MIN_CANDIDATE_SEPARATION = 3.0  # seconds, keeps candidates from clustering


def decode_mono_pcm(path: str, start: float, end: float, sr: int = ANALYSIS_SR) -> np.ndarray:
    cmd = [
        FFMPEG, "-v", "error", "-ss", str(start), "-to", str(end), "-i", path,
        "-ac", "1", "-ar", str(sr), "-f", "f32le", "-",
    ]
    raw = subprocess.run(cmd, stdout=subprocess.PIPE, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def decode_full_pcm(path: str, sr: int = 48000) -> np.ndarray:
    cmd = [FFMPEG, "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, stdout=subprocess.PIPE, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def rms_envelope(samples: np.ndarray, sr: int, hop_s: float = 0.005, win_s: float = 0.02):
    hop = max(1, int(hop_s * sr))
    win = max(1, int(win_s * sr))
    n = (len(samples) - win) // hop
    env = np.empty(n, dtype=np.float64)
    for i in range(n):
        seg = samples[i * hop : i * hop + win]
        env[i] = np.sqrt(np.mean(seg.astype(np.float64) ** 2))
    times = (np.arange(n) * hop) / sr
    return times, env


def top_valleys(times: np.ndarray, env: np.ndarray, lo: float, hi: float, k: int, min_sep: float):
    mask = (times >= lo) & (times <= hi)
    idx = np.where(mask)[0]
    if len(idx) == 0:
        return [(lo + hi) / 2]
    order = idx[np.argsort(env[idx])]
    chosen = []
    for i in order:
        t = float(times[i])
        if all(abs(t - c) >= min_sep for c in chosen):
            chosen.append(t)
        if len(chosen) >= k:
            break
    return chosen or [float(times[order[0]])]


def candidate_pairs(path: str, n_candidates: int):
    samples = decode_mono_pcm(path, 0.0, ANALYSIS_END)
    times, env = rms_envelope(samples, ANALYSIS_SR)

    t0_candidates = top_valleys(times, env, *SEARCH_T0_RANGE, k=n_candidates, min_sep=MIN_CANDIDATE_SEPARATION)
    pairs = []
    for t0 in t0_candidates:
        t1 = top_valleys(
            times, env, t0 + T1_OFFSET_RANGE[0], t0 + T1_OFFSET_RANGE[1],
            k=1, min_sep=MIN_CANDIDATE_SEPARATION,
        )[0]
        pairs.append((t0, t1))
    return pairs


def build_ffmpeg_cmd(path: str, out_path: str, t0: float, t1: float, c: float, bitrate: str):
    # acrossfade silently emits zero frames when both inputs are exactly
    # length `d` -- give each side a margin beyond the crossfade duration so
    # the filter has real material to work with. The margin just becomes a
    # few extra seconds of untouched, click-free audio before the wrap.
    d = c + MARGIN
    main_end = t1 - d
    filt = (
        f"[0:a]atrim=start={t0}:end={main_end},asetpts=PTS-STARTPTS[main];"
        f"[0:a]atrim=start={main_end}:end={t1},asetpts=PTS-STARTPTS[etail];"
        f"[0:a]atrim=start={t0 - d}:end={t0},asetpts=PTS-STARTPTS[pre];"
        f"[etail][pre]acrossfade=d={c}:c1=tri:c2=tri[cross];"
        f"[main][cross]concat=n=2:v=0:a=1[out]"
    )
    return [
        FFMPEG, "-y", "-v", "error", "-i", path,
        "-filter_complex", filt, "-map", "[out]",
        "-c:a", "libopus", "-b:a", bitrate, "-ar", "48000",
        out_path,
    ]


def measure_wrap_jump(out_path: str) -> dict:
    """Decode the real encoded output once and compare the wrap-point sample
    jump (last sample -> first sample) against the local noise floor there,
    in dB. This captures actual opus edge-encoding effects that a source-only
    heuristic can't predict."""
    pcm = decode_full_pcm(out_path)
    window = int(0.05 * 48000)  # 50ms
    tail = pcm[-window:]
    head = pcm[:window]

    boundary_jump = float(abs(head[0] - tail[-1]))
    local_level = float(np.sqrt(np.mean(np.concatenate([tail, head]).astype(np.float64) ** 2)))
    peak = float(np.max(np.abs(pcm)))

    def to_db(x, ref):
        return 20 * np.log10(max(x, 1e-9) / max(ref, 1e-9))

    jump_db = to_db(boundary_jump, peak)
    local_db = to_db(local_level, peak)
    return {
        "boundary_jump_dbfs": round(jump_db, 1),
        "local_level_dbfs": round(local_db, 1),
        "jump_above_local_level_db": round(jump_db - local_db, 1),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--bitrate", default="128k")
    ap.add_argument("--candidates", type=int, default=4)
    args = ap.parse_args()

    pairs = candidate_pairs(args.input, args.candidates)

    best = None
    with tempfile.TemporaryDirectory() as tmp:
        for i, (t0, t1) in enumerate(pairs):
            trial_path = str(Path(tmp) / f"trial_{i}.webm")
            cmd = build_ffmpeg_cmd(args.input, trial_path, t0, t1, CROSSFADE, args.bitrate)
            subprocess.run(cmd, check=True)
            metrics = measure_wrap_jump(trial_path)
            record = {"t0": t0, "t1": t1, "path": trial_path, **metrics}
            if best is None or record["jump_above_local_level_db"] < best["jump_above_local_level_db"]:
                best = record

        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(best["path"]).replace(args.output)

    result = {
        "input": args.input,
        "output": args.output,
        "t0": round(best["t0"], 3),
        "t1": round(best["t1"], 3),
        "loop_length_s": round(best["t1"] - best["t0"], 3),
        "crossfade_s": CROSSFADE,
        "candidates_tried": len(pairs),
        "boundary_jump_dbfs": best["boundary_jump_dbfs"],
        "local_level_dbfs": best["local_level_dbfs"],
        "jump_above_local_level_db": best["jump_above_local_level_db"],
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
