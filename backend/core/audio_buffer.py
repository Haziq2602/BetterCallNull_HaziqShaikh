"""
Audio Stream Buffer: Implements a rolling sliding window buffer for streaming audio chunks.
Maintains a 2.0-second context window at 16 kHz with a 1.0-second sliding stride.
"""

from typing import Optional, Union, Dict, Any, List
import numpy as np

class CallSession:
    """
    Session-safe isolation container for a live streaming emergency call.
    Guarantees zero cross-call contamination for concurrent officer channels.
    Includes monotonic sequence counters to eliminate out-of-order STT overwrites.
    """
    def __init__(self, call_id: str):
        self.call_id = call_id
        self.buffer = AudioStreamBuffer(sample_rate=16000, window_duration_sec=2.0, stride_duration_sec=1.0)
        self.latest_window: Optional[np.ndarray] = None
        self.latest_transcript: str = "..."
        self.latest_situation: Optional[Dict[str, Any]] = None
        self.stt_in_progress: bool = False
        self.speech_history: List[np.ndarray] = []
        self.stt_task_seq: int = 0
        self.latest_completed_stt_seq: int = 0
        self.is_connected: bool = True
        self.scores_history: List[float] = []
        self.peak_score: float = 10.0

    def record_score(self, score: float) -> None:
        self.scores_history.append(score)
        self.peak_score = max(self.peak_score, score)

    def close(self):
        self.is_connected = False
        self.buffer.reset()
        self.speech_history.clear()
        self.latest_window = None

class AudioStreamBuffer:
    def __init__(
        self,
        sample_rate: int = 16000,
        window_duration_sec: float = 2.0,
        stride_duration_sec: float = 1.0,
        silence_threshold_rms: float = 0.005
    ):
        self.sample_rate = sample_rate
        self.window_samples = int(window_duration_sec * sample_rate)  # e.g. 32,000 samples
        self.stride_samples = int(stride_duration_sec * sample_rate)  # e.g. 16,000 samples
        self.silence_threshold = silence_threshold_rms

        # Internal buffer holding float32 audio samples in range [-1.0, 1.0]
        self._buffer = np.zeros(0, dtype=np.float32)
        self._samples_since_last_emit = 0

    def add_chunk(self, chunk: Union[bytes, np.ndarray]) -> Optional[np.ndarray]:
        """
        Ingests a small incoming audio chunk (raw PCM bytes or float32 array).
        Returns a 2.0-second (32,000 samples) normalized numpy array when a new
        window is ready according to the stride. Returns None if still buffering.
        """
        # Convert raw int16 PCM bytes to float32 if needed
        if isinstance(chunk, bytes):
            if len(chunk) % 2 != 0:
                # Discard trailing odd byte to maintain int16 alignment
                chunk = chunk[:-1]
            samples = np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32768.0
        elif isinstance(chunk, np.ndarray):
            if chunk.dtype == np.int16:
                samples = chunk.astype(np.float32) / 32768.0
            else:
                samples = chunk.astype(np.float32)
        else:
            raise ValueError(f"Unsupported audio chunk type: {type(chunk)}")

        if len(samples) == 0:
            return None

        # Append new samples to buffer
        self._buffer = np.concatenate((self._buffer, samples))
        self._samples_since_last_emit += len(samples)

        # Check if we have accumulated enough for a full 2-second window
        if len(self._buffer) >= self.window_samples:
            # Check if we have advanced by at least stride_samples since last emit
            if self._samples_since_last_emit >= self.stride_samples:
                # Extract the latest 2-second window
                window = self._buffer[-self.window_samples:]
                self._samples_since_last_emit = 0

                # Keep buffer size bounded (keep 2x window max to prevent memory leakage)
                max_buffer_len = self.window_samples * 2
                if len(self._buffer) > max_buffer_len:
                    self._buffer = self._buffer[-self.window_samples:]

                return window

        return None

    def is_silent(self, window: np.ndarray) -> bool:
        """
        Voice Activity Check: Returns True if audio energy is below the silence threshold.
        """
        if len(window) == 0:
            return True
        rms = np.sqrt(np.mean(window ** 2))
        return bool(rms < self.silence_threshold)

    def reset(self):
        """Clears the buffer state."""
        self._buffer = np.zeros(0, dtype=np.float32)
        self._samples_since_last_emit = 0
