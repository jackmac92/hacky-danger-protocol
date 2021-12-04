import { cmdResponse } from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";

const defaultOpts = {};

export const createNotification = (title, opts = defaultOpts) => {
  const dunstOpts = [];
  return cmdResponse("dunstify", ...dunstOpts, title);
};
