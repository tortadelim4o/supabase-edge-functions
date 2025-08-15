import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import ScalarApiReference from "@scalar/fastify-api-reference";
import dotenv from "dotenv";
import Fastify from "fastify";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// 📌 Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: "Supabase Edge Functions API",
      description: "Documentação automática das funções disponíveis",
      version: "1.0.0",
    },
  },
});
await fastify.register(swaggerUI, {
  routePrefix: "/docs",
  uiConfig: { docExpansion: "list", deepLinking: false },
});
await fastify.register(ScalarApiReference, {
  routePrefix: "/scalar",
  configuration: { theme: "purple" },
});

const functionsDir = path.join(__dirname, "../functions");
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

fs.readdirSync(functionsDir).forEach((folder) => {
  const fnPath = path.join(functionsDir, folder, "index.ts");

  if (fs.existsSync(fnPath)) {
    methods.forEach((method) => {
      fastify.route({
        method,
        url: `/functions/${folder}`,
        schema: {
          description: `Função (${method}): ${folder}`,
          tags: ["Edge Functions"],
          ...(method !== "GET" ? { body: { type: "object" } } : {}),
          response: {
            default: { type: "object", additionalProperties: true },
          },
        },
        handler: async (request, reply) => {
          try {
            const module = await import(
              pathToFileURL(fnPath).href + "?update=" + Date.now()
            );
            const fn = module?.default;

            if (typeof fn !== "function") {
              throw new Error(`Função inválida ou não encontrada em ${fnPath}`);
            }

            // 📌 Adapta o request para parecer com o Supabase (Deno.serve)
            const fakeRequest = {
              method: request.method,
              body: request.body,
              headers: request.headers,
              query: request.query,
              params: request.params,
              url: request.url,
            };

            const result = await fn(fakeRequest);

            // 📌 Se a função retornar formato Supabase (Response)
            if (result instanceof Response) {
              const payload = await result.json();
              reply
                .code(result.status || 200)
                .header("Content-Type", "application/json")
                .send(payload);
              return;
            }

            // 📌 Se a função retornar { statusCode, body }
            if (result && typeof result === "object") {
              const status =
                "statusCode" in result ? (result as any).statusCode : 200;
              const payload = "body" in result ? (result as any).body : result;
              reply
                .code(status)
                .header("Content-Type", "application/json")
                .send(payload ?? {});
            } else {
              // 📌 Qualquer outro tipo de retorno
              reply
                .code(200)
                .header("Content-Type", "application/json")
                .send(result);
            }
          } catch (err: any) {
            reply
              .code(500)
              .header("Content-Type", "application/json")
              .send({ error: err.message });
          }
        },
      });
    });

    console.log(
      `✅ Função carregada: /functions/${folder} (${methods.join(", ")})`
    );
  }
});

fastify.listen({ port: Number(process.env.PORT) || 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
