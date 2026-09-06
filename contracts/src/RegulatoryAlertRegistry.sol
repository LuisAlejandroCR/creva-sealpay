// SPDX-License-Identifier: MIT
// RegulatoryAlertRegistry.sol: on-chain log of regulatory changes that touch already-anchored
// Creva folios. A Chainlink upkeep (CRE cron workflow or an Automation custom-logic upkeep) is the
// only thing that turns a pending regulatory change into on-chain state: checkUpkeep reports what
// is pending, performUpkeep writes the RegulatoryFlag events and marks the norm handled. The
// "is there a new norm" signal comes from the core regulatory radar, surfaced off-chain by the
// gateway's GET /regulatory/pending and pushed into `pending*` by the reporter (a Chainlink
// Functions job or the gateway signer). Distinct from AttestationRegistry.sol: that one logs that
// a report existed; this one logs that the rules under a report moved after it was anchored.
pragma solidity 0.8.24;

// Minimal shape of Chainlink's AutomationCompatibleInterface — vendored so the contract carries no
// external dependency. A CRE workflow can also just call performUpkeep directly with encoded data.
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData)
        external
        returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}

contract RegulatoryAlertRegistry is AutomationCompatibleInterface {
    // Set once at deploy: the account allowed to publish a pending regulatory change. In production
    // this is the Chainlink Functions consumer (or, for the local demo, the gateway signer).
    address public immutable reporter;

    // Chainlink Automation hands you a dedicated forwarder address only after the upkeep is
    // registered, so it cannot be immutable. The reporter wires it once; address(0) means
    // "any caller may perform" which is what the anvil demo and the unit tests use.
    address public forwarder;

    // The single regulatory change awaiting on-chain flagging. One slot on purpose: the radar
    // publishes the newest matching norm, and performUpkeep clears it before the next can land.
    bytes32 public pendingNormId;
    bytes32[] private pendingFolios;

    mapping(bytes32 => bool) public normFlagged;
    mapping(bytes32 => mapping(bytes32 => bool)) public folioFlagged;

    event ForwarderSet(address indexed forwarder);
    event RegulatoryPending(bytes32 indexed normId, uint256 folioCount);
    event RegulatoryFlag(bytes32 indexed folioHash, bytes32 indexed normId, uint256 timestamp);
    event RegulatoryCleared(bytes32 indexed normId);

    error NotReporter();
    error NotForwarder();
    error ForwarderAlreadySet();
    error EmptyNormId();
    error NoFolios();
    error NormAlreadyFlagged();
    error NothingPending();
    error StalePerformData();

    constructor(address reporter_) {
        if (reporter_ == address(0)) revert NotReporter();
        reporter = reporter_;
    }

    modifier onlyReporter() {
        if (msg.sender != reporter) revert NotReporter();
        _;
    }

    function setForwarder(address forwarder_) external onlyReporter {
        if (forwarder != address(0)) revert ForwarderAlreadySet();
        forwarder = forwarder_;
        emit ForwarderSet(forwarder_);
    }

    // Off-chain -> on-chain bridge. The reporter publishes the norm the radar flagged and the set
    // of anchored folios it applies to (the radar scan is global by design, so the folio set is
    // "every folio anchored as of this scan", taken from the attestation subgraph by the gateway).
    function reportPending(bytes32 normId, bytes32[] calldata folios) external onlyReporter {
        if (normId == bytes32(0)) revert EmptyNormId();
        if (folios.length == 0) revert NoFolios();
        if (normFlagged[normId]) revert NormAlreadyFlagged();

        pendingNormId = normId;
        delete pendingFolios;
        for (uint256 i = 0; i < folios.length; i++) {
            pendingFolios.push(folios[i]);
        }
        emit RegulatoryPending(normId, folios.length);
    }

    function pendingFolioList() external view returns (bytes32[] memory) {
        return pendingFolios;
    }

    // Chainlink calls this off-chain (view) to decide whether to fire. performData is the exact
    // payload performUpkeep must be handed back.
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        bytes32 normId = pendingNormId;
        upkeepNeeded = normId != bytes32(0) && !normFlagged[normId];
        performData = abi.encode(normId, pendingFolios);
    }

    // The only state-changing entry point Chainlink drives. Reverts unless the payload matches
    // exactly what checkUpkeep would return right now — so a stale or hand-crafted call is a no-op
    // revert, never a partial write.
    function performUpkeep(bytes calldata performData) external override {
        if (forwarder != address(0) && msg.sender != forwarder) revert NotForwarder();

        (bytes32 normId, bytes32[] memory folios) = abi.decode(performData, (bytes32, bytes32[]));

        if (pendingNormId == bytes32(0)) revert NothingPending();
        if (normId != pendingNormId) revert StalePerformData();
        if (normFlagged[normId]) revert NormAlreadyFlagged();
        if (keccak256(performData) != keccak256(abi.encode(pendingNormId, pendingFolios))) {
            revert StalePerformData();
        }

        normFlagged[normId] = true;
        for (uint256 i = 0; i < folios.length; i++) {
            bytes32 folio = folios[i];
            if (folio == bytes32(0) || folioFlagged[normId][folio]) continue;
            folioFlagged[normId][folio] = true;
            emit RegulatoryFlag(folio, normId, block.timestamp);
        }

        pendingNormId = bytes32(0);
        delete pendingFolios;
        emit RegulatoryCleared(normId);
    }
}
