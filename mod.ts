import * as path from "https://deno.land/std/path/mod.ts";
import { cmdResponse } from "./cmdResponse.ts";
import createLogger from "./logger.ts";
import { xdotoolOpenActive } from "./xdotool.ts";

const homeDir = Deno.env.get("HOME");
if (homeDir === undefined) {
  throw new Error("Can't find home dir, why don't you have $HOME set?");
}

const logger = await createLogger(`${homeDir}/.local/hackydanger.log`);

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
    const targetCmdArgs = (params.scriptArgs ?? [])
      .map((el) => `'${el}'`)
      .join(" ");
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    await runCmdInPopupShell(
      `/home/jmccown/.local/scripts/core/bin/s ${targetCmd} ${targetCmdArgs}`
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
  case "mpv": {
    const { url } = params as {
      url: string;
    };
    await cmdResponse(
      "mpv",
      "--ytdl-format=bestvideo+bestaudio/best",
      "--af=rubberband=pitch-scale=0.981818181818181",
      url
    );
    break;
  }
  case "gitlabArtifacts": {
    const { jobId, projectId, gitlabHost } = params as {
      gitlabHost: string;
      projectId: string;
      jobId: string;
    };
    let cmd = "";
    if (gitlabHost.includes("cbinsights")) {
      cmd += "cd ~/cbinsights; ";
    }
    cmd += `s gitlab artifacts hacky-danger-download ${projectId} ${jobId}`;
    logger.info(cmd);
    await runCmdInPopupShell(cmd);
    break;
  }
  case "localDev": {
    const { fileInfoJson } = params;
    if (typeof fileInfoJson !== "string") {
      throw new Error("Unexpected json type, not string");
    }
    const fileInfo: ParsedGitUrl = JSON.parse(fileInfoJson);

    const lineNo = fileInfo.hash.slice(1);
    const gitRef = fileInfo.ref;
    const repoName = fileInfo.name;
    const inRepofilePath = fileInfo.filepath;
    const repoDir = await cmdResponse(
      "/home/jmccown/.nix-profile/bin/zoxide",
      "query",
      repoName
    );
    const filePath = path.join(repoDir, inRepofilePath);
    // TODO how to make this command switch projectile project, to activate the workspace and reopen existing
    logger.debug(
      `opening ${filePath} at ref ${gitRef} for ${inRepofilePath} from ${repoName}`
    );
    const cmd = [
      "/home/jmccown/.nix-profile/bin/emacsclient",
      `+${lineNo}`,
      filePath,
    ];
    // const cmd = [
    //   "/home/jmccown/.nix-profile/bin/emacsclient",
    //   "-e",
    //   `(counsel-projectile-switch-project-by-name ${repoDir})`,
    // ];
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
  const x = Deno.run({
    cmd: [
      "/home/jmccown/.nix-profile/bin/dunstify",
      "--urgency=critical",
      "hacky danger protocol errror",
      err.toString(),
    ],
    env: { DISPLAY: ":1" },
  });
  logger.error(err);
});

interface ParsedGitUrl {
  search: string;
  hash: string;
  href: string;
  source: string;
  name: string;
  owner: string;
  commit: string;
  ref: string;
  filepathtype: string;
  filepath: string;
  organization: string;
  full_name: string;
}
