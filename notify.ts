import { cmdResponse } from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";

const defaultOpts = {};

const objectToFlags = (opts) => opts;
// "--urgency=critical",
// "hacky danger protocol errror",
// err.toString(),

export const createNotification = (title, body = "", opts = defaultOpts) => {
  return cmdResponse(["dunstify", ...objectToFlags(opts), title, body]);
};
