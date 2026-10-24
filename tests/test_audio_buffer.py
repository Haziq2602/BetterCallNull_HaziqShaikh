"""
Unit tests for AudioStreamBuffer.
Simulates a live streaming call feeding 250ms audio chunks over time.
"""

import sys
import os
import numpy as np

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.core.audio_buffer import AudioStreamBuffer

def test_streaming_simulation():
    print("=" * 60)
    print("TEST: Streaming Audio Simulation (5-Second Call)")
    print("=" * 60)

    sample_rate = 16000
    chunk_duration_sec = 0.25  # 250ms chunks (typical WebSocket frame)
    chunk_samples = int(sample_rate * chunk_duration_sec)  # 4,000 samples

    buffer = AudioStreamBuffer(
        sample_rate=sample_rate,
        window_duration_sec=2.0,
        stride_duration_sec=1.0
    )

    total_chunks_sent = 0
    emitted_windows = []

    # Simulate 5 seconds of audio (20 chunks of 250ms)
    # Generate synthetic voice (sine wave + noise)
    t = np.linspace(0, 5.0, 5 * sample_rate, endpoint=False)
    simulated_speech = 0.3 * np.sin(2 * np.pi * 220 * t) + 0.05 * np.random.randn(len(t))

    for i in range(0, len(simulated_speech), chunk_samples):
        chunk = simulated_speech[i : i + chunk_samples]
        if len(chunk) < chunk_samples:
            break

        total_chunks_sent += 1
        elapsed_time = total_chunks_sent * chunk_duration_sec

        # Feed chunk as raw int16 PCM bytes (simulating wire transport)
        pcm_bytes = (chunk * 32767).astype(np.int16).tobytes()
        window = buffer.add_chunk(pcm_bytes)

        if window is not None:
            emitted_windows.append(window)
            rms = np.sqrt(np.mean(window ** 2))
            is_silent = buffer.is_silent(window)
            print(f"[TIME {elapsed_time:.2f}s] Window Ready! Samples: {len(window)} | RMS: {rms:.4f} | Silent: {is_silent}")
        else:
            print(f"[TIME {elapsed_time:.2f}s] Buffering... ({total_chunks_sent * chunk_samples} samples accumulated)")

    # Assertions
    print("-" * 60)
    print(f"Total chunks sent: {total_chunks_sent}")
    print(f"Total 2-second windows emitted: {len(emitted_windows)}")

    # At 2.0s (chunk 8), the first window must be emitted
    assert len(emitted_windows) >= 1, "Buffer failed to emit first window at 2.0s!"
    assert len(emitted_windows[0]) == 32000, f"Expected 32,000 samples, got {len(emitted_windows[0])}"

    # For 5.0 seconds of audio with 2s window & 1s stride:
    # Windows should be emitted at: ~2.0s, ~3.0s, ~4.0s, ~5.0s (4 windows total)
    assert len(emitted_windows) == 4, f"Expected 4 sliding windows, got {len(emitted_windows)}"

    print("ALL BUFFER ASSERTIONS PASSED! Phase 1 Audio Buffer is fully functional.")
    print("=" * 60)

if __name__ == "__main__":
    test_streaming_simulation()
