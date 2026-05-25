"""AuctionAir AI auctioneer backend.

A thin Flask service that owns the Groq API key, validates incoming prompts,
shapes auctioneer responses, and writes an immutable benchmark record of every
decision to the AgentBenchmark contract on Mantle.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from onchain import get_logger

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("auctionair.agent")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if origin.strip()
]
PORT = int(os.getenv("PORT", "5050"))

SYSTEM_PROMPT = (
    "You are AuctionAir, a concise live NFT auctioneer. "
    "Use only the supplied lot context. Never invent sales, rarity ranks, or wallet history. "
    "Keep replies under three sentences and stay in character."
)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
onchain = get_logger()


@app.get("/health")
def health() -> Any:
    return jsonify(
        {
            "ok": True,
            "model": GROQ_MODEL,
            "groqConfigured": bool(GROQ_API_KEY),
            "onchain": {
                "configured": onchain.is_configured(),
                "ready": onchain.is_ready(),
                "agentId": onchain.agent_id,
                "benchmarkAddress": onchain.benchmark_address,
                "chainId": onchain.chain_id,
            },
        }
    )


@app.post("/api/auctioneer")
def auctioneer() -> Any:
    if not GROQ_API_KEY:
        return jsonify({"error": "GROQ_API_KEY is not configured on the agent backend."}), 500

    payload = request.get_json(silent=True) or {}
    context = payload.get("context")
    user_message = payload.get("userMessage")
    context_ref = payload.get("contextRef")  # e.g. auctionId
    topic = payload.get("topic", "narrate")

    if not isinstance(context, dict):
        return jsonify({"error": "Request body must include a `context` object."}), 400
    if not isinstance(user_message, str) or not user_message.strip():
        return jsonify({"error": "Request body must include a non-empty `userMessage`."}), 400

    groq_payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": str({"context": context, "userMessage": user_message})},
        ],
        "temperature": 0.8,
        "max_tokens": 160,
    }

    started_at = time.perf_counter()
    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "content-type": "application/json",
                "authorization": f"Bearer {GROQ_API_KEY}",
            },
            json=groq_payload,
            timeout=20,
        )
    except requests.RequestException as exc:
        return jsonify({"error": f"Upstream Groq request failed: {exc}"}), 502
    latency_ms = int((time.perf_counter() - started_at) * 1000)

    if not response.ok:
        return (
            jsonify({"error": f"Groq returned {response.status_code}", "detail": response.text}),
            502,
        )

    data = response.json()
    reply = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not reply:
        reply = "I need more on-chain context before answering that."

    log_result = onchain.log_decision(
        input_payload={"context": context, "userMessage": user_message},
        output_payload={"reply": reply, "model": GROQ_MODEL},
        model=GROQ_MODEL,
        latency_ms=latency_ms,
        topic=str(topic),
        context_ref=str(context_ref) if context_ref else None,
    )

    return jsonify(
        {
            "reply": reply,
            "model": GROQ_MODEL,
            "latencyMs": latency_ms,
            "agentId": onchain.agent_id if onchain.is_configured() else None,
            "onchain": {
                "txHash": log_result.tx_hash,
                "explorerUrl": log_result.explorer_url,
                "inputHash": log_result.input_hash,
                "outputHash": log_result.output_hash,
                "error": log_result.error,
                "benchmarkAddress": onchain.benchmark_address,
                "chainId": onchain.chain_id,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=os.getenv("FLASK_DEBUG") == "1")
