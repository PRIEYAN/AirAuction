// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentIdentity {
    function operatorOf(uint256 agentId) external view returns (address);
    function isOperator(uint256 agentId, address account) external view returns (bool);
}

/// @title AgentBenchmark
/// @notice Permanent on-chain ledger of agent decisions. Every call to an
///         AI agent is hashed and logged so the wider ecosystem can audit how
///         agents perform over time.
contract AgentBenchmark {
    struct Decision {
        uint256 agentId;
        bytes32 inputHash;
        bytes32 outputHash;
        bytes32 contextRef;   // domain-specific (e.g. auctionId)
        uint64 timestamp;
        uint32 latencyMs;
        string model;
        string topic;         // e.g. "auctioneer.narrate"
    }

    IAgentIdentity public immutable identity;
    uint256 public decisionCount;

    mapping(uint256 => Decision) public decisions;
    mapping(uint256 => uint256[]) public decisionsByAgent;
    mapping(uint256 => uint256) public decisionCountFor;
    mapping(bytes32 => uint256[]) public decisionsByContext;

    event DecisionLogged(
        uint256 indexed decisionId,
        uint256 indexed agentId,
        bytes32 indexed contextRef,
        bytes32 inputHash,
        bytes32 outputHash,
        string model,
        string topic,
        uint32 latencyMs
    );

    error NotAgentOperator();
    error UnknownAgent();

    function logDecision(
        uint256 agentId,
        bytes32 inputHash,
        bytes32 outputHash,
        bytes32 contextRef,
        uint32 latencyMs,
        string calldata model,
        string calldata topic
    ) external returns (uint256 decisionId) {
        if (!identity.isOperator(agentId, msg.sender)) revert NotAgentOperator();

        decisionId = ++decisionCount;
        decisions[decisionId] = Decision({
            agentId: agentId,
            inputHash: inputHash,
            outputHash: outputHash,
            contextRef: contextRef,
            timestamp: uint64(block.timestamp),
            latencyMs: latencyMs,
            model: model,
            topic: topic
        });

        decisionsByAgent[agentId].push(decisionId);
        decisionCountFor[agentId] += 1;
        if (contextRef != bytes32(0)) {
            decisionsByContext[contextRef].push(decisionId);
        }

        emit DecisionLogged(
            decisionId,
            agentId,
            contextRef,
            inputHash,
            outputHash,
            model,
            topic,
            latencyMs
        );
    }

    function recentDecisions(uint256 agentId, uint256 limit, uint256 offset)
        external
        view
        returns (Decision[] memory page)
    {
        uint256[] storage ids = decisionsByAgent[agentId];
        uint256 total = ids.length;
        if (offset >= total) return new Decision[](0);

        uint256 size = total - offset;
        if (size > limit) size = limit;
        page = new Decision[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = decisions[ids[total - 1 - offset - i]];
        }
    }

    function recentGlobal(uint256 limit, uint256 offset)
        external
        view
        returns (Decision[] memory page)
    {
        uint256 total = decisionCount;
        if (offset >= total) return new Decision[](0);

        uint256 size = total - offset;
        if (size > limit) size = limit;
        page = new Decision[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = decisions[total - offset - i];
        }
    }

    constructor(address identityRegistry) {
        identity = IAgentIdentity(identityRegistry);
    }
}
