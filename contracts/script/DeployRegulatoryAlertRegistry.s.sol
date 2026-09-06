// SPDX-License-Identifier: MIT
// DeployRegulatoryAlertRegistry.s.sol: deploys RegulatoryAlertRegistry to whatever RPC forge is
// pointed at. Signer is ARC_SIGNER_PRIVATE_KEY (same key Deploy.s.sol and config.ts use). The
// reporter defaults to the signer address unless REGULATORY_REPORTER is set (the Chainlink
// Functions consumer address, once it exists). Usage is documented in
// docs/integrations/chainlink-automation.md.
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {RegulatoryAlertRegistry} from "../src/RegulatoryAlertRegistry.sol";

contract DeployRegulatoryAlertRegistry is Script {
    function run() external returns (address registry) {
        uint256 pk = vm.envUint("ARC_SIGNER_PRIVATE_KEY");
        address reporter = vm.envOr("REGULATORY_REPORTER", vm.addr(pk));
        vm.startBroadcast(pk);
        registry = address(new RegulatoryAlertRegistry(reporter));
        vm.stopBroadcast();
    }
}
