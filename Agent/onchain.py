"""On-chain benchmark logger for the AuctionAir auctioneer.

The Flask app calls :func:`log_decision` after each Groq response. The function
hashes the input/output, signs a transaction with ``AGENT_PRIVATE_KEY``, and
submits it to the configured Mantle Sepolia RPC. We do NOT block on the
receipt — the tx hash is returned immediately so the user gets their reply
without waiting for a confirmation.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import threading
from dataclasses import dataclass
from typing import Any, Optional

from web3 import Web3
from web3.exceptions import Web3RPCError
from eth_account import Account

log = logging.getLogger(__name__)

BENCHMARK_ABI = [
    {
        "type": "function",
        "name": "logDecision",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "inputHash", "type": "bytes32"},
            {"name": "outputHash", "type": "bytes32"},
            {"name": "contextRef", "type": "bytes32"},
            {"name": "latencyMs", "type": "uint32"},
            {"name": "model", "type": "string"},
            {"name": "topic", "type": "string"},
        ],
        "outputs": [{"name": "decisionId", "type": "uint256"}],
    },
]


@dataclass
class LogResult:
    tx_hash: Optional[str]
    input_hash: str
    output_hash: str
    explorer_url: Optional[str]
    error: Optional[str] = None


class OnChainLogger:
    def __init__(self) -> None:
        self.rpc_url = os.getenv("AGENT_RPC_URL") or os.getenv("MANTLE_SEPOLIA_RPC_URL")
        self.private_key = os.getenv("AGENT_PRIVATE_KEY")
        self.benchmark_address = os.getenv("AGENT_BENCHMARK_ADDRESS")
        self.agent_id = int(os.getenv("AGENT_ID", "0"))
        self.explorer = os.getenv("AGENT_EXPLORER_URL", "https://explorer.sepolia.mantle.xyz")
        self.chain_id = int(os.getenv("AGENT_CHAIN_ID", "5003"))
        self.topic_prefix = os.getenv("AGENT_TOPIC_PREFIX", "auctioneer")

        self._lock = threading.Lock()
        self._w3: Optional[Web3] = None
        self._account = None
        self._contract = None

        if self.is_configured():
            try:
                self._w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 15}))
                self._account = Account.from_key(self.private_key)
                self._contract = self._w3.eth.contract(
                    address=Web3.to_checksum_address(self.benchmark_address),
                    abi=BENCHMARK_ABI,
                )
                log.info(
                    "On-chain logging enabled: agentId=%s, signer=%s, benchmark=%s",
                    self.agent_id,
                    self._account.address,
                    self.benchmark_address,
                )
            except Exception as exc:  # pragma: no cover - startup diagnostics
                log.warning("Failed to initialize on-chain logger: %s", exc)
                self._w3 = None
                self._contract = None
        else:
            log.warning(
                "On-chain logging disabled — set AGENT_PRIVATE_KEY, AGENT_BENCHMARK_ADDRESS, AGENT_ID and AGENT_RPC_URL to enable.",
            )

    def is_configured(self) -> bool:
        return all(
            [
                self.rpc_url,
                self.private_key,
                self.benchmark_address,
                self.agent_id > 0,
            ]
        )

    def is_ready(self) -> bool:
        return self._contract is not None and self._account is not None and self._w3 is not None

    @staticmethod
    def _hash(payload: Any) -> bytes:
        encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(encoded).digest()

    @staticmethod
    def _context_ref(reference: Optional[str]) -> bytes:
        if not reference:
            return b"\x00" * 32
        return hashlib.sha256(reference.encode("utf-8")).digest()

    def log_decision(
        self,
        *,
        input_payload: Any,
        output_payload: Any,
        model: str,
        latency_ms: int,
        topic: str,
        context_ref: Optional[str],
    ) -> LogResult:
        input_hash_bytes = self._hash(input_payload)
        output_hash_bytes = self._hash(output_payload)
        input_hash = "0x" + input_hash_bytes.hex()
        output_hash = "0x" + output_hash_bytes.hex()

        if not self.is_ready():
            return LogResult(
                tx_hash=None,
                input_hash=input_hash,
                output_hash=output_hash,
                explorer_url=None,
                error="on-chain-logger-disabled",
            )

        full_topic = f"{self.topic_prefix}.{topic}" if topic else self.topic_prefix

        try:
            with self._lock:
                assert self._w3 and self._contract and self._account is not None
                nonce = self._w3.eth.get_transaction_count(self._account.address, "pending")
                gas_price = self._w3.eth.gas_price

                tx = self._contract.functions.logDecision(
                    self.agent_id,
                    input_hash_bytes,
                    output_hash_bytes,
                    self._context_ref(context_ref),
                    min(latency_ms, 2**32 - 1),
                    model[:128],
                    full_topic[:128],
                ).build_transaction(
                    {
                        "from": self._account.address,
                        "nonce": nonce,
                        "chainId": self.chain_id,
                        "gas": 250_000,
                        "gasPrice": gas_price,
                    }
                )

                signed = self._account.sign_transaction(tx)
                raw_tx = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction")
                tx_hash_bytes = self._w3.eth.send_raw_transaction(raw_tx)
                tx_hash = tx_hash_bytes.hex()
                if not tx_hash.startswith("0x"):
                    tx_hash = "0x" + tx_hash

            explorer_url = f"{self.explorer}/tx/{tx_hash}" if self.explorer else None
            return LogResult(
                tx_hash=tx_hash,
                input_hash=input_hash,
                output_hash=output_hash,
                explorer_url=explorer_url,
            )
        except Web3RPCError as exc:
            log.warning("RPC rejected logDecision: %s", exc)
            return LogResult(
                tx_hash=None,
                input_hash=input_hash,
                output_hash=output_hash,
                explorer_url=None,
                error=f"rpc-error: {exc}",
            )
        except Exception as exc:  # pragma: no cover - defensive
            log.exception("Failed to log decision on-chain")
            return LogResult(
                tx_hash=None,
                input_hash=input_hash,
                output_hash=output_hash,
                explorer_url=None,
                error=str(exc),
            )


_logger_singleton: Optional[OnChainLogger] = None


def get_logger() -> OnChainLogger:
    global _logger_singleton
    if _logger_singleton is None:
        _logger_singleton = OnChainLogger()
    return _logger_singleton
