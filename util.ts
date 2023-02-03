const defaultCmdOpts: { env?: { [key: string]: string }; cwd: string } = {
  cwd: Deno.env.get("HOME"),
  env: {},
};

export const _runCmdInTmux = (cmd: string, options = defaultCmdOpts) => {
  // accept params
  const x = Deno.run({
    ...options,
    cmd: ["tmux", "zsh", "-c", cmd],
  });
  return x.status();
};

export const runCmdInPopupShell = (cmd: string, options = defaultCmdOpts) => {
  const { env = {} } = options;
  if (!env.DISPLAY) {
    env.DISPLAY = ":1";
  }
  const x = Deno.run({
    ...options,
    cmd: [
      "st",
      "-e",
      "zsh",
      "-lc",
      `${cmd} || { echo "Whoops fucked up..."; zsh }`,
    ],
    env,
  });
  return x.status();
};

export const handleSScript = async (sscript: string, ...args: string[]) => {
  const fullCmd = sScriptMakeCmd(sscript, ...args);
  logger.debug(fullCmd);
  // TODO setup devilspie to auto hide these windows when needed (st -c class flag?)
  // await runCmdInPopupShell(fullCmd.join(" "));
  return cmdResponse(fullCmd);
};

export interface captureInfo {
  title: string;
  template: string;
  tags?: string[];
  body?: string;
  scheduled?: string;
  deadline?: string;
}
export const captureViaGitlabApi = (captureInfo: captureInfo) =>
  fetch("https://gitlab.com/api/v4/projects/34035963/repository/commits", {
    data: JSON.stringify({
      branch: "master",
      commit_message: "hackydanger protocol incoming",
      actions: [
        {
          action: "create",
          file_path: `${new Date()}/Dictionary.json`,
          content: JSON.stringify(captureInfo),
        },
      ],
    }),
    headers: {
      "Private-Token": Deno.env.get("GITLAB_ORG_CAPTURE_INBOX_TOKEN"),
    },
    method: "POST",
  });

export const sScriptMakeCmd = (sscript: string, ...args: string[]) =>
  [
    // "direnv",
    // "exec",
    // "/home/jmccown/.local/fullenv",
    "/home/jmccown/.local/scripts/core/bin/s",
    ...sscript.split(" "),
    ...args.map((y) => `'${y}'`),
  ].join(" ");

export interface ParsedGitUrl {
  search: string;
  hash: string;
  href: string;
  source: string;
  name: string;
  owner: string;
  commit: string;
  ref: string;
  filepathtype: string;
  filepath: string;
  organization: string;
  full_name: string;
}
