import dotenv from "dotenv";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const functionsDir = path.join(__dirname, "../functions");
const coreDir = path.join(__dirname, "../src/core");
const supabaseFunctionsDir = path.join(__dirname, "../supabase/functions");

fs.mkdirSync(supabaseFunctionsDir, { recursive: true });

const functions = fs
  .readdirSync(functionsDir)
  .filter((file) => fs.statSync(path.join(functionsDir, file)).isDirectory());

console.log(
  `📦 Encontradas ${functions.length} funções: ${functions.join(", ")}`
);

for (const fn of functions) {
  const coreFile = path.join(coreDir, `${fn}.ts`);
  const localFnIndex = path.join(functionsDir, fn, "index.ts");
  const deployDir = path.join(supabaseFunctionsDir, fn);

  fs.mkdirSync(deployDir, { recursive: true });

  let indexContent = fs.readFileSync(localFnIndex, "utf8");
  indexContent = indexContent.replace(
    new RegExp(`../../src/core/${fn}\\.ts`, "g"),
    "./core.ts"
  );
  fs.writeFileSync(path.join(deployDir, "index.ts"), indexContent);

  if (fs.existsSync(coreFile)) {
    fs.copyFileSync(coreFile, path.join(deployDir, "core.ts"));
    console.log(
      `📂 Copiado: src/core/${fn}.ts → supabase/functions/${fn}/core.ts`
    );
  }

  console.log(`🚀 Deploy de "${fn}"...`);
  try {
    execSync(`npx supabase functions deploy ${fn}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ Erro ao fazer deploy de "${fn}":`, err);
  }
}

fs.rmSync(path.join(__dirname, "../supabase"), {
  recursive: true,
  force: true,
});
