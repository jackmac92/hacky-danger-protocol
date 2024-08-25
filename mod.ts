import { initLogger } from "./logger.ts";
import handlersFactory from "./handlers.ts";
// import type { HandlerArgs } from "./handlers.ts";

const homeDir = Deno.env.get("HOME");
if (homeDir === undefined) {
  throw new Error("Can't find home dir, why don't you have $HOME set?");
}

const logger = await initLogger(`${homeDir}/.local/hackydanger.log`);

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
  const params: { [k: string]: unknown } = Object.fromEntries(
    new URLSearchParams(req.search),
  );

  logger.info(`Handling ${action}, with ${JSON.stringify(params)}`);

  const handlers = handlersFactory(logger);

  if (!(action in handlers)) {
    throw new Error(
      `Unhandled action ${action}, wanted one of ${Object.keys(handlers)}`,
    );
  }
  let result;
  try {
    //@ts-ignore-error just easier
    result = await handlers[action](params);
  } catch (e) {
    logger.error("Handler failed");
    throw e;
  }

  logger.info(`Finished main processing of ${action}, got result: ${result}`);

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
