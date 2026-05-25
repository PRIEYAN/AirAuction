// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAgentIdentityRegistry {
    function operatorOf(uint256 agentId) external view returns (address);
}

/// @title AgentReputationRegistry
/// @notice Permissionless feedback log. Any address can leave one piece of
///         feedback per (decisionRef) for a given agent so that votes are
///         linked to a specific on-chain decision when possible.
contract AgentReputationRegistry {
    enum Verdict {
        Negative, // -1
        Neutral,  //  0
        Positive  // +1
    }

    struct Feedback {
        uint256 agentId;
        address client;
        Verdict verdict;
        bytes32 dataHash;     // hash of the off-chain feedback payload
        bytes32 decisionRef;  // optional reference to a benchmark decision
        string memo;
        uint64 timestamp;
    }

    IAgentIdentityRegistry public immutable identity;

    uint256 public feedbackCount;
    mapping(uint256 => Feedback) public feedback;

    mapping(uint256 => uint256) public feedbackCountFor;       // agentId => count
    mapping(uint256 => int256) public scoreOf;                 // agentId => running score
    mapping(uint256 => uint256[]) public feedbackIdsByAgent;   // agentId => feedbackIds[]
    mapping(uint256 => mapping(bytes32 => mapping(address => bool))) public hasVoted;

    event FeedbackSubmitted(
        uint256 indexed feedbackId,
        uint256 indexed agentId,
        address indexed client,
        Verdict verdict,
        bytes32 dataHash,
        bytes32 decisionRef
    );

    error UnknownAgent();
    error DuplicateVote();

    constructor(address identityRegistry) {
        identity = IAgentIdentityRegistry(identityRegistry);
    }

    function submitFeedback(
        uint256 agentId,
        Verdict verdict,
        bytes32 dataHash,
        bytes32 decisionRef,
        string calldata memo
    ) external returns (uint256 feedbackId) {
        // Reverts if the agent has never been registered.
        identity.operatorOf(agentId);

        if (decisionRef != bytes32(0)) {
            if (hasVoted[agentId][decisionRef][msg.sender]) revert DuplicateVote();
            hasVoted[agentId][decisionRef][msg.sender] = true;
        }

        feedbackId = ++feedbackCount;
        feedback[feedbackId] = Feedback({
            agentId: agentId,
            client: msg.sender,
            verdict: verdict,
            dataHash: dataHash,
            decisionRef: decisionRef,
            memo: memo,
            timestamp: uint64(block.timestamp)
        });

        feedbackIdsByAgent[agentId].push(feedbackId);
        feedbackCountFor[agentId] += 1;
        if (verdict == Verdict.Positive) {
            scoreOf[agentId] += 1;
        } else if (verdict == Verdict.Negative) {
            scoreOf[agentId] -= 1;
        }

        emit FeedbackSubmitted(feedbackId, agentId, msg.sender, verdict, dataHash, decisionRef);
    }

    function reputationOf(uint256 agentId) external view returns (int256 score, uint256 total) {
        return (scoreOf[agentId], feedbackCountFor[agentId]);
    }

    function feedbackForAgent(uint256 agentId, uint256 limit, uint256 offset)
        external
        view
        returns (Feedback[] memory page)
    {
        uint256[] storage ids = feedbackIdsByAgent[agentId];
        uint256 total = ids.length;
        if (offset >= total) return new Feedback[](0);

        uint256 size = total - offset;
        if (size > limit) size = limit;
        page = new Feedback[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = feedback[ids[total - 1 - offset - i]];
        }
    }
}
