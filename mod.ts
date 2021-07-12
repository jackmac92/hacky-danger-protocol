import createLogger from "./logger.ts";

const homeDir = Deno.env.get("HOME");
const logger = await createLogger(`${homeDir}/.local/hackydanger.log`);

logger.info('Incoming');

let req;
try {
  req = new URL(Deno.args[0]);
} catch {
  logger.error("Failed to parse input!");
  Deno.exit(1);
}

const action = req.host;

const subAction = req.pathname;
const params_AnnoyingFormat = new URLSearchParams(req.search);

const params: { [k: string]: unknown } = {};

for (const p of params_AnnoyingFormat.keys()) {
  params[p] = params_AnnoyingFormat.get(p);
}

const defaultCmdOpts = {
  cwd: homeDir,
};

const runCmdInTmux = (cmd: string, options = defaultCmdOpts) => {
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
    env.DISPLAY = ":1"
  }
  const x = Deno.run({
    ...options,
    cmd: ["st", "zsh", "-c", cmd],
    env
  });
  return x.status();
};

// TODO term helper, find or create tmux window
// TODO term helper, find or create browser window

logger.info(`Handling ${action}`);
switch (action) {
  case "repoactivate":
    // openCmdInT
    throw new Error(`unimplemented!`);
    break;
  case "sscript":
    const targetCmd = params.script;
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    await runCmdInPopupShell(`/home/jmccown/.config/custom/path_scripts/s ${targetCmd}`);
    break;
  case "youtubedl":
    const targetUrl = params.url;
    if (typeof targetUrl !== "string") {
      throw new Error("youtube-dl received non string target url");
    }
    await runCmdInPopupShell(
      `youtube-dl "${targetUrl}"`,
      { cwd: `${homeDir}/Downloads` }
    );
    break;
  case "cbissh":
    throw new Error(`unimplemented!`);
    break;
  case "namedscript": {
    Deno.run({ cmd: [subAction], stdout: "piped", stderr: "piped" });
    break;
  }
  default:
    throw new Error(`Unhandled action ${action}`);
}

addEventListener('unhandledrejection', (err) => {
  logger.error(err)
})
