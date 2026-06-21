"""
browser-ai: Personality Model Server
=====================================

Serves a fine-tuned SmolLM2 personality model as a local REST API.
The browser chat UI connects to this server at http://localhost:8000.

Usage:
    python train/serve.py --model ./output/personality

Streaming endpoint:
    POST /api/chat/stream  → Server-Sent Events with token-by-token streaming
"""

import argparse
import json
import os
import sys
import asyncio
from pathlib import Path

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
    from threading import Thread
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

try:
    from fastapi import FastAPI, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel
    import uvicorn
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False


def parse_args():
    parser = argparse.ArgumentParser(description="browser-ai Personality Server")
    parser.add_argument("--model", default="./output/personality", help="Path to merged model directory")
    parser.add_argument("--port", type=int, default=8000, help="Port to serve on (default: 8000)")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
    parser.add_argument("--cpu", action="store_true", help="Force CPU even if GPU is available")
    return parser.parse_args()


def load_model(model_path: str, use_cpu: bool = False):
    """Load the fine-tuned model and tokenizer."""
    if not os.path.exists(model_path):
        print(f"❌ Model not found at: {model_path}")
        print(f"   Run training first: python train/smol_lora_train.py --data ./my-book.txt")
        sys.exit(1)

    print(f"📦 Loading model from: {model_path}")

    device = "cpu" if use_cpu else ("cuda" if torch.cuda.is_available() else "cpu")
    dtype = torch.float16 if device == "cuda" else torch.float32

    print(f"   Device: {device.upper()}")

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=dtype,
        device_map=device,
        trust_remote_code=True,
    )

    print(f"   ✓ Model loaded ({sum(p.numel() for p in model.parameters()):,} params)")
    return model, tokenizer, device


def generate_stream(
    model,
    tokenizer,
    device,
    message: str,
    system_prompt: str = None,
    max_tokens: int = 256,
    temperature: float = 0.7,
    top_p: float = 0.9,
    repetition_penalty: float = 1.1,
    history_messages: list = None,
):
    """
    Generate a response from the model, yielding tokens one at a time.
    Uses TextIteratorStreamer for streaming generation.
    """
    # Build the full conversation
    messages = []

    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    # Add conversation history if provided
    if history_messages:
        for m in history_messages:
            if isinstance(m, dict) and "role" in m and "content" in m:
                if m["role"] in ("user", "assistant", "system"):
                    messages.append(m)

    # Add the current user message
    messages.append({"role": "user", "content": message})

    # Apply chat template
    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    # Set up the streamer
    streamer = TextIteratorStreamer(
        tokenizer,
        skip_prompt=True,
        skip_special_tokens=True,
    )

    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=max_tokens,
        temperature=temperature,
        top_p=top_p,
        repetition_penalty=repetition_penalty,
        do_sample=temperature > 0,
        pad_token_id=tokenizer.eos_token_id,
    )

    # Run generation in a separate thread
    thread = Thread(target=model.generate, kwargs=generation_kwargs)
    thread.start()

    # Yield tokens as they're generated
    for token in streamer:
        yield token


def generate_response(
    model,
    tokenizer,
    device,
    message: str,
    system_prompt: str = None,
    max_tokens: int = 256,
    temperature: float = 0.7,
    top_p: float = 0.9,
    repetition_penalty: float = 1.1,
    history_messages: list = None,
):
    """Generate a complete response (non-streaming)."""
    response_parts = []
    for token in generate_stream(model, tokenizer, device, message, system_prompt, max_tokens, temperature, top_p, repetition_penalty, history_messages):
        response_parts.append(token)
    return "".join(response_parts).strip()


def main():
    args = parse_args()

    # Load model
    model, tokenizer, device = load_model(args.model, args.cpu)

    if not HAS_FASTAPI:
        # CLI mode — simple interactive chat with streaming
        print()
        print("=" * 50)
        print("  Interactive Chat Mode (Ctrl+C to exit)")
        print("=" * 50)
        print()

        try:
            while True:
                user = input("\nYou: ")
                if user.lower() in ("/exit", "/quit", ""):
                    break

                print("\nAI: ", end="", flush=True)
                for token in generate_stream(model, tokenizer, device, user):
                    print(token, end="", flush=True)
                print()
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
        return

    # ─── API Server mode ─────────────────────────────────────────────
    app = FastAPI(title="browser-ai Personality Server")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Load metadata
    metadata = {}
    meta_path = os.path.join(os.path.dirname(args.model) or ".", "metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            metadata = json.load(f)

    class ChatRequest(BaseModel):
        message: str
        messages: list = []  # Optional: conversation history for context
        system_prompt: str = None
        max_tokens: int = 256
        temperature: float = 0.7

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "model": "SmolLM2-360M-Instruct (fine-tuned)",
            "device": device.upper(),
            "metadata": metadata,
        }        @app.post("/api/chat")
        async def chat(req: ChatRequest):
            response = generate_response(
                model, tokenizer, device,
                message=req.message,
                system_prompt=req.system_prompt,
                max_tokens=req.max_tokens,
                temperature=req.temperature,
                history_messages=req.messages,
            )
            return {"response": response}        @app.post("/api/chat/stream")
        async def chat_stream(req: ChatRequest):
            """Streaming endpoint using Server-Sent Events."""

            async def event_stream():
                buffer = ""
                for token in generate_stream(
                    model, tokenizer, device,
                    message=req.message,
                    system_prompt=req.system_prompt,
                    max_tokens=req.max_tokens,
                    temperature=req.temperature,
                    history_messages=req.messages,
                ):
                buffer += token
                # Send each token as an SSE event
                yield f"data: {json.dumps({'token': token, 'full': buffer})}\n\n"

            # Signal completion
            yield f"data: {json.dumps({'done': True, 'full': buffer})}\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    @app.get("/api/metadata")
    async def get_metadata():
        return metadata

    print()
    print(f"🌐 Server running at http://{args.host}:{args.port}")
    print(f"   Health:  http://{args.host}:{args.port}/health")
    print(f"   Chat:    POST http://{args.host}:{args.port}/api/chat")
    print(f"   Stream:  POST http://{args.host}:{args.port}/api/chat/stream")
    print(f"   Open the browser-ai Chat page to start talking")
    print()

    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
