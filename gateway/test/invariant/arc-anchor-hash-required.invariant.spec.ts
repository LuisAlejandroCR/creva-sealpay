// arc-anchor-hash-required.invariant.spec.ts: security property that must hold no matter the
// input — anchorReportHash must never call the signer (wallet construction, tx broadcast) unless
// the hash it was given is a well-formed 32-byte hex canonical hash. This is the mechanical guard
// against the descalificador #2 failure mode: silently "anchoring" garbage that isn't actually
// tied to the sealed report's real hash.
import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";

const providerSpy = vi.fn();

vi.mock("ethers", async () => {
  const actual = await vi.importActual<typeof import("ethers")>("ethers");
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      JsonRpcProvider: class {
        constructor(...args: unknown[]) {
          providerSpy(...args);
        }
      },
    },
  };
});

describe("invariant: anchorReportHash never reaches the wallet/provider on a malformed hash", () => {
  it("throws before constructing a JsonRpcProvider for any non-canonical hash", async () => {
    const { anchorReportHash } = await import("../../src/arc-anchor.js");

    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => !/^0x[0-9a-fA-F]{64}$/.test(s)),
        async (badHash) => {
          providerSpy.mockClear();
          await expect(
            anchorReportHash(
              badHash,
              { address: "0x0", privateKey: "0x0" },
              "https://rpc.testnet.arc.io",
              "arc:testnet",
            ),
          ).rejects.toThrow("arc_anchor_invalid_canonical_hash");
          expect(providerSpy).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});
