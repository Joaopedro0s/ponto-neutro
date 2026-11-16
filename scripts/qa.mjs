// Auditoria de acessibilidade (axe, WCAG 2.1 A/AA) e capturas de tela das telas principais.
// Uso: com o app rodando (npm run dev), `npm run qa` ou `npm run qa -- --capturas`.
// Usa o Edge ou o Chrome já instalados (playwright-core não baixa navegador).
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.QA_URL ?? "http://localhost:3000";
const CHANNEL = process.env.QA_BROWSER ?? "msedge";
const capture = process.argv.includes("--capturas");
const OUT = "docs/screenshots";

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

async function firstHref(page, selector) {
  return page.locator(selector).first().getAttribute("href");
}

const browser = await chromium.launch({ channel: CHANNEL });
const context = await browser.newContext({ viewport: desktop, locale: "pt-BR", timezoneId: "America/Sao_Paulo", deviceScaleFactor: 1 });
const page = await context.newPage();
if (capture) await mkdir(OUT, { recursive: true });

let failures = 0;
async function check(name, path, { size = desktop, fullPage = false } = {}) {
  await page.setViewportSize(size);
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  failures += violations.length + (overflow ? 1 : 0);
  console.log(`${violations.length || overflow ? "✖" : "✔"} ${name} (${size.width}px)${overflow ? " · rolagem horizontal!" : ""}`);
  for (const v of violations) console.log(`   ${v.impact} ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  if (capture) await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
}

// Login (antes de entrar)
await check("login", "/login");
await check("login-celular", "/login", { size: mobile });

// Entra pelo botão de demonstração
await page.goto(BASE + "/login");
await page.getByRole("button", { name: "Entrar como demonstração" }).click();
await page.waitForURL(BASE + "/");

await check("dashboard", "/", { fullPage: true });
await check("dashboard-celular", "/", { size: mobile });
await check("agenda-semana", "/agenda");
await check("agenda-dia-celular", "/agenda?visao=dia", { size: mobile });
await check("agenda-novo", "/agenda/novo");

await page.goto(BASE + "/orcamentos?situacao=APPROVED");
const quote = await firstHref(page, "main ul.divide-y a");
await check("orcamentos", "/orcamentos");
await check("orcamento", quote, { fullPage: true });
await check("orcamento-novo-celular", "/orcamentos/novo", { size: mobile });

await check("ordens", "/ordens");
await page.goto(BASE + "/ordens");
await check("ordem", await firstHref(page, "article a"));

await check("clientes", "/clientes");
await page.goto(BASE + "/clientes");
await check("veiculo-historico", await firstHref(page, 'a[href^="/veiculos/"]'), { fullPage: true });
await check("servicos", "/servicos");

if (capture) {
  // PDF do orçamento: o link público é aberto como página para gerar a imagem.
  await page.goto(BASE + quote);
  const pdf = await page.locator('a[href^="/compartilhar/orcamento/"]').first().getAttribute("href");
  console.log(`PDF do orçamento: ${BASE}${pdf}`);
}

await browser.close();
console.log(failures ? `\n${failures} problema(s) encontrado(s).` : "\nNenhum problema de acessibilidade ou rolagem horizontal.");
process.exitCode = failures ? 1 : 0;
