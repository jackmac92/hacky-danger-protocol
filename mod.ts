import * as path from "https://deno.land/std/path/mod.ts";
import createLogger from "./logger.ts";
import { xdotoolOpenActive } from "./xdotool.ts";

const homeDir = Deno.env.get("HOME");
if (homeDir === undefined) {
  throw new Error("Can't find home dir, why don't you have $HOME set?");
}

const logger = await createLogger(`${homeDir}/.local/hackydanger.log`);

const decoder = new TextDecoder();

export const cmdResponse = async (...cmd: string[]) => {
  const p = Deno.run({ cmd, stdin: "piped", stdout: "piped" });

  await p.status();

  const o = await p.output();
  const out = decoder.decode(o);
  return out;
};

logger.info("Incoming");

let req;
try {
  req = new URL(Deno.args[0]);
} catch {
  logger.error("Failed to parse input!");
  Deno.exit(1);
}

const action = req.host;

const subAction = req.pathname;
const paramsAnnoyingFormat = new URLSearchParams(req.search);

const params: { [k: string]: unknown } = {};

for (const p of paramsAnnoyingFormat.keys()) {
  params[p] = paramsAnnoyingFormat.get(p);
}

const defaultCmdOpts: { env?: { [key: string]: string }; cwd: string } = {
  cwd: homeDir,
  env: {},
};

const _runCmdInTmux = (cmd: string, options = defaultCmdOpts) => {
  // accept params
  const x = Deno.run({
    ...options,
    cmd: ["tmux", "zsh", "-c", cmd],
  });
  return x.status();
};

const runCmdInPopupShell = (cmd: string, options = defaultCmdOpts) => {
  const { env = {} } = options;
  if (!env.DISPLAY) {
    env.DISPLAY = ":1";
  }
  const x = Deno.run({
    ...options,
    cmd: ["st", "zsh", "-c", cmd],
    env,
  });
  return x.status();
};

// TODO term helper, find or create tmux window
// TODO term helper, find or create browser window

logger.info(`Handling ${action}`);
switch (action) {
  case "repoactivate":
    throw new Error(`unimplemented!`);
  case "popupexec": {
    const targetExecStr = params.script;
    if (typeof targetExecStr !== "string") {
      throw new Error("popupexec received non string target cmd");
    }
    await runCmdInPopupShell(`${targetExecStr}`);
    break;
  }
  case "sscript": {
    const targetCmd = params.script;
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    await runCmdInPopupShell(
      `/home/jmccown/.config/custom/path_scripts/s ${targetCmd}`,
    );
    break;
  }
  case "youtubedl": {
    const targetUrl = params.url;
    if (typeof targetUrl !== "string") {
      throw new Error("youtube-dl received non string target url");
    }
    await runCmdInPopupShell(`youtube-dl "${targetUrl}"`, {
      cwd: `${homeDir}/Downloads`,
    });
    break;
  }
  case "cbissh":
    throw new Error(`unimplemented!`);
  case "localDev": {
    const { fileUrl } = params;
    if (typeof fileUrl !== "string") {
      throw new Error("Invalid file url");
    }
    const url = new URL(fileUrl);
    const lineNo = "0";
    const repoName = url.pathname.split("/")[2];
    const inRepofilePath = url.pathname.slice(3);
    const repoDir = await cmdResponse(
      "/home/jmccown/.nix-profile/bin/zoxide",
      "query",
      repoName,
    );
    const filePath = path.join(repoDir, inRepofilePath);
    // TODO how to make this command switch projectile project, to activate the workspace and reopen existing
    logger.debug(`opening ${repoName} at ${repoDir}`);
    // const cmd = [
    //   "/home/jmccown/.nix-profile/bin/emacsclient",
    //   `+${lineNo} `,
    //   filePath,
    // ];
    const cmd = [
      "/home/jmccown/.nix-profile/bin/emacsclient",
      "-e",
      `(counsel-projectile-switch-project-by-name ${repoDir})`,
    ];
    const p = Deno.run({ cmd, stdout: "piped", stderr: "piped" });
    await p.status();
    await xdotoolOpenActive("emacs");
    break;
  }
  case "namedscript": {
    const p = Deno.run({ cmd: [subAction], stdout: "piped", stderr: "piped" });
    await p.status();
    break;
  }
  default:
    throw new Error(`Unhandled action ${action}`);
}

addEventListener("unhandledrejection", (err) => {
  logger.error(err);
});
