import * as log from "https://deno.land/std/log/mod.ts";

let logger: log.Logger | null = null;

export async function initLogger(logFile: string) {
  if (logger) {
    return logger;
  }
  await log.setup({
    // seems to use the maximum provided level (e.g. no debug messages unless both are set to debug)
    handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG"),
      file: new log.handlers.FileHandler("DEBUG", {
        filename: logFile,
        // you can change format of output message using any keys in `LogRecord`.
        formatter: "{levelName} {msg}",
      }),
    },

    loggers: {
      default: {
        level: "DEBUG", // defaults to INFO
        handlers: ["console", "file"],
      },
    },
  });
  logger = log.getLogger();
  return logger;
}

export function getLogger(): log.Logger {
  if (!logger) {
    throw new Error("Logger not initialized. Call initLogger() first.");
  }
  return logger;
}
