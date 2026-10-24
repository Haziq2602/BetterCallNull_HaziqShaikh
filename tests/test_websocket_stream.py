"""
Client test: Connects to the running FastAPI WebSocket endpoint and streams 3 seconds of audio.
"""

import asyncio
import websockets
import numpy as np
import json

async def simulate_mic_stream():
    uri = "ws://localhost:8000/ws/live-call/CALL-TEST-MIC"
    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server!")

            # Generate 3 seconds of synthetic speech (48,000 samples at 16kHz)
            sample_rate = 16000
            t = np.linspace(0, 3.0, 3 * sample_rate)
            audio = 0.4 * np.sin(2 * np.pi * 300 * t)  # 300Hz tone

            chunk_size = 4000  # 250ms chunks
            for i in range(0, len(audio), chunk_size):
                chunk = audio[i : i + chunk_size]
                pcm_bytes = (chunk * 32767).astype(np.int16).tobytes()

                # Send chunk
                await websocket.send(pcm_bytes)
                print(f"[CLIENT] Sent {len(pcm_bytes)} bytes...")

                # Non-blocking check for server response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                    data = json.loads(response)
                    print(f"--> [SERVER TELEMETRY RECEIVED]: Urgency: {data['urgency_score']} | Dominant: {data['dominant_emotion']} | Priority: {data['priority_level']}")
                except asyncio.TimeoutError:
                    pass

                await asyncio.sleep(0.25)

            # Wait for any final responses
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                data = json.loads(response)
                print(f"--> [FINAL TELEMETRY RECEIVED]: Urgency: {data['urgency_score']} | Priority: {data['priority_level']}")
            except asyncio.TimeoutError:
                pass

            print("Stream test completed successfully!")

    except Exception as e:
        print(f"Error during stream: {e}")

if __name__ == "__main__":
    asyncio.run(simulate_mic_stream())
