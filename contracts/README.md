<!-- contracts/README.md: cómo compilar, testear y desplegar AttestationRegistry. El diseño y el
     porqué del mecanismo viven en docs/integrations/onchain-attestation.md; aquí solo comandos. -->

# AttestationRegistry (Foundry)

Minimal on-chain attestation log for sealed Creva report hashes. `attest(bytes32 folioHash)` emits
an indexable `Attested` event; a subgraph turns the distinct-attester count into the
`/creva-score/verify` trust signal.

## Setup

`lib/` is gitignored — install forge-std on a fresh checkout:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit    # or: git clone --depth 1 https://github.com/foundry-rs/forge-std lib/forge-std
forge build
forge test
```

## Deploy

```bash
export ARC_SIGNER_PRIVATE_KEY=<key>               # already in gateway/.env
forge script script/Deploy.s.sol --rpc-url "$ARC_RPC_URL" --broadcast        # Arc testnet
forge script script/Deploy.s.sol --rpc-url "$SEPOLIA_RPC_URL" --broadcast    # Sepolia (subgraph-indexed)
```

Record the deployed address + deploy tx in `docs/plan.md`, and set `REGISTRY_ADDRESS` in
`gateway/.env` plus `address`/`startBlock` in `subgraph/networks.json`.
