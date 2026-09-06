// vitest.config.ts: caps the worker pool so the suite is stable on Windows. Several specs spin up
// an Express app and hit it over the loopback; run fully parallel on a Windows runner they race for
// worker slots and a couple time out with "Worker exited unexpectedly" (documented in
// docs/memoria.md). Two forks keeps the run parallel enough to stay fast without the race.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // One fork, files run serially. Several specs stand up an Express app and hit it over the
    // loopback; run in parallel on a Windows runner they race for worker slots and one or two die
    // with "Worker exited unexpectedly" (documented in docs/memoria.md). Serial is a few seconds
    // slower and 100% deterministic — the right trade for VERIFY.
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    fileParallelism: false,
  },
});
