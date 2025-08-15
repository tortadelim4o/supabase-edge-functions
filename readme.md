Aqui está um **README.md** simples para o seu projeto:

```markdown
# Supabase Base Functions

Projeto base para criar, organizar e fazer deploy de **Functions** no Supabase com separação entre a lógica de negócio (`src/core`) e o código de entrada (`functions`).

## 📂 Estrutura do Projeto
```

functions/ # Pasta com entrypoints para cada function
src/core/ # Lógica principal de cada function
scripts/ # Scripts utilitários
supabase/functions/ # Funções preparadas para deploy (gerado automaticamente)

````

## 🚀 Fluxo de Desenvolvimento

1. **Criar nova function**
   ```bash
   npm run create:function nome-da-funcao
````

Isso cria:

- `functions/nome-da-funcao/index.ts` → handler para Supabase
- `src/core/nome-da-funcao.ts` → lógica principal

2. **Editar lógica**

   - Toda a lógica deve estar em `src/core/<nome>.ts`
   - O `index.ts` da function só chama essa lógica

3. **Deploy**

   ```bash
   npm run deploy:all
   ```

   - Apaga a pasta `supabase/`
   - Copia funções e lógica para `supabase/functions/`
   - Roda `supabase functions deploy <nome>`

## 📦 Requisitos

- Node.js 18+
- Supabase CLI configurado
- Docker (opcional, mas recomendado pelo Supabase CLI)

```

---

Se quiser, posso incluir também **exemplo de function** no README para o dev já saber como a lógica fica no `src/core/` e como o handler no `functions/`.
Quer que eu já adicione isso?
```
