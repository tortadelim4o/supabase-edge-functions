import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const name = process.argv[2];

if (!name) {
  console.error(
    "❌ Informe o nome da função: npm run create:function minha-funcao"
  );
  process.exit(1);
}

const functionDir = path.join(__dirname, `../functions/${name}`);
const coreDir = path.join(__dirname, `../src/core`);
const coreFile = path.join(coreDir, `${name}.ts`);

if (fs.existsSync(functionDir)) {
  console.error(`❌ A função "${name}" já existe.`);
  process.exit(1);
}

fs.mkdirSync(functionDir, { recursive: true });
fs.mkdirSync(coreDir, { recursive: true });

const coreTemplate = `export default async function ${name}Logic({ method, body }: { method: string; body?: any }) {
  switch (method) {
    case "GET":
      return { statusCode: 200, body: { message: "GET from ${name}" } };
    case "POST":
      return { statusCode: 201, body: { message: "POST from ${name}", data: body } };
    case "PUT":
      return { statusCode: 200, body: { message: "PUT from ${name}", data: body } };
    case "PATCH":
      return { statusCode: 200, body: { message: "PATCH from ${name}", data: body } };
    case "DELETE":
      return { statusCode: 200, body: { message: "DELETE from ${name}", data: body } };
    default:
      return { statusCode: 405, body: { error: "Method not allowed" } };
  }
}
`;

const functionTemplate = `
// @ts-ignore
if (typeof globalThis.Deno !== "undefined") {
// @ts-ignore
  await import("jsr:@supabase/functions-js/edge-runtime.d.ts");
}

import logic from "../../src/core/${name}.ts";

export default async function handler(req: any) {
  return logic({ method: req.method, body: req.body || {} });
}
// @ts-ignore
if (typeof globalThis.Deno !== "undefined" && typeof globalThis.Deno.serve === "function") {
// @ts-ignore
  globalThis.Deno.serve(async (req: Request) => {
    const method = req.method;
    const body = method !== "GET" ? await req.json().catch(() => ({})) : {};
    const result = await logic({ method, body });

    return new Response(JSON.stringify(result.body), {
      status: result.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  });
}
`;

fs.writeFileSync(coreFile, coreTemplate);
fs.writeFileSync(path.join(functionDir, "index.ts"), functionTemplate);

console.log(`✅ Função "${name}" criada em functions/${name}`);
console.log(`✅ Lógica criada em src/core/${name}.ts`);
