// SPDX-License-Identifier: MIT
// RegulatoryAlertRegistry.t.sol: unit + fuzz + invariant coverage for the Chainlink-driven
// regulatory flag log. The invariant that matters: performUpkeep only moves state when it is
// handed back the exact payload checkUpkeep returned while upkeepNeeded was true — a stale or
// forged payload reverts and writes nothing.
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {RegulatoryAlertRegistry} from "../src/RegulatoryAlertRegistry.sol";

contract RegulatoryAlertRegistryTest is Test {
    RegulatoryAlertRegistry internal registry;
    address internal reporter = address(0xA11CE);

    event RegulatoryFlag(bytes32 indexed folioHash, bytes32 indexed normId, uint256 timestamp);
    event RegulatoryPending(bytes32 indexed normId, uint256 folioCount);
    event RegulatoryCleared(bytes32 indexed normId);

    function setUp() external {
        registry = new RegulatoryAlertRegistry(reporter);
    }

    function _folios() internal pure returns (bytes32[] memory f) {
        f = new bytes32[](2);
        f[0] = keccak256("folio-a");
        f[1] = keccak256("folio-b");
    }

    function test_constructor_rejectsZeroReporter() external {
        vm.expectRevert(RegulatoryAlertRegistry.NotReporter.selector);
        new RegulatoryAlertRegistry(address(0));
    }

    function test_reportPending_onlyReporter() external {
        vm.expectRevert(RegulatoryAlertRegistry.NotReporter.selector);
        registry.reportPending(keccak256("n"), _folios());
    }

    function test_reportPending_rejectsEmptyNormAndFolios() external {
        vm.startPrank(reporter);
        vm.expectRevert(RegulatoryAlertRegistry.EmptyNormId.selector);
        registry.reportPending(bytes32(0), _folios());
        vm.expectRevert(RegulatoryAlertRegistry.NoFolios.selector);
        registry.reportPending(keccak256("n"), new bytes32[](0));
        vm.stopPrank();
    }

    function test_checkThenPerform_flagsEveryFolioAndClears() external {
        bytes32 normId = keccak256("norm-2026-09");
        vm.prank(reporter);
        registry.reportPending(normId, _folios());

        (bool needed, bytes memory performData) = registry.checkUpkeep("");
        assertTrue(needed);

        vm.expectEmit(true, true, false, true);
        emit RegulatoryFlag(keccak256("folio-a"), normId, block.timestamp);
        vm.expectEmit(true, true, false, true);
        emit RegulatoryFlag(keccak256("folio-b"), normId, block.timestamp);
        vm.expectEmit(true, false, false, false);
        emit RegulatoryCleared(normId);
        registry.performUpkeep(performData);

        assertTrue(registry.normFlagged(normId));
        assertTrue(registry.folioFlagged(normId, keccak256("folio-a")));
        assertTrue(registry.folioFlagged(normId, keccak256("folio-b")));
        assertEq(registry.pendingNormId(), bytes32(0));

        (bool neededAfter,) = registry.checkUpkeep("");
        assertFalse(neededAfter);
    }

    function test_performUpkeep_revertsOnStalePayload() external {
        bytes32 normId = keccak256("norm-x");
        vm.prank(reporter);
        registry.reportPending(normId, _folios());

        bytes memory forged = abi.encode(keccak256("other-norm"), _folios());
        vm.expectRevert(RegulatoryAlertRegistry.StalePerformData.selector);
        registry.performUpkeep(forged);

        // Right norm, wrong folio set -> keccak mismatch -> still reverts, still no write.
        bytes32[] memory one = new bytes32[](1);
        one[0] = keccak256("folio-a");
        vm.expectRevert(RegulatoryAlertRegistry.StalePerformData.selector);
        registry.performUpkeep(abi.encode(normId, one));

        assertFalse(registry.normFlagged(normId));
    }

    function test_performUpkeep_revertsWhenNothingPending() external {
        vm.expectRevert(RegulatoryAlertRegistry.NothingPending.selector);
        registry.performUpkeep(abi.encode(bytes32(0), new bytes32[](0)));
    }

    function test_reportPending_rejectsAlreadyFlaggedNorm() external {
        bytes32 normId = keccak256("norm-once");
        vm.startPrank(reporter);
        registry.reportPending(normId, _folios());
        vm.stopPrank();
        (, bytes memory performData) = registry.checkUpkeep("");
        registry.performUpkeep(performData);

        vm.prank(reporter);
        vm.expectRevert(RegulatoryAlertRegistry.NormAlreadyFlagged.selector);
        registry.reportPending(normId, _folios());
    }

    function test_forwarder_gatesPerform() external {
        address fwd = address(0xF00D);
        vm.prank(reporter);
        registry.setForwarder(fwd);
        vm.prank(reporter);
        vm.expectRevert(RegulatoryAlertRegistry.ForwarderAlreadySet.selector);
        registry.setForwarder(address(0xBEEF));

        bytes32 normId = keccak256("norm-fwd");
        vm.prank(reporter);
        registry.reportPending(normId, _folios());
        (, bytes memory performData) = registry.checkUpkeep("");

        vm.expectRevert(RegulatoryAlertRegistry.NotForwarder.selector);
        registry.performUpkeep(performData);

        vm.prank(fwd);
        registry.performUpkeep(performData);
        assertTrue(registry.normFlagged(normId));
    }

    function testFuzz_performUpkeep_onlyActsOnCheckUpkeepPayload(bytes32 normId, bytes calldata junk)
        external
    {
        vm.assume(normId != bytes32(0));
        vm.prank(reporter);
        registry.reportPending(normId, _folios());

        (bool needed, bytes memory performData) = registry.checkUpkeep("");
        assertTrue(needed);

        if (keccak256(junk) == keccak256(performData)) {
            registry.performUpkeep(junk);
            assertTrue(registry.normFlagged(normId));
        } else {
            try registry.performUpkeep(junk) {
                // The only way an arbitrary blob succeeds is if it decodes to the pending norm
                // AND re-encodes to the same bytes — in which case flagging is correct.
                assertTrue(registry.normFlagged(normId));
            } catch {
                assertFalse(registry.normFlagged(normId));
                assertEq(registry.pendingNormId(), normId);
            }
        }
    }

    function testFuzz_reportPending_neverFlagsOnItsOwn(bytes32 normId) external {
        vm.assume(normId != bytes32(0));
        vm.prank(reporter);
        registry.reportPending(normId, _folios());
        assertFalse(registry.normFlagged(normId));
    }
}

contract RegulatoryAlertRegistryInvariant is Test {
    RegulatoryAlertRegistry internal registry;
    RegHandler internal handler;

    function setUp() external {
        registry = new RegulatoryAlertRegistry(address(this));
        handler = new RegHandler(registry, address(this));
        // The reporter is this test contract; route reporter calls through the handler.
        targetContract(address(handler));
    }

    // A flagged norm was always published through reportPending first.
    function invariant_flaggedNormsWereReported() external view {
        bytes32[] memory reported = handler.reportedNorms();
        for (uint256 i = 0; i < reported.length; i++) {
            // no-op read; the real check is below over flagged norms
            reported[i];
        }
        bytes32[] memory flagged = handler.flaggedNorms();
        for (uint256 i = 0; i < flagged.length; i++) {
            assertTrue(handler.wasReported(flagged[i]));
            assertTrue(registry.normFlagged(flagged[i]));
        }
    }

    // While a norm is pending it is never already flagged, and performUpkeep count never exceeds
    // the number of distinct norms reported.
    function invariant_pendingIsNeverAlreadyFlagged() external view {
        bytes32 pending = registry.pendingNormId();
        if (pending != bytes32(0)) {
            assertFalse(registry.normFlagged(pending));
        }
        assertLe(handler.performedCount(), handler.distinctReportedCount());
    }
}

contract RegHandler is Test {
    RegulatoryAlertRegistry internal registry;
    address internal reporter;

    bytes32[] private _reportedNorms;
    bytes32[] private _flaggedNorms;
    mapping(bytes32 => bool) public wasReported;
    uint256 public performedCount;
    uint256 public distinctReportedCount;

    constructor(RegulatoryAlertRegistry r, address reporter_) {
        registry = r;
        reporter = reporter_;
    }

    function reportedNorms() external view returns (bytes32[] memory) {
        return _reportedNorms;
    }

    function flaggedNorms() external view returns (bytes32[] memory) {
        return _flaggedNorms;
    }

    function report(uint256 seed) external {
        bytes32 normId = keccak256(abi.encode("norm", seed));
        if (normId == bytes32(0) || registry.normFlagged(normId) || registry.pendingNormId() != bytes32(0)) {
            return;
        }
        bytes32[] memory folios = new bytes32[](2);
        folios[0] = keccak256(abi.encode("folio", seed, uint256(0)));
        folios[1] = keccak256(abi.encode("folio", seed, uint256(1)));

        vm.prank(reporter);
        registry.reportPending(normId, folios);

        _reportedNorms.push(normId);
        if (!wasReported[normId]) {
            wasReported[normId] = true;
            distinctReportedCount += 1;
        }
    }

    function perform() external {
        (bool needed, bytes memory performData) = registry.checkUpkeep("");
        if (!needed) return;
        bytes32 normId = registry.pendingNormId();
        registry.performUpkeep(performData);
        _flaggedNorms.push(normId);
        performedCount += 1;
    }

    function performGarbage(bytes calldata junk) external {
        bytes32 pendingBefore = registry.pendingNormId();
        try registry.performUpkeep(junk) {
            // Accepted only if junk equalled the canonical payload.
        } catch {
            assertEq(registry.pendingNormId(), pendingBefore);
        }
    }
}
