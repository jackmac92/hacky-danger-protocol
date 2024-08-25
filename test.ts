import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { handleSScript } from "./util.ts";

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
