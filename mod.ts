import { initLogger } from "./logger.ts";
import handlersFactory from "./handlers.ts";
import type { HandlerArgs } from "./handlers.ts";

type handlerFunc = (s: HandlerArgs) => unknown;
type _actionTypes = ReturnType<typeof handlersFactory>;
type actionType = keyof _actionTypes;

const homeDir = Deno.env.get("HOME");

if (import.meta.main) {
  await main(Deno.args[0]);
}

async function main(uri: string) {
  if (homeDir === undefined) {
    throw new Error("Can't find home dir, why don't you have $HOME set?");
  }

  const logger = initLogger(`${homeDir}/.local/hackydanger.log`);

  logger.info("starting");
  let req;
  try {
    req = new URL(uri);
  } catch (e) {
    logger.error("Failed to parse input!");
    logger.error(e);
    Deno.exit(1);
  }

  // TODO term helper, find or create tmux window
  // TODO term helper, find or create browser window
  const action = req.host as string as actionType;

  // const subAction = req.pathname;
  const params = Object.fromEntries(
    new URLSearchParams(req.search),
  ) as unknown as HandlerArgs;

  logger.info(`Handling ${action}, with ${JSON.stringify(params)}`);

  const handlers = handlersFactory(logger);

  if (!(action in handlers)) {
    throw new Error(
      `Unhandled action ${action}, wanted one of ${Object.keys(handlers)}`,
    );
  }
  let result;
  try {
    const handler = handlers[action] as unknown as handlerFunc;
    result = await handler(params);
  } catch (e) {
    logger.error("Handler failed");
    throw e;
  }

  logger.info(`Finished main processing of ${action}, got result: ${result}`);

  addEventListener("unhandledrejection", (err) => {
    new Deno.Command(`${homeDir}/.nix-profile/bin/dunstify`, {
      args: [
        "--urgency=critical",
        "hacky danger protocol errror",
        err.toString(),
      ],
    });
    logger.error(err);
  });
}
