/**
 * Remote LLM tests (OpenAI-compatible provider).
 *
 * Run with:
 *   QMD_REMOTE_TEST=1 QMD_CONFIG_DIR=/path/to/config npm test
 */

import { describe, test, expect, afterAll } from "vitest";
import {
  OpenAICompatibleLLM,
  getDefaultLlamaCpp,
  disposeDefaultLlamaCpp,
  type RerankDocument,
} from "../src/llm.js";
import { loadLLMConfig } from "../src/llm_config.js";

const isRemoteProvider = loadLLMConfig().provider === "openai";

describe.skipIf(!!process.env.CI || !process.env.QMD_REMOTE_TEST || !isRemoteProvider)(
  "Remote LLM (OpenAI-compatible)",
  () => {
    afterAll(async () => {
      await disposeDefaultLlamaCpp();
    });

    test("getDefaultLlamaCpp returns OpenAICompatibleLLM", () => {
      const llm = getDefaultLlamaCpp();
      expect(llm).toBeInstanceOf(OpenAICompatibleLLM);
    });

    test("embed returns a non-empty embedding", async () => {
      const llm = getDefaultLlamaCpp();
      const result = await llm.embed("Hello remote world");
      expect(result).not.toBeNull();
      expect(result!.embedding.length).toBeGreaterThan(0);
    }, 30000);

    test("embedBatch returns embeddings for each input", async () => {
      const llm = getDefaultLlamaCpp();
      const results = await llm.embedBatch(["alpha", "beta", "gamma"]);
      expect(results.length).toBe(3);
      for (const result of results) {
        expect(result).not.toBeNull();
        expect(result!.embedding.length).toBeGreaterThan(0);
      }
    }, 30000);

    test("generate returns a non-empty response", async () => {
      const llm = getDefaultLlamaCpp();
      const result = await llm.generate("Write a short sentence about testing.");
      expect(result).not.toBeNull();
      expect(result!.text.length).toBeGreaterThan(0);
    }, 30000);

    test("rerank returns scores and ordering", async () => {
      const llm = getDefaultLlamaCpp();
      const docs: RerankDocument[] = [
        { file: "alpha.txt", text: "This is about alpha testing." },
        { file: "beta.txt", text: "This is about beta releases." },
        { file: "gamma.txt", text: "Cooking pasta and sauces." },
      ];
      const maxAttempts = 3;
      let lastResult = await llm.rerank("testing releases", docs);
      let anyPositive = lastResult.results.some((entry) => entry.score > 0);

      for (let attempt = 1; attempt < maxAttempts && !anyPositive; attempt++) {
        // Brief delay to avoid hot-looping the remote server
        await new Promise((resolve) => setTimeout(resolve, 200));
        lastResult = await llm.rerank("testing releases", docs);
        anyPositive = lastResult.results.some((entry) => entry.score > 0);
      }

      console.log("Remote rerank results:", lastResult.results);
      expect(lastResult.results.length).toBe(docs.length);

      for (const entry of lastResult.results) {
        expect(Number.isFinite(entry.score)).toBe(true);
      }

      // Ensure model produced non-zero scores (not fallback)
      expect(anyPositive).toBe(true);

      // Ensure sorted descending
      for (let i = 1; i < lastResult.results.length; i++) {
        expect(lastResult.results[i - 1]!.score).toBeGreaterThanOrEqual(lastResult.results[i]!.score);
      }
    }, 30000);
  }
);
