import { cmdResponse } from "deno-exec";

const defaultOpts = {};

function objectToFlags(obj: Record<string, string | null>): string {
  const flags: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const prefix = key.length === 1 ? "-" : "--";

    if (value === null) {
      flags.push(`${prefix}${key}`);
    } else {
      flags.push(`${prefix}${key}=${value}`);
    }
  }

  return flags.join(" ");
}

export const createNotification = (
  title: string,
  body = "",
  opts = defaultOpts,
) => {
  return cmdResponse(["dunstify", ...objectToFlags(opts), title, body]);
};
