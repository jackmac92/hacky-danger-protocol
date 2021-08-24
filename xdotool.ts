import { cmdResponse } from "./mod";

const xdotool = (...cmd: string[]) => cmdResponse("xdotool", ...cmd);
const xdotoolCurrentWindow = () => xdotool("getactivewindow");
export const xdotoolOpenActive = async (appName: string) => {
    const existingWinId = await xdotool(
        "search",
        "--onlyvisible",
        "--name",
        appName
    );
    if (!existingWinId) {
        throw new Error("No such window found");
    }
    await xdotool("windowfocus", "--sync", existingWinId);
};
