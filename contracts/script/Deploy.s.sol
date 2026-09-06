// SPDX-License-Identifier: MIT
// Deploy.s.sol: deploys AttestationRegistry to whatever RPC forge is pointed at. Reads the signer
// from the ARC_SIGNER_PRIVATE_KEY env var (same key config.ts uses for the Arc anchor), so no new
// secret is introduced. Usage is documented in contracts/README.md.
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {AttestationRegistry} from "../src/AttestationRegistry.sol";

contract Deploy is Script {
    function run() external returns (address registry) {
        uint256 pk = vm.envUint("ARC_SIGNER_PRIVATE_KEY");
        vm.startBroadcast(pk);
        registry = address(new AttestationRegistry());
        vm.stopBroadcast();
    }
}
