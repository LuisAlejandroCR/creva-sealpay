// mapping.ts: folds every AttestationRegistry.Attested log into a FolioAttestation aggregate.
// distinctAttesters only grows when a folio hash is attested by an address it has not seen before —
// that is the number the gateway turns into "corroborated".
import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Attested } from "../generated/AttestationRegistry/AttestationRegistry";
import { FolioAttestation, Attestation } from "../generated/schema";

export function handleAttested(event: Attested): void {
  let folioHash = event.params.folioHash;
  let attester = event.params.attester;
  let ts = event.params.timestamp;

  let id = folioHash;
  let folio = FolioAttestation.load(id);
  if (folio == null) {
    folio = new FolioAttestation(id);
    folio.folioHash = folioHash;
    folio.attesters = new Array<Bytes>();
    folio.attestationCount = 0;
    folio.distinctAttesters = 0;
    folio.firstAttestedAt = ts;
  }

  let known = folio.attesters;
  let seen = false;
  for (let i = 0; i < known.length; i++) {
    if (known[i].equals(attester)) {
      seen = true;
      break;
    }
  }
  if (!seen) {
    known.push(attester);
    folio.attesters = known;
    folio.distinctAttesters = folio.distinctAttesters + 1;
  }

  folio.attestationCount = folio.attestationCount + 1;
  folio.lastAttestedAt = ts;
  folio.save();

  let recordId = event.transaction.hash.concatI32(event.logIndex.toI32());
  let record = new Attestation(recordId);
  record.folioHash = folioHash;
  record.attester = attester;
  record.timestamp = ts;
  record.blockNumber = event.block.number;
  record.txHash = event.transaction.hash;
  record.save();
}
