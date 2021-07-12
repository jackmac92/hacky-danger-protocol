import * as log from "https://deno.land/std@0.93.0/log/mod.ts";

export default async function (logFile: string) {
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

  return log;
}
