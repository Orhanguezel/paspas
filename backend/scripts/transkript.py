#!/usr/bin/env python3
"""Yerel faster-whisper ile tek bir ses dosyasını Türkçe metne çevirir."""

from pathlib import Path
import os
import sys

from faster_whisper import WhisperModel


def main() -> int:
    if len(sys.argv) != 2:
        print("Kullanim: transkript.py <ses_dosyasi>", file=sys.stderr)
        return 2

    audio_path = Path(sys.argv[1]).resolve()
    if not audio_path.is_file():
        print(f"Ses dosyasi bulunamadi: {audio_path}", file=sys.stderr)
        return 2

    model_name = os.environ.get("WHISPER_MODEL", "small").strip() or "small"
    model = WhisperModel(
        model_name,
        device="cpu",
        compute_type="int8",
        download_root=os.environ.get(
            "WHISPER_MODEL_DIR",
            "/opt/paspas-whisper/models",
        ),
    )
    segments, _ = model.transcribe(
        str(audio_path),
        language="tr",
        vad_filter=True,
        beam_size=5,
    )
    text = " ".join(segment.text.strip() for segment in segments if segment.text.strip())
    if text:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
