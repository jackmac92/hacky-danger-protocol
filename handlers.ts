export default {
  repoactivate: (params) => {
    throw new Error(`unimplemented!`);
  },
  popupexec: (params) => {
    const { targetExecStr } = params;
    logger.debug(targetExecStr);
    if (typeof targetExecStr !== "string") {
      throw new Error("popupexec received non string target cmd");
    }
    await runCmdInPopupShell(`${targetExecStr}`);
    break;
  },
  sscript: (params) => {
    const targetCmd = params.script;
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    const targetCmdArgs = JSON.parse(
      typeof params.scriptArgs === "string" ? params.scriptArgs : "[]"
    );
    if (!Array.isArray(targetCmdArgs)) {
      throw new Error("sscript received non array args");
    }
    logger.info("starting s command");
    // TODO setup devilspie to auto hide these windows when needed (st -c class flag?)
    // await runCmdInPopupShell(fullCmd.join(" "));
    const output = await handleSScript(targetCmd, ...targetCmdArgs);
    logger.info(`Response received: ${output}`);
    break;
  },
  popupsscript: (params) => {
    const targetCmd = params.script;
    if (typeof targetCmd !== "string") {
      throw new Error("sscript received non string target cmd");
    }
    const targetCmdArgs = JSON.parse(
      typeof params.scriptArgs === "string" ? params.scriptArgs : "[]"
    );
    if (!Array.isArray(targetCmdArgs)) {
      throw new Error("sscript received non array args");
    }
    logger.info("starting s command popup");
    // TODO setup devilspie to auto hide these windows when needed (st -c class flag?)
    // await runCmdInPopupShell(fullCmd.join(" "));

    await runCmdInPopupShell(sScriptMakeCmd(sscript, ...args));
    break;
  },

  youtubedl: (params) => {
    const targetUrl = params.url;
    if (typeof targetUrl !== "string") {
      throw new Error("youtube-dl received non string target url");
    }
    await runCmdInPopupShell(`youtube-dl "${targetUrl}"`, {
      cwd: `${homeDir}/Downloads`,
    });
    break;
  },
  mpv: (params) => {
    const { url } = params as {
      url: string;
    };
    await cmdResponse(
      "mpv",
      "--ytdl-format=bestvideo+bestaudio/best",
      "--af=rubberband=pitch-scale=0.981818181818181",
      url
    );
    break;
  },
  gitlabArtifacts: (params) => {
    const { jobId, projectId, gitlabHost } = params as {
      gitlabHost: string;
      projectId: string;
      jobId: string;
    };
    let cmd = "";
    if (gitlabHost.includes("cbinsights")) {
      cmd += "cd ~/cbinsights; ";
    }
    cmd += `s gitlab artifacts hacky-danger-download ${projectId} ${jobId}`;
    logger.info(cmd);
    await runCmdInPopupShell(cmd);
    break;
  },
  localDev: (params) => {
    {
      const { fileInfoJson } = params;
      if (typeof fileInfoJson !== "string") {
        throw new Error("Unexpected json type, not string");
      }
      const fileInfo: ParsedGitUrl = JSON.parse(fileInfoJson);

      const lineNo = fileInfo.hash.slice(1);
      const gitRef = fileInfo.ref;
      const repoName = fileInfo.name;
      const inRepofilePath = fileInfo.filepath;
      const repoDir = await cmdResponse(
        "/home/jmccown/.nix-profile/bin/zoxide",
        "query",
        repoName
      );
      const filePath = path.join(repoDir, inRepofilePath);
      // TODO how to make this command switch projectile project, to activate the workspace and reopen existing
      logger.debug(
        `opening ${filePath} at ref ${gitRef} for ${inRepofilePath} from ${repoName}`
      );

      const cmd = Deno.env.get("VISUAL")?.split(" ") ?? ["e"];
      if (parseInt(lineNo, 10)) {
        cmd.push(`+${lineNo}`);
      }
      cmd.push(filePath);
      logger.debug(`running: ${cmd}`);
      const p = Deno.run({ cmd, stdout: "piped", stderr: "piped" });
      await p.status();
      break;
    }
    captureViaGitlabApi: {
      await captureViaGitlabApi(params as captureInfo);
    }
  },
};
