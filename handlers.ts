import * as path from "https://deno.land/std/path/mod.ts";
import { cmdResponse } from "https://gitlab.com/jackmac92/deno-exec/-/raw/master/mod.ts";
import { Logger } from "https://deno.land/std@0.93.0/log/mod.ts";
import type { captureInfo } from "./util.ts";
// import { xdotoolOpenActive } from "./xdotool.ts";
import {
  captureViaGitlabApi,
  handleSScript,
  ParsedGitUrl,
  runCmdInPopupShell,
  sScriptMakeCmd,
} from "./util.ts";

interface RunSScript {
  script: string;
  scriptArgs: string | string[];
}
interface LocalDevArgs {
  fileInfoJson: string;
}
interface GitlabArtifactsParams {
  gitlabHost: string;
  projectId: string;
  jobId: string;
}
interface MpvParams {
  url: string;
}
interface YoutubedlParams {
  url: string;
}
interface PopupExec {
  targetExecStr: string;
}

export type HandlerArgs =
  | RunSScript
  | captureInfo
  | LocalDevArgs
  | MpvParams
  | YoutubedlParams
  | PopupExec
  | GitlabArtifactsParams;

export default (logger: Logger) => ({
  repoactivate: (_: unknown) => {
    throw new Error(`unimplemented!`);
  },
  popupexec: (params: PopupExec) => {
    const { targetExecStr } = params;
    if (typeof targetExecStr !== "string") {
      throw new Error("popupexec received non string target cmd");
    }
    return runCmdInPopupShell(`${targetExecStr}`);
  },
  sscript: async (params: RunSScript) => {
    const targetCmd = params.script;
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    const targetCmdArgs = JSON.parse(
      typeof params.scriptArgs === "string" ? params.scriptArgs : "[]",
    );
    if (!Array.isArray(targetCmdArgs)) {
      throw new Error("sscript received non array args");
    }
    logger.info("starting s command");
    // TODO setup devilspie to auto hide these windows when needed (st -c class flag?)
    // await runCmdInPopupShell(fullCmd.join(" "));
    const output = await handleSScript(targetCmd, ...targetCmdArgs);
    logger.info(`Response received: ${output}`);
  },
  popupsscript: (params: RunSScript) => {
    const targetCmd = params.script;
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    const targetCmdArgs = JSON.parse(
      typeof params.scriptArgs === "string" ? params.scriptArgs : "[]",
    );
    if (!Array.isArray(targetCmdArgs)) {
      throw new Error("sscript received non array args");
    }
    logger.info("starting s command popup");
    return runCmdInPopupShell(sScriptMakeCmd(targetCmd, ...targetCmdArgs));
  },

  youtubedl: (params: YoutubedlParams) => {
    const targetUrl = params.url;
    if (typeof targetUrl !== "string") {
      throw new Error(
        `youtube-dl received non string target url, got: '${targetUrl}'`,
      );
    }
    return runCmdInPopupShell(`yt-dlp '${targetUrl}'`);
  },
  mpv: (params: MpvParams) => {
    const { url } = params;
    return cmdResponse([
      "mpv",
      "--ytdl-format=bestvideo+bestaudio/best",
      "--af=rubberband=pitch-scale=0.981818181818181",
      url,
    ]);
  },
  gitlabArtifacts: (params: GitlabArtifactsParams) => {
    const { jobId, projectId, gitlabHost } = params;
    let cmd = "";
    let cwd = null;
    if (gitlabHost.includes("cbinsights")) {
      cwd += "~/cbinsights; ";
    }
    cmd += `s gitlab artifacts hacky-danger-download ${projectId} ${jobId}`;
    logger.info(cmd);
    return runCmdInPopupShell(cmd, { cwd });
  },
  localDev: async (params: LocalDevArgs) => {
    const { fileInfoJson } = params;
    if (typeof fileInfoJson !== "string") {
      throw new Error("Unexpected json type, not string");
    }
    const fileInfo: ParsedGitUrl = JSON.parse(fileInfoJson);

    const lineNo = fileInfo.hash.slice(1);
    const gitRef = fileInfo.ref;
    const repoName = fileInfo.name;
    const inRepofilePath = fileInfo.filepath;
    const repoDir = await cmdResponse(["zoxide", "query", repoName]);
    const filePath = path.join(repoDir, inRepofilePath);
    // TODO how to make this command switch projectile project, to activate the workspace and reopen existing
    logger.debug(
      `opening ${filePath} at ref ${gitRef} for ${inRepofilePath} from ${repoName}`,
    );

    const cmd = Deno.env.get("VISUAL")?.split(" ") ?? ["e"];
    if (parseInt(lineNo, 10)) {
      cmd.push(`+${lineNo}`);
    }
    cmd.push(filePath);
    logger.debug(`running: ${cmd}`);
    const p = new Deno.Command({ cmd, stdout: "piped", stderr: "piped" });
    const { code } = p.output();
    return code;
  },
  captureViaGitlabApi: (params: captureInfo) => captureViaGitlabApi(params),
});
