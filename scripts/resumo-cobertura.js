// Lê o relatório de cobertura do Jest e escreve uma tabela em Markdown.
// No GitHub Actions a tabela aparece no resumo da execução (GITHUB_STEP_SUMMARY).
const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "coverage", "coverage-summary.json");

if (!fs.existsSync(arquivo)) {
  console.error("coverage/coverage-summary.json não encontrado. Rode npm run test:coverage antes.");
  process.exit(1);
}

const { total } = JSON.parse(fs.readFileSync(arquivo, "utf8"));
const linha = (nome, item) => `| ${nome} | ${item.pct}% | ${item.covered}/${item.total} |`;

const markdown = [
  "## Cobertura dos testes",
  "",
  "| Métrica | Cobertura | Cobertos/Total |",
  "| --- | --- | --- |",
  linha("Linhas", total.lines),
  linha("Instruções", total.statements),
  linha("Funções", total.functions),
  linha("Desvios (if/else)", total.branches),
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

console.log(markdown);
