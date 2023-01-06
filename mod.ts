import * as path from "https://deno.land/std/path/mod.ts";
import { cmdResponse } from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";
import createLogger from "./logger.ts";
import { xdotoolOpenActive } from "./xdotool.ts";
import handlers from "./handlers.ts";

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

const sScriptMakeCmd = (sscript: string, ...args: string[]) =>
  [
    "/home/jmccown/.local/scripts/core/bin/s",
    ...sscript.split(" "),
    ...args.map((y) => `'${y}'`),
  ].join(" ");

export const handleSScript = async (sscript: string, ...args: string[]) => {
  const fullCmd = sScriptMakeCmd(sscript, ...args);
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

  try {
    handlers[action](params);
  } catch {
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
