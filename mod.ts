import * as path from "https://deno.land/std/path/mod.ts";
import { cmdResponse } from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";
import createLogger from "./logger.ts";
import { xdotoolOpenActive } from "./xdotool.ts";

const homeDir = Deno.env.get("HOME");
if (homeDir === undefined) {
  throw new Error("Can't find home dir, why don't you have $HOME set?");
}

const logger = await createLogger(`${homeDir}/.local/hackydanger.log`);

logger.info("starting");

interface captureInfo {
  title: string;
  template: string;
  tags?: string[];
  body?: string;
  scheduled?: string;
  deadline?: string;
}

export const captureViaGitlabApi = (captureInfo: captureInfo) =>
  fetch("https://gitlab.com/api/v4/projects/34035963/repository/commits", {
    data: JSON.stringify({
      branch: "master",
      commit_message: "hackydanger protocol incoming",
      actions: [
        {
          action: "create",
          file_path: `${new Date()}/Dictionary.json`,
          content: JSON.stringify(captureInfo),
        },
      ],
    }),
    headers: {
      "Private-Token": Deno.env.get("GITLAB_ORG_CAPTURE_INBOX_TOKEN"),
    },
    method: "POST",
  });

export const handleSScript = async (sscript: string, ...args: string[]) => {
  const fullCmd = [
    "/home/jmccown/.local/scripts/core/bin/s",
    ...sscript.split(" "),
    ...args.map((y) => `'${y}'`),
  ].join(" ");
  logger.debug(fullCmd);
  // TODO setup devilspie to auto hide these windows when needed (st -c class flag?)
  // await runCmdInPopupShell(fullCmd.join(" "));
  return cmdResponse(fullCmd);
};

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
    cmd: ["st", "-e", "zsh", "-c", `${cmd} || zsh`],
    env,
  });
  return x.status();
};

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
if (import.meta.main) {
  let req;
  try {
    req = new URL(Deno.args[0]);
  } catch (e) {
    logger.error("Failed to parse input!");
    logger.error(e);
    Deno.exit(1);
  }

  // TODO term helper, find or create tmux window
  // TODO term helper, find or create browser window

  const action = req.host;

  const subAction = req.pathname;
  const paramsAnnoyingFormat = new URLSearchParams(req.search);

  const params: { [k: string]: unknown } = {};

  for (const p of paramsAnnoyingFormat.keys()) {
    params[p] = paramsAnnoyingFormat.get(p);
  }

  logger.info(`Handling ${action}`);
  switch (action) {
    case "repoactivate":
      throw new Error(`unimplemented!`);
    case "popupexec": {
      const { targetExecStr } = params;
      logger.debug(targetExecStr);
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
      const targetCmdArgs = JSON.parse(
        typeof params.scriptArgs === "string" ? params.scriptArgs : "[]"
      );
      if (!Array.isArray(targetCmdArgs)) {
        throw new Error("sscript received non array args");
      }
      logger.info("starting s command");
      // TODO setup devilspie to auto hide these windows when needed (st -c class flag?)
      // await runCmdInPopupShell(fullCmd.join(" "));
      const decoder = new TextDecoder();
      const output = await handleSScript(targetCmd, ...targetCmdArgs);
      logger.info(`Response received: ${output}`);
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

      const cmd = Deno.env.get("VISUAL")?.split(" ") ?? ["e"];
      if (parseInt(lineNo, 10)) {
        cmd.push(`+${lineNo}`);
      }
      cmd.push(filePath);
      logger.debug(`running: ${cmd}`);
      const p = Deno.run({ cmd, stdout: "piped", stderr: "piped" });
      await p.status();
      break;
    }
    captureViaGitlabApi: {
      await captureViaGitlabApi(params as captureInfo);
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
}
