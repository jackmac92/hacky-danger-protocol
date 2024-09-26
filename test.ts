import * as log from "@std/log";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { handleSScript } from "./util.ts";
import { initLogger } from "./logger.ts";

// Simple name and function, compact form, but not configurable
Deno.test(
  "Test cmdResponse with s-script",
  {
    ignore: true,
  },
  async () => {
    const resp = await handleSScript(
      "misc radarr-add-movie",
      "Little Miss Sunshine",
      "tt0449059",
    );
    assertEquals(typeof resp, "string");
  },
);

Deno.test(
  "Ensure logger init works and closes file",
  {
    ignore: true,
  },
  () => {
    // Does not work because I can't figure out how to close the file handler after test run
    const logFile = "/tmp/deno-test-temp";
    const logger = initLogger(logFile);
    const logFileHandler = logger.handlers.find(
      (h) => h instanceof log.FileHandler,
    ) as log.FileHandler;
    console.dir(Object.keys(logFileHandler));
  },
);

Deno.test("Ensure logger init works", () => {
  initLogger("/tmp/deno-test-temp");
});
