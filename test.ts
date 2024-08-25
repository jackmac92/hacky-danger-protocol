import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {
  handleSScript,
  runCmdInPopupShell,
  runCmdInPopupShellAndWait,
} from "./util.ts";

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

Deno.test("Test popupexec handler", async () => {
  const resp = await runCmdInPopupShell("sleep 5");
  assertEquals(typeof resp, "number");
});

Deno.test("Test popupexec handler", async () => {
  const resp = await runCmdInPopupShellAndWait("gnome-terminal");
  assertEquals(typeof resp, "number");
});
