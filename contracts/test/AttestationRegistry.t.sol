// SPDX-License-Identifier: MIT
// AttestationRegistry.t.sol: unit + fuzz + invariant coverage for the attestation log. The
// invariant that matters for the verify trust signal: attestationCount for a folio is never
// non-zero unless attest() was called for exactly that folioHash.
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {AttestationRegistry} from "../src/AttestationRegistry.sol";

contract AttestationRegistryTest is Test {
    AttestationRegistry internal registry;

    event Attested(bytes32 indexed folioHash, address indexed attester, uint256 timestamp);

    function setUp() external {
        registry = new AttestationRegistry();
    }

    function test_attest_emitsEventAndIncrements() external {
        bytes32 folio = keccak256("folio-1");
        vm.expectEmit(true, true, false, true);
        emit Attested(folio, address(this), block.timestamp);
        registry.attest(folio);
        assertEq(registry.attestationCount(folio), 1);
    }

    function test_attest_revertsOnZero() external {
        vm.expectRevert(AttestationRegistry.EmptyFolioHash.selector);
        registry.attest(bytes32(0));
    }

    function test_twoDistinctAttesters_bothCounted() external {
        bytes32 folio = keccak256("folio-corroborated");
        vm.prank(address(0xA11CE));
        registry.attest(folio);
        vm.prank(address(0xB0B));
        registry.attest(folio);
        assertEq(registry.attestationCount(folio), 2);
    }

    function testFuzz_attest_neverCountsOtherFolios(bytes32 a, bytes32 b) external {
        vm.assume(a != bytes32(0) && b != bytes32(0) && a != b);
        registry.attest(a);
        assertEq(registry.attestationCount(b), 0);
        assertEq(registry.attestationCount(a), 1);
    }

    function testFuzz_attest_zeroAlwaysReverts() external {
        vm.expectRevert(AttestationRegistry.EmptyFolioHash.selector);
        registry.attest(bytes32(0));
    }
}

contract AttestationRegistryInvariant is Test {
    AttestationRegistry internal registry;
    Handler internal handler;

    function setUp() external {
        registry = new AttestationRegistry();
        handler = new Handler(registry);
        targetContract(address(handler));
    }

    // A folio that was never attested must always read back as count 0.
    function invariant_untouchedFolioStaysZero() external view {
        assertEq(registry.attestationCount(keccak256("never-attested-sentinel")), 0);
    }

    // The mirror count can never drift below the number of successful attests the handler made.
    function invariant_countMatchesHandlerCalls() external view {
        assertEq(registry.attestationCount(handler.FOLIO()), handler.successfulAttests());
    }
}

contract Handler is Test {
    AttestationRegistry internal registry;
    bytes32 public constant FOLIO = keccak256("handler-folio");
    uint256 public successfulAttests;

    constructor(AttestationRegistry r) {
        registry = r;
    }

    function attest(uint256 actor) external {
        vm.prank(address(uint160(bound(actor, 1, type(uint160).max))));
        registry.attest(FOLIO);
        successfulAttests += 1;
    }
}
