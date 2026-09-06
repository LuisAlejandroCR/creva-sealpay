// SPDX-License-Identifier: MIT
// AttestationRegistry.sol: minimal on-chain attestation log for sealed Creva report hashes.
// attest(folioHash) emits an indexable Attested event; the value lives in the event stream that a
// subgraph indexes, not in contract storage. attestationCount is a convenience mirror only — the
// subgraph derives distinct-attester counts from the logs, which is what drives the verify trust
// signal. No owner, no upgrade path, no funds: nothing here to compromise.
pragma solidity 0.8.24;

contract AttestationRegistry {
    event Attested(bytes32 indexed folioHash, address indexed attester, uint256 timestamp);

    // folioHash => number of attest() calls seen (all attesters, includes repeats).
    mapping(bytes32 => uint256) public attestationCount;

    error EmptyFolioHash();

    function attest(bytes32 folioHash) external {
        if (folioHash == bytes32(0)) revert EmptyFolioHash();
        attestationCount[folioHash] += 1;
        emit Attested(folioHash, msg.sender, block.timestamp);
    }
}
