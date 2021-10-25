const decoder = new TextDecoder();

export const cmdResponse = async (...cmd: string[]) => {
  const p = Deno.run({ cmd, stdin: "piped", stdout: "piped" });

  await p.status();

  const o = await p.output();
  const out = decoder.decode(o);

  // return out;

  // strip trailing newline from response
  return out.split("\n").reverse().slice(1).reverse().join("\n");
};
