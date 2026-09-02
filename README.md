# PGI · Preparação de importação Optima

Protótipo demonstrativo para converter listagens de vidro em PDF ou o DWG de referência num ficheiro `IMPORT_EXCEL.xlsx` compatível com o Optima.

## Fluxo

1. Iniciar sessão no ambiente de demonstração.
2. Carregar um PDF ou o DWG de referência.
3. Processar em modo demonstrativo validado, OpenAI ou Anthropic.
4. Rever, corrigir e validar cada linha.
5. Exportar o ficheiro `IMPORT_EXCEL.xlsx`.

## Execução local

```bash
pnpm install
pnpm dev
```

As credenciais e o segredo de sessão devem ser definidos a partir de `.env.example`.

## Limites da demonstração

- O carregamento está limitado a 4,4 MB, em linha com o limite de payload das Vercel Functions.
- O DWG é reconhecido pelo hash do ficheiro de referência e processado através do PDF convertido incluído no projeto.
- As chaves de API são recebidas apenas no pedido de processamento e não são persistidas.
- A validação humana de todas as linhas é obrigatória antes da exportação.
