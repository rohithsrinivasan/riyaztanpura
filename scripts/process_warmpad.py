"""
Batch-applies the same seamless-loop trimming technique used for the tanpura
drones (see make_seamless_loop.py) to the warm pad drone samples.

warmpad_trial/warmpad_major_drones_samples/*.webm -> public/audio-major/*.webm
warmpad_trial/warmpad_minor_drones_samples/*.webm -> public/audio-minor/*.webm
"""

import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from make_seamless_loop import (
    CROSSFADE,
    build_ffmpeg_cmd,
    candidate_pairs,
    measure_wrap_jump,
)
import subprocess

ROOT = Path(__file__).parent.parent
JOBS = [
    (ROOT / "warmpad_trial" / "warmpad_major_drones_samples", ROOT / "public" / "audio-major"),
    (ROOT / "warmpad_trial" / "warmpad_minor_drones_samples", ROOT / "public" / "audio-minor"),
]
BITRATE = "128k"
CANDIDATES = 4


def process_one(src: Path, dst: Path) -> dict:
    pairs = candidate_pairs(str(src), CANDIDATES)
    best = None
    with tempfile.TemporaryDirectory() as tmp:
        for i, (t0, t1) in enumerate(pairs):
            trial_path = str(Path(tmp) / f"trial_{i}.webm")
            cmd = build_ffmpeg_cmd(str(src), trial_path, t0, t1, CROSSFADE, BITRATE)
            subprocess.run(cmd, check=True)
            metrics = measure_wrap_jump(trial_path)
            record = {"t0": t0, "t1": t1, "path": trial_path, **metrics}
            if best is None or record["jump_above_local_level_db"] < best["jump_above_local_level_db"]:
                best = record
        dst.parent.mkdir(parents=True, exist_ok=True)
        Path(best["path"]).replace(dst)

    return {
        "input": str(src),
        "output": str(dst),
        "t0": round(best["t0"], 3),
        "t1": round(best["t1"], 3),
        "loop_length_s": round(best["t1"] - best["t0"], 3),
        "candidates_tried": len(pairs),
        "boundary_jump_dbfs": best["boundary_jump_dbfs"],
        "local_level_dbfs": best["local_level_dbfs"],
        "jump_above_local_level_db": best["jump_above_local_level_db"],
        "orig_size_bytes": src.stat().st_size,
        "new_size_bytes": dst.stat().st_size,
    }


def main():
    results = []
    for src_dir, dst_dir in JOBS:
        for src in sorted(src_dir.glob("*.webm")):
            dst = dst_dir / src.name
            print(f"Processing {src} ...", file=sys.stderr)
            result = process_one(src, dst)
            results.append(result)
            print(json.dumps(result), file=sys.stderr)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
