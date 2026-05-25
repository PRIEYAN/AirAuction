// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title AgentIdentityRegistry
/// @notice ERC-8004-aligned identity registry. Every agent is represented by a
///         non-marketplace ERC-721 token whose owner is the agent's operator.
///         Transfers are restricted to the current operator so that identities
///         can never be silently sniped on a secondary market.
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

contract AgentIdentityRegistry is IERC165 {
    string public constant name = "AuctionAir Agent Identity";
    string public constant symbol = "AGENT-ID";

    struct AgentRecord {
        string label;        // human readable name
        string domain;       // canonical URL / DID describing the agent
        string description;
        string metadataURI;  // ERC-721 metadata (capabilities, model, etc.)
        uint64 registeredAt;
    }

    uint256 public agentCount;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => AgentRecord) private _records;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AgentRegistered(uint256 indexed agentId, address indexed operator, string label, string domain);
    event AgentMetadataUpdated(uint256 indexed agentId, string metadataURI);
    event AgentOperatorChanged(uint256 indexed agentId, address indexed from, address indexed to);

    error NotOperator();
    error UnknownAgent();
    error ZeroAddress();

    modifier onlyOperator(uint256 agentId) {
        if (_owners[agentId] != msg.sender) revert NotOperator();
        _;
    }

    /// @notice Register a new agent. The caller becomes the operator.
    function registerAgent(
        address operator,
        string calldata label,
        string calldata domain,
        string calldata description,
        string calldata metadataURI
    ) external returns (uint256 agentId) {
        if (operator == address(0)) revert ZeroAddress();
        agentId = ++agentCount;
        _owners[agentId] = operator;
        _balances[operator] += 1;
        _records[agentId] = AgentRecord({
            label: label,
            domain: domain,
            description: description,
            metadataURI: metadataURI,
            registeredAt: uint64(block.timestamp)
        });
        emit Transfer(address(0), operator, agentId);
        emit AgentRegistered(agentId, operator, label, domain);
    }

    /// @notice Transfer operator control. Only the current operator may call.
    function transferOperator(uint256 agentId, address newOperator) external onlyOperator(agentId) {
        if (newOperator == address(0)) revert ZeroAddress();
        address previous = _owners[agentId];
        unchecked {
            _balances[previous] -= 1;
            _balances[newOperator] += 1;
        }
        _owners[agentId] = newOperator;
        emit Transfer(previous, newOperator, agentId);
        emit AgentOperatorChanged(agentId, previous, newOperator);
    }

    function setMetadataURI(uint256 agentId, string calldata uri) external onlyOperator(agentId) {
        _records[agentId].metadataURI = uri;
        emit AgentMetadataUpdated(agentId, uri);
    }

    function setProfile(
        uint256 agentId,
        string calldata label,
        string calldata domain,
        string calldata description
    ) external onlyOperator(agentId) {
        AgentRecord storage record = _records[agentId];
        record.label = label;
        record.domain = domain;
        record.description = description;
    }

    function operatorOf(uint256 agentId) external view returns (address) {
        address operator = _owners[agentId];
        if (operator == address(0)) revert UnknownAgent();
        return operator;
    }

    function isOperator(uint256 agentId, address account) external view returns (bool) {
        return _owners[agentId] == account;
    }

    function agentOf(uint256 agentId)
        external
        view
        returns (
            address operator,
            string memory label,
            string memory domain,
            string memory description,
            string memory metadataURI,
            uint64 registeredAt
        )
    {
        address current = _owners[agentId];
        if (current == address(0)) revert UnknownAgent();
        AgentRecord storage record = _records[agentId];
        return (current, record.label, record.domain, record.description, record.metadataURI, record.registeredAt);
    }

    // -- Minimal ERC-721 surface (read-only marketplaces are intentionally not supported)

    function ownerOf(uint256 tokenId) external view returns (address) {
        address current = _owners[tokenId];
        if (current == address(0)) revert UnknownAgent();
        return current;
    }

    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _balances[account];
    }

    function tokenURI(uint256 agentId) external view returns (string memory) {
        if (_owners[agentId] == address(0)) revert UnknownAgent();
        return _records[agentId].metadataURI;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == 0x80ac58cd || // ERC721
            interfaceId == 0x5b5e139f;   // ERC721Metadata
    }
}
