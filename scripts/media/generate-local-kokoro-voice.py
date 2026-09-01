"""Generate bundled Chronicle I voice clips with the local Kokoro ONNX model.

The model files are intentionally kept in .media-work and are never shipped with
the game. Only normalized MP3 narration clips are written to public assets.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro


VOICE_BY_SPEAKER = {
    "Eldrin": ("bm_george", 0.98),
    "Mara": ("bf_emma", 1.02),
    "Rukhar": ("am_fenrir", 0.92),
    "Caldus": ("bm_lewis", 0.96),
    "Lyra": ("bf_isabella", 1.02),
    "Talla": ("bf_alice", 1.05),
    "Voss": ("am_onyx", 0.93),
}


def run_ffmpeg(source: Path, destination: Path, tempo: float) -> None:
    filters = []
    if tempo > 1.001:
        filters.append(f"atempo={tempo:.5f}")
    filters.append("loudnorm=I=-16.5:TP=-1.5:LRA=7")
    command = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(source),
        "-af", ",".join(filters), "-ac", "1", "-ar", "24000",
        "-codec:a", "libmp3lame", "-b:a", "64k", str(destination),
    ]
    completed = subprocess.run(command, check=False, capture_output=True, text=True)
    if completed.returncode:
        raise RuntimeError(completed.stderr.strip() or f"ffmpeg failed for {destination}")


def probe_duration_ms(path: Path) -> int:
    completed = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True, capture_output=True, text=True,
    )
    return round(float(completed.stdout.strip()) * 1000)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--script", type=Path, default=Path("production/chronicle1/media/voice-script.json"))
    parser.add_argument("--output", type=Path, default=Path("public/audio/chronicle1/voice/en"))
    parser.add_argument("--work", type=Path, default=Path(".media-work/chronicle1/voice"))
    parser.add_argument("--index-only", action="store_true")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    args.work.mkdir(parents=True, exist_ok=True)
    document = json.loads(args.script.read_text(encoding="utf-8"))
    engine = None if args.index_only else Kokoro(str(args.model), str(args.voices))
    provenance = []

    for cue in document["cues"]:
        voice, speed = VOICE_BY_SPEAKER.get(cue["speaker"], VOICE_BY_SPEAKER["Eldrin"])
        wav_path = args.work / f"{cue['id']}.wav"
        mp3_path = args.output / f"{cue['id']}.mp3"
        if not args.index_only:
            assert engine is not None
            samples, sample_rate = engine.create(
                cue["spokenText"], voice=voice, speed=speed, lang="en-gb",
                sentence_pause=0.24, clause_pause=0.1,
            )
            sf.write(wav_path, samples, sample_rate)

            tempo = 1.0
            if cue["group"] == "opening":
                slot_seconds = max(1.0, (cue["endMs"] - cue["startMs"] - 650) / 1000)
                duration_seconds = len(samples) / sample_rate
                tempo = max(1.0, duration_seconds / slot_seconds)
            run_ffmpeg(wav_path, mp3_path, tempo)
        if not mp3_path.exists():
            raise FileNotFoundError(mp3_path)
        cue["audioSrc"] = f"/audio/chronicle1/voice/en/{cue['id']}.mp3"
        cue["delivery"] = "bundled-kokoro-onnx"
        output = mp3_path.read_bytes()
        provenance.append({
            "id": f"provenance-{cue['id']}",
            "assetId": cue["id"],
            "speaker": cue["speaker"],
            "voice": voice,
            "engine": "kokoro-onnx-0.6.1",
            "model": "Kokoro-82M-v1.0",
            "modelLicense": "Apache-2.0",
            "runtimeLicense": "MIT",
            "commercialDistribution": True,
            "src": cue["audioSrc"],
            "durationMs": probe_duration_ms(mp3_path),
            "bytes": len(output),
            "sha256": hashlib.sha256(output).hexdigest(),
        })
        print(f"generated {cue['id']} ({voice})")

    args.script.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    provenance_path = args.script.parent / "voice-provenance.json"
    provenance_path.write_text(json.dumps({"version": 1, "assets": provenance}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
