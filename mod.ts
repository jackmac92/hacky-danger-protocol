import createLogger from "./logger.ts";
import handlers from "./handlers.ts";

const homeDir = Deno.env.get("HOME");
if (homeDir === undefined) {
  throw new Error("Can't find home dir, why don't you have $HOME set?");
}

const logger = await createLogger(`${homeDir}/.local/hackydanger.log`);

logger.info("starting");

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

  // const subAction = req.pathname;
  const paramsAnnoyingFormat = new URLSearchParams(req.search);

  const params: { [k: string]: unknown } = {};

  for (const p of paramsAnnoyingFormat.keys()) {
    params[p] = paramsAnnoyingFormat.get(p);
  }
  logger.info(`Handling ${action}`);

  try {
    //@ts-ignore-error just easier
    handlers(logger)[action](params);
  } catch {
    throw new Error(
      `Unhandled action ${action}, wanted one of ${Object.keys(handlers)}`,
    );
  }

  addEventListener("unhandledrejection", (err) => {
    new Deno.Command("/home/jmccown/.nix-profile/bin/dunstify", {
      args: [
        "--urgency=critical",
        "hacky danger protocol errror",
        err.toString(),
      ],
      env: { DISPLAY: ":1" },
    });
    logger.error(err);
  });
}
