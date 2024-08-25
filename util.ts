import {
  cmdResponse,
  cmdResponseZshLoginShell,
  runCmdInPopupShell,
} from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";

const defaultCmdOpts: { env?: { [key: string]: string }; cwd: string } = {
  cwd: Deno.env.get("HOME") || "",
  env: {},
};

export const _runCmdInTmux = async (cmd: string, options = defaultCmdOpts) => {
  // accept params
  const x = new Deno.Command("tmux", {
    ...options,
    args: ["zsh", "-c", cmd],
  });
  const { code } = await x.output();
  return code;
};

export const handleSScript = (sscript: string, ...args: string[]) => {
  const fullCmd = sScriptMakeCmd(sscript, ...args);
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
    body: JSON.stringify({
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
      "Private-Token": (() => {
        const glToken = Deno.env.get("GITLAB_ORG_CAPTURE_INBOX_TOKEN");
        if (!glToken) {
          throw new Error("Missing env var: GITLAB_ORG_CAPTURE_INBOX_TOKEN");
        }
        return glToken;
      })(),
    },
    method: "POST",
  });

export const sScriptMakeCmd = (sscript: string, ...args: string[]) => [
  // "direnv",
  // "exec",
  // "/home/jmccown/.local/fullenv",
  "/home/jmccown/.local/chez-bin/s",
  ...sscript.split(" "),
  ...args.map((y) => `'${y}'`),
];

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
