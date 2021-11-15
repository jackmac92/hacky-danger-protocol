const decoder = new TextDecoder();

export const cmdResponse = async (...cmd: string[]): Promise<string> => {
  const p = Deno.run({
    cmd,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    env: { S_DEBUGGER: "1", DISPLAY: ":1" },
  });

  const status = await p.status();

  const stderrBuf = await p.stderrOutput();
  const stderr = decoder.decode(stderrBuf);
  if (stderr.length > 0) {
    console.log(`Command stderr: ${stderr}`);
  }
  if (!status.success) {
    throw new Error(stderr);
  }

  const o = await p.output();
  const out = decoder.decode(o);

  // return out;

  // strip trailing newline from response
  return out.split("\n").reverse().slice(1).reverse().join("\n");
};
