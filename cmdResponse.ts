const decoder = new TextDecoder();

export const cmdResponse = async (...cmd: string[]): Promise<string> => {
  const p = Deno.run({
    cmd: ["bash", "-c", cmd.join(" ")],
    stdout: "piped",
    stderr: "piped",
  });

  const status = await p.status();

  const stderrBuf = await p.stderrOutput();
  await Deno.stdout.write(stderrBuf);
  const stderr = decoder.decode(stderrBuf);
  if (stderr.length > 0) {
    console.log(`Command stderr: ${stderr}`);
  }
  if (!status.success) {
    throw new Error(stderr);
  }

  const o = await p.output();
  await Deno.stdout.write(o);
  const out = decoder.decode(o);
  p.close();

  // strip trailing newline from response
  return out.split("\n").reverse().slice(1).reverse().join("\n");
};
