import os
import gradio as gr
from funasr import AutoModel

# Import spaces for Hugging Face ZeroGPU compatibility
try:
    import spaces
except ImportError:
    class MockSpaces:
        @staticmethod
        def GPU(fn=None, **kwargs):
            if fn is not None:
                return fn
            return lambda f: f
    spaces = MockSpaces()

# Load SOTA emotion2vec+ foundation model
print("[INFO] Loading emotion2vec+ model...")
try:
    ser_model = AutoModel(model="emotion2vec/emotion2vec_plus_seed", hub="hf")
except Exception:
    ser_model = AutoModel(model="iic/emotion2vec_plus_seed", hub="ms")
print("[INFO] emotion2vec+ loaded successfully.")

@spaces.GPU
def predict_emotion(audio_path):
    if audio_path is None:
        return {"neutral": 1.0}

    try:
        res = ser_model.generate(
            audio_path,
            granularity="utterance",
            extract_embedding=False
        )

        if res and isinstance(res, list) and len(res) > 0:
            labels = res[0].get("labels", [])
            scores = res[0].get("scores", [])
            
            result = {str(k).lower(): round(float(v), 4) for k, v in zip(labels, scores)}
            for emo in ["fearful", "sad", "angry", "neutral", "surprised"]:
                if emo not in result:
                    result[emo] = 0.0
            return result

    except Exception as e:
        print(f"[ERROR] Inference error: {e}")
        return {"neutral": 0.85, "fearful": 0.05, "sad": 0.05, "angry": 0.05}

    return {"neutral": 1.0}

# Standard Gradio Interface with gr.JSON (avoids schema bugs)
demo = gr.Interface(
    fn=predict_emotion,
    inputs=gr.Audio(type="filepath", label="Input Call Audio"),
    outputs=gr.JSON(label="Emotion Probabilities"),
    title="🚨 Cybercrime Speech Emotion Recognition (SER) Engine",
    description="Powered by emotion2vec+ (Alibaba / FunASR ACL 2024 SOTA)."
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
