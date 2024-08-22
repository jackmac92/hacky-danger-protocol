import { cmdResponse } from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";

export const xdotool = (...cmd: string[]) =>
  cmdResponse(`xdotool ${cmd.join(" ")}`);

export const xdotoolCurrentWindow = () => xdotool("getactivewindow");

export const xdotoolOpenActive = async (appName: string) => {
  const existingWinId = await xdotool(
    "search",
    "--onlyvisible",
    "--name",
    appName,
  );
  if (!existingWinId) {
    throw new Error("No such window found");
  }
  await xdotool("windowfocus", "--sync", existingWinId);
};
