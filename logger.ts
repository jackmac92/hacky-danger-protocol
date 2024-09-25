import * as log from "@std/log";

let logger: log.Logger | null = null;

export function initLogger(logFile: string) {
  if (logger) {
    return logger;
  }
  log.setup({
    // seems to use the maximum provided level (e.g. no debug messages unless both are set to debug)
    handlers: {
      console: new log.ConsoleHandler("DEBUG"),
      file: new log.FileHandler("DEBUG", {
        filename: logFile,
        formatter: (record: log.LogRecord) =>
          `${record.levelName} ${record.msg}`,
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
