// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract AuctionAirEscrow is IERC721Receiver {
    enum AuctionStatus {
        Scheduled,
        Live,
        Settled,
        Cancelled
    }

    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 reservePrice;
        uint256 startingBid;
        uint64 startTime;
        uint64 endTime;
        uint16 depositBps;
        address highestBidder;
        uint256 highestBid;
        bool settled;
        string metadataURI;
    }

    uint16 public constant MAX_PLATFORM_FEE_BPS = 1_000;
    uint16 public constant MAX_DEPOSIT_BPS = 5_000;
    uint256 public auctionCount;
    address public owner;
    address public feeRecipient;
    uint16 public platformFeeBps;

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => uint256)) public deposits;
    mapping(uint256 => mapping(address => bool)) public registered;
    mapping(uint256 => address[]) private bidders;

    bool private locked;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 reservePrice,
        uint256 startingBid,
        uint64 startTime,
        uint64 endTime,
        string metadataURI
    );
    event BidderRegistered(uint256 indexed auctionId, address indexed bidder, uint256 deposit);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionSettled(uint256 indexed auctionId, address winner, uint256 amount, bool reserveMet);
    event AuctionCancelled(uint256 indexed auctionId);
    event FeeUpdated(address feeRecipient, uint16 platformFeeBps);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "reentrant");
        locked = true;
        _;
        locked = false;
    }

    constructor(address initialFeeRecipient, uint16 initialPlatformFeeBps) {
        require(initialPlatformFeeBps <= MAX_PLATFORM_FEE_BPS, "fee too high");
        owner = msg.sender;
        feeRecipient = initialFeeRecipient == address(0) ? msg.sender : initialFeeRecipient;
        platformFeeBps = initialPlatformFeeBps;
    }

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 reservePrice,
        uint256 startingBid,
        uint64 startTime,
        uint64 endTime,
        uint16 depositBps,
        string calldata metadataURI
    ) external nonReentrant returns (uint256 auctionId) {
        require(nftContract != address(0), "bad nft");
        require(endTime > startTime, "bad time");
        require(endTime > block.timestamp, "ended");
        require(startingBid > 0, "bad start");
        require(reservePrice >= startingBid, "reserve below start");
        require(depositBps <= MAX_DEPOSIT_BPS, "deposit too high");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "not token owner");
        require(
            nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)),
            "escrow not approved"
        );

        auctionId = ++auctionCount;
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            reservePrice: reservePrice,
            startingBid: startingBid,
            startTime: startTime,
            endTime: endTime,
            depositBps: depositBps,
            highestBidder: address(0),
            highestBid: 0,
            settled: false,
            metadataURI: metadataURI
        });

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            reservePrice,
            startingBid,
            startTime,
            endTime,
            metadataURI
        );
    }

    function registerForAuction(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "missing auction");
        require(block.timestamp < auction.endTime, "ended");
        require(msg.sender != auction.seller, "seller blocked");
        require(!registered[auctionId][msg.sender], "registered");

        uint256 requiredDeposit = (auction.startingBid * auction.depositBps) / 10_000;
        require(msg.value >= requiredDeposit, "deposit too low");

        registered[auctionId][msg.sender] = true;
        deposits[auctionId][msg.sender] = msg.value;
        bidders[auctionId].push(msg.sender);

        emit BidderRegistered(auctionId, msg.sender, msg.value);
    }

    function placeBid(uint256 auctionId, uint256 bidAmount) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "missing auction");
        require(block.timestamp >= auction.startTime, "not started");
        require(block.timestamp < auction.endTime, "ended");
        require(msg.sender != auction.seller, "seller blocked");
        require(registered[auctionId][msg.sender], "not registered");

        uint256 available = deposits[auctionId][msg.sender] + msg.value;
        uint256 minBid = auction.highestBid == 0 ? auction.startingBid : auction.highestBid + 1;
        require(bidAmount >= minBid, "bid too low");
        require(available >= bidAmount, "payment too low");

        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;
        if (previousBidder != address(0)) {
            deposits[auctionId][previousBidder] += previousBid;
        }

        deposits[auctionId][msg.sender] = available - bidAmount;
        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;

        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }

    function settle(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.seller != address(0), "missing auction");
        require(block.timestamp >= auction.endTime, "not ended");
        require(!auction.settled, "settled");
        auction.settled = true;

        bool reserveMet = auction.highestBidder != address(0) && auction.highestBid >= auction.reservePrice;
        if (reserveMet) {
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);

            uint256 fee = (auction.highestBid * platformFeeBps) / 10_000;
            _send(feeRecipient, fee);
            _send(auction.seller, auction.highestBid - fee);
            uint256 winnerRemainder = deposits[auctionId][auction.highestBidder];
            if (winnerRemainder > 0) {
                deposits[auctionId][auction.highestBidder] = 0;
                _send(auction.highestBidder, winnerRemainder);
            }
            _refundLosingDeposits(auctionId, auction.highestBidder);
        } else {
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            if (auction.highestBidder != address(0)) {
                deposits[auctionId][auction.highestBidder] += auction.highestBid;
            }
            _refundLosingDeposits(auctionId, address(0));
        }

        emit AuctionSettled(auctionId, auction.highestBidder, auction.highestBid, reserveMet);
    }

    function withdrawRefund(uint256 auctionId) external nonReentrant {
        uint256 amount = deposits[auctionId][msg.sender];
        require(amount > 0, "no refund");
        deposits[auctionId][msg.sender] = 0;
        _send(msg.sender, amount);
    }

    function cancelUnstartedAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.seller, "not seller");
        require(block.timestamp < auction.startTime, "started");
        require(!auction.settled, "settled");
        auction.settled = true;
        IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
        _refundLosingDeposits(auctionId, address(0));
        emit AuctionCancelled(auctionId);
    }

    function setFee(address newFeeRecipient, uint16 newPlatformFeeBps) external onlyOwner {
        require(newFeeRecipient != address(0), "bad recipient");
        require(newPlatformFeeBps <= MAX_PLATFORM_FEE_BPS, "fee too high");
        feeRecipient = newFeeRecipient;
        platformFeeBps = newPlatformFeeBps;
        emit FeeUpdated(newFeeRecipient, newPlatformFeeBps);
    }

    function getBidders(uint256 auctionId) external view returns (address[] memory) {
        return bidders[auctionId];
    }

    function statusOf(uint256 auctionId) external view returns (AuctionStatus) {
        Auction storage auction = auctions[auctionId];
        if (auction.settled) return AuctionStatus.Settled;
        if (block.timestamp < auction.startTime) return AuctionStatus.Scheduled;
        if (block.timestamp <= auction.endTime) return AuctionStatus.Live;
        return AuctionStatus.Live;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function _refundLosingDeposits(uint256 auctionId, address winner) private {
        address[] storage list = bidders[auctionId];
        for (uint256 i = 0; i < list.length; i++) {
            address bidder = list[i];
            if (bidder == winner) continue;
            uint256 amount = deposits[auctionId][bidder];
            if (amount > 0) {
                deposits[auctionId][bidder] = 0;
                _send(bidder, amount);
            }
        }
    }

    function _send(address to, uint256 amount) private {
        if (amount == 0) return;
        (bool ok,) = payable(to).call{ value: amount }("");
        require(ok, "eth send failed");
    }
}
