# Agent — AuctionAir AI Auctioneer Backend

A small Flask service that hosts the AI auctioneer. It owns the Groq API key, validates incoming auctioneer prompts, and returns a constrained response to the frontend. Keeping it server-side prevents the model key from being shipped to the browser.

## Endpoints

| Method | Path              | Purpose                                                                 |
| ------ | ----------------- | ----------------------------------------------------------------------- |
| GET    | `/health`         | Liveness check. Returns `{ ok, model, groqConfigured }`.                |
| POST   | `/api/auctioneer` | Body: `{ context, userMessage }`. Returns `{ reply, model }`.           |

`context` is an arbitrary JSON object describing the current lot (collection, current bid, traits, etc.). `userMessage` is the bidder's question. See [`../src/services/aiAuctioneer.ts`](../src/services/aiAuctioneer.ts) for the request shape used by the frontend.

## Local setup

```bash
cd Agent
python -m venv .venv
.venv\Scripts\activate          # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env             # then fill in GROQ_API_KEY
python app.py
```

The service listens on `http://localhost:5050` by default. The frontend reads `VITE_AGENT_API_URL` (see the root `.env.example`).

## Configuration

All settings come from `Agent/.env` (loaded via `python-dotenv`):

- `GROQ_API_KEY` — required.
- `GROQ_MODEL` — defaults to `llama-3.3-70b-versatile`.
- `ALLOWED_ORIGINS` — comma-separated CORS allowlist.
- `PORT` — defaults to `5050`.
- `FLASK_DEBUG=1` — enables auto-reload.

## Why this exists

The first iteration called Groq directly from the browser using `VITE_GROQ_API_KEY`. That shipped the key to anyone loading the site. This service is the long-term home for the auctioneer — future iterations will add on-chain context lookups, tool use, and a streaming response.
