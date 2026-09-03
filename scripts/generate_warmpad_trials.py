"""
Synthesizes a handful of ambient/warm-pad texture options in D (Sa) for
audition -- purely for the product owner to listen to and pick a direction.
Not wired into the app. All voices are built on D (Sa) and A (Pa), matching
the tanpura's own tuning convention, rather than a Western triad, so
whichever one gets picked will sit comfortably under a raga performance.

Output: warmpad_trial/*.wav, 30s each, 44.1kHz stereo.
"""

import numpy as np
import soundfile as sf
from pathlib import Path
from scipy import signal

SR = 44100
DURATION = 30.0
OUT_DIR = Path(__file__).resolve().parent.parent / "warmpad_trial"

D3 = 146.832
D4 = 293.665
D5 = 587.330
A3 = 220.000   # Pa / 5th
A4 = 440.000
FS3 = 184.997  # major 3rd
FS4 = 369.994
G3 = 195.998   # Ma (used sparingly)


def t_axis(duration=DURATION, sr=SR):
    return np.arange(int(duration * sr)) / sr


def detuned_unison(freq, duration, sr, voices=5, detune_cents=7.0, waveform="sine", seed=0):
    rng = np.random.default_rng(seed)
    t = t_axis(duration, sr)
    out = np.zeros_like(t)
    spread = np.linspace(-detune_cents / 2, detune_cents / 2, voices)
    for cents in spread:
        f = freq * (2 ** (cents / 1200))
        phase = rng.uniform(0, 2 * np.pi)
        if waveform == "sine":
            voice = np.sin(2 * np.pi * f * t + phase)
        elif waveform == "triangle":
            voice = signal.sawtooth(2 * np.pi * f * t + phase, width=0.5)
        else:
            voice = signal.sawtooth(2 * np.pi * f * t + phase)
        out += voice
    return out / voices


def lowpass(sig, sr, cutoff):
    b, a = signal.butter(2, cutoff / (sr / 2), btype="low")
    return signal.filtfilt(b, a, sig)


def bandpass(sig, sr, low, high):
    b, a = signal.butter(2, [low / (sr / 2), high / (sr / 2)], btype="band")
    return signal.filtfilt(b, a, sig)


def swell_envelope(duration, sr, attack, release, sustain_level=1.0):
    n = int(duration * sr)
    env = np.full(n, sustain_level)
    a_n = int(attack * sr)
    r_n = int(release * sr)
    env[:a_n] *= np.linspace(0, 1, a_n) ** 1.5
    env[-r_n:] *= np.linspace(1, 0, r_n) ** 1.5
    return env


def slow_am(duration, sr, rate_hz, depth):
    t = t_axis(duration, sr)
    return 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * rate_hz * t))


def synth_reverb_ir(sr, decay_s=2.5, seed=1):
    rng = np.random.default_rng(seed)
    n = int(decay_s * sr)
    noise = rng.uniform(-1, 1, n)
    env = np.exp(-np.arange(n) / (sr * decay_s / 5))
    ir = noise * env
    ir = lowpass(ir, sr, 4000)
    ir /= np.max(np.abs(ir)) + 1e-9
    return ir


def add_reverb(sig, sr, mix=0.28, decay_s=2.5, seed=1):
    ir = synth_reverb_ir(sr, decay_s, seed)
    wet = signal.fftconvolve(sig, ir)[: len(sig)]
    wet /= np.max(np.abs(wet)) + 1e-9
    dry_peak = np.max(np.abs(sig)) + 1e-9
    return (1 - mix) * sig + mix * wet * dry_peak


def to_stereo(sig_l, sig_r, peak_dbfs=-6.0):
    stereo = np.stack([sig_l, sig_r], axis=1)
    peak = np.max(np.abs(stereo)) + 1e-9
    target = 10 ** (peak_dbfs / 20)
    return (stereo / peak * target).astype(np.float32)


def haas_pair(mono, sr, delay_ms=12.0, detune_cents=3.0):
    """Cheap stereo width: right channel is a touch delayed and detuned."""
    delay_n = int(delay_ms / 1000 * sr)
    right = np.roll(mono, delay_n)
    right[:delay_n] = 0
    return mono, right


def save(name, stereo):
    OUT_DIR.mkdir(exist_ok=True)
    path = OUT_DIR / f"{name}.wav"
    sf.write(path, stereo, SR)
    print(f"wrote {path} ({stereo.shape[0] / SR:.1f}s)")


def variation_soft_sa_pa_drone():
    sa = detuned_unison(D3, DURATION, SR, voices=5, detune_cents=6, waveform="sine", seed=10)
    pa = detuned_unison(A3, DURATION, SR, voices=4, detune_cents=6, waveform="sine", seed=11)
    mix = sa * 0.65 + pa * 0.35
    mix = lowpass(mix, SR, 1100)
    mix *= swell_envelope(DURATION, SR, attack=4.0, release=4.0)
    mix *= slow_am(DURATION, SR, rate_hz=0.06, depth=0.08)
    mix = add_reverb(mix, SR, mix=0.25, decay_s=2.2, seed=1)
    left, right = haas_pair(mix, SR, delay_ms=14)
    save("1_soft_sa_pa_drone", to_stereo(left, right))


def variation_airy_shimmer():
    sa = detuned_unison(D3, DURATION, SR, voices=5, detune_cents=8, waveform="sine", seed=20)
    pa = detuned_unison(A3, DURATION, SR, voices=4, detune_cents=8, waveform="sine", seed=21)
    shimmer = detuned_unison(D5, DURATION, SR, voices=3, detune_cents=10, waveform="sine", seed=22)
    shimmer *= slow_am(DURATION, SR, rate_hz=0.11, depth=0.6)
    mix = sa * 0.55 + pa * 0.3 + shimmer * 0.06
    mix = lowpass(mix, SR, 3200)
    mix *= swell_envelope(DURATION, SR, attack=5.0, release=5.0)
    mix = add_reverb(mix, SR, mix=0.35, decay_s=3.2, seed=2)
    left, right = haas_pair(mix, SR, delay_ms=18)
    save("2_airy_shimmer", to_stereo(left, right))


def variation_warm_ensemble():
    sa_low = detuned_unison(D3, DURATION, SR, voices=7, detune_cents=9, waveform="triangle", seed=30)
    sa_high = detuned_unison(D4, DURATION, SR, voices=5, detune_cents=9, waveform="triangle", seed=31)
    pa = detuned_unison(A3, DURATION, SR, voices=5, detune_cents=9, waveform="triangle", seed=32)
    mix = sa_low * 0.5 + sa_high * 0.2 + pa * 0.3
    mix = lowpass(mix, SR, 850)
    mix *= swell_envelope(DURATION, SR, attack=3.5, release=3.5)
    mix = add_reverb(mix, SR, mix=0.22, decay_s=1.8, seed=3)
    left, right = haas_pair(mix, SR, delay_ms=10)
    save("3_warm_ensemble", to_stereo(left, right))


def variation_slow_breathing():
    sa = detuned_unison(D3, DURATION, SR, voices=5, detune_cents=5, waveform="sine", seed=40)
    pa = detuned_unison(A3, DURATION, SR, voices=4, detune_cents=5, waveform="sine", seed=41)
    air = bandpass(np.random.default_rng(42).uniform(-1, 1, len(t_axis())), SR, 2000, 6000) * 0.02
    mix = sa * 0.65 + pa * 0.33 + air
    mix = lowpass(mix, SR, 1300)
    mix *= swell_envelope(DURATION, SR, attack=2.0, release=2.0)
    mix *= slow_am(DURATION, SR, rate_hz=0.045, depth=0.22)
    mix = add_reverb(mix, SR, mix=0.2, decay_s=2.0, seed=4)
    left, right = haas_pair(mix, SR, delay_ms=16)
    save("4_slow_breathing", to_stereo(left, right))


def warm_chord_pad(
    name,
    voices_spec,      # list of (freq, weight, seed, voice_count, detune_cents, waveform)
    cutoff,
    attack,
    release,
    reverb_mix,
    reverb_decay,
    reverb_seed,
    delay_ms,
    am_rate=None,
    am_depth=0.0,
):
    """Same recipe as the liked 'warm ensemble' variation: several detuned
    unison voices per chord tone, summed, warmed with a low-pass, given a
    slow swell, and glued together with a touch of algorithmic reverb."""
    mix = np.zeros(int(DURATION * SR))
    for freq, weight, seed, voice_count, detune_cents, waveform in voices_spec:
        mix += weight * detuned_unison(
            freq, DURATION, SR, voices=voice_count, detune_cents=detune_cents,
            waveform=waveform, seed=seed,
        )
    mix = lowpass(mix, SR, cutoff)
    mix *= swell_envelope(DURATION, SR, attack=attack, release=release)
    if am_rate:
        mix *= slow_am(DURATION, SR, rate_hz=am_rate, depth=am_depth)
    mix = add_reverb(mix, SR, mix=reverb_mix, decay_s=reverb_decay, seed=reverb_seed)
    left, right = haas_pair(mix, SR, delay_ms=delay_ms)
    save(name, to_stereo(left, right))


def variation_d_major_triad():
    # Root-third-fifth, close voicing -- the straightforward "D Major Pad" reading.
    warm_chord_pad(
        "5_d_major_triad",
        voices_spec=[
            (D3, 0.42, 50, 7, 9, "triangle"),
            (FS3, 0.28, 51, 6, 9, "triangle"),
            (A3, 0.30, 52, 6, 9, "triangle"),
        ],
        cutoff=900, attack=3.5, release=3.5,
        reverb_mix=0.22, reverb_decay=1.8, reverb_seed=5, delay_ms=10,
    )


def variation_d_major_wide_voicing():
    # Root low, fifth mid, third dropped up an octave -- opens up the chord,
    # avoids the muddiness a low major-3rd can bring.
    warm_chord_pad(
        "6_d_major_wide_voicing",
        voices_spec=[
            (D3, 0.45, 60, 7, 9, "triangle"),
            (A3, 0.30, 61, 6, 9, "triangle"),
            (FS4, 0.20, 62, 5, 9, "triangle"),
        ],
        cutoff=1000, attack=3.5, release=3.5,
        reverb_mix=0.24, reverb_decay=2.0, reverb_seed=6, delay_ms=11,
    )


def variation_d_major_lush_strings():
    # More voices, wider detune, slower attack -- a denser "string machine" pad.
    warm_chord_pad(
        "7_d_major_lush_strings",
        voices_spec=[
            (D3, 0.35, 70, 9, 11, "triangle"),
            (D4, 0.15, 71, 6, 11, "triangle"),
            (FS3, 0.22, 72, 8, 11, "triangle"),
            (A3, 0.28, 73, 8, 11, "triangle"),
        ],
        cutoff=1100, attack=5.5, release=5.5,
        reverb_mix=0.28, reverb_decay=2.6, reverb_seed=7, delay_ms=13,
    )


def variation_sa_pa_major_blend():
    # Classical-leaning: Sa-Pa drone stays dominant, the major 3rd is mixed
    # in quietly for warmth without pulling it fully into Western triad territory.
    warm_chord_pad(
        "8_sa_pa_major_blend",
        voices_spec=[
            (D3, 0.5, 80, 7, 8, "triangle"),
            (A3, 0.32, 81, 6, 8, "triangle"),
            (FS3, 0.12, 82, 5, 8, "triangle"),
        ],
        cutoff=850, attack=3.0, release=3.0,
        reverb_mix=0.2, reverb_decay=1.6, reverb_seed=8, delay_ms=9,
    )


def variation_d_major_analog_chorus():
    # Sawtooth-based unison (classic analog "supersaw" pad lineage), tamed
    # with an aggressive low-pass so it stays warm instead of buzzy.
    warm_chord_pad(
        "9_d_major_analog_chorus",
        voices_spec=[
            (D3, 0.38, 90, 7, 13, "saw"),
            (FS3, 0.24, 91, 6, 13, "saw"),
            (A3, 0.28, 92, 6, 13, "saw"),
        ],
        cutoff=700, attack=4.0, release=4.0,
        reverb_mix=0.26, reverb_decay=2.2, reverb_seed=9, delay_ms=12,
        am_rate=0.05, am_depth=0.06,
    )


if __name__ == "__main__":
    variation_d_major_triad()
    variation_d_major_wide_voicing()
    variation_d_major_lush_strings()
    variation_sa_pa_major_blend()
    variation_d_major_analog_chorus()
