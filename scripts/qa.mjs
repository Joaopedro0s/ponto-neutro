// Auditoria de acessibilidade (axe, WCAG 2.1 A/AA), rolagem lateral e capturas das telas principais.
// Uso, com o app rodando (npm run dev):
//   npm run qa                         auditoria em 1440px e 390px
//   npm run qa -- --capturas           também salva PNGs em docs/screenshots (ou QA_OUT)
//   npm run qa -- --so=agenda,login    só as telas cujo nome contém esses trechos
// Usa o Edge ou o Chrome já instalados (playwright-core não baixa navegador).
import { mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.QA_URL ?? "http://localhost:3000";
const CHANNEL = process.env.QA_BROWSER ?? "msedge";
const OUT = process.env.QA_OUT ?? "docs/screenshots";
const capture = process.argv.includes("--capturas");
const only = process.argv.find((a) => a.startsWith("--so="))?.slice(5).split(",");

const browser = await chromium.launch({ channel: CHANNEL });
const common = { locale: "pt-BR", timezoneId: "America/Sao_Paulo", colorScheme: "dark" };
const desktop = await browser.newContext({ ...common, viewport: { width: 1440, height: 900 } });
// Celular emulado de verdade (toque, user agent), na largura pedida de 390px.
const mobile = await browser.newContext({ ...devices["iPhone 13"], ...common, viewport: { width: 390, height: 844 } });
if (capture) await mkdir(OUT, { recursive: true });

async function login(context) {
  const page = await context.newPage();
  await page.goto(BASE + "/login");
  await page.getByRole("button", { name: "Entrar como demonstração" }).click();
  await page.waitForURL(BASE + "/");
  return page;
}

let failures = 0;
async function check(page, name, path, fullPage) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400); // animações curtas de entrada
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  failures += violations.length + (overflow ? 1 : 0);
  console.log(`${violations.length || overflow ? "✖" : "✔"} ${name}${overflow ? " · rolagem horizontal!" : ""}`);
  for (const v of violations) console.log(`   ${v.impact} ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  if (capture) await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
}

// Telas públicas
for (const [ctx, suffix] of [[desktop, ""], [mobile, "-celular"]]) {
  if (only && !only.some((o) => `login${suffix}`.includes(o))) continue;
  const page = await ctx.newPage();
  await check(page, `login${suffix}`, "/login", false);
  await check(page, `nao-encontrada${suffix}`, "/pagina-que-nao-existe", false);
  await page.close();
}

const pages = {
  dashboard: { path: "/", full: true },
  "agenda-semana": { path: "/agenda" },
  "agenda-dia": { path: "/agenda?visao=dia" },
  "agenda-novo": { path: "/agenda/novo" },
  clientes: { path: "/clientes" },
  "veiculo-historico": { find: { from: "/clientes", selector: 'a[href^="/veiculos/"]' }, full: true },
  orcamentos: { path: "/orcamentos" },
  orcamento: { find: { from: "/orcamentos?situacao=APPROVED", selector: 'a[href^="/orcamentos/c"]' }, full: true },
  "orcamento-novo": { path: "/orcamentos/novo" },
  ordens: { path: "/ordens" },
  ordem: { find: { from: "/ordens", selector: 'a[href^="/ordens/c"]' } },
  servicos: { path: "/servicos" },
};

for (const [ctx, suffix] of [[desktop, ""], [mobile, "-celular"]]) {
  const page = await login(ctx);
  for (const [name, spec] of Object.entries(pages)) {
    if (only && !only.some((o) => `${name}${suffix}`.includes(o))) continue;
    let path = spec.path;
    if (spec.find) {
      await page.goto(BASE + spec.find.from, { waitUntil: "networkidle" });
      path = await page.locator(spec.find.selector).first().getAttribute("href");
    }
    await check(page, name + suffix, path, spec.full ?? false);
  }
}

await browser.close();
console.log(failures ? `\n${failures} problema(s) encontrado(s).` : "\nNenhum problema de acessibilidade ou rolagem horizontal.");
process.exitCode = failures ? 1 : 0;
