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
// Capturas de 1024px e 768px servem para revisão; por padrão vão para a mesma pasta.
const OUT_EXTRA = process.env.QA_OUT_EXTRA ?? OUT;
const capture = process.argv.includes("--capturas");
const only = process.argv.find((a) => a.startsWith("--so="))?.slice(5).split(",");

const browser = await chromium.launch({ channel: CHANNEL });
const common = { locale: "pt-BR", timezoneId: "America/Sao_Paulo", colorScheme: "dark" };
// Larguras conferidas: 1440, 1024 e 768px, e celular emulado de verdade (toque, user agent) em 390px.
const contexts = [
  [await browser.newContext({ ...common, viewport: { width: 1440, height: 900 } }), "", OUT],
  [await browser.newContext({ ...common, viewport: { width: 1024, height: 768 } }), "-1024", OUT_EXTRA],
  [await browser.newContext({ ...common, viewport: { width: 768, height: 1024 } }), "-768", OUT_EXTRA],
  [await browser.newContext({ ...devices["iPhone 13"], ...common, viewport: { width: 390, height: 844 } }), "-celular", OUT],
];
if (capture) await Promise.all([mkdir(OUT, { recursive: true }), mkdir(OUT_EXTRA, { recursive: true })]);

async function login(context) {
  const page = await context.newPage();
  await page.goto(BASE + "/login");
  await page.getByRole("button", { name: "Entrar como demonstração" }).click();
  await page.waitForURL(BASE + "/");
  return page;
}

let failures = 0;
async function check(page, name, path, fullPage, dir) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400); // animações curtas de entrada
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  failures += violations.length + (overflow ? 1 : 0);
  console.log(`${violations.length || overflow ? "✖" : "✔"} ${name}${overflow ? " · rolagem horizontal!" : ""}`);
  for (const v of violations) console.log(`   ${v.impact} ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  if (capture) await page.screenshot({ path: `${dir}/${name}.png`, fullPage });
}

// Telas públicas
for (const [ctx, suffix, dir] of contexts) {
  const page = await ctx.newPage();
  for (const [name, path] of [["login", "/login"], ["nao-encontrada", "/pagina-que-nao-existe"]]) {
    if (only && !only.some((o) => `${name}${suffix}`.includes(o))) continue;
    await check(page, `${name}${suffix}`, path, false, dir);
  }
  await page.close();
}

const pages = {
  dashboard: { path: "/", full: true },
  "agenda-semana": { path: "/agenda?visao=semana" },
  "agenda-dia": { path: "/agenda" },
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

for (const [ctx, suffix, dir] of contexts) {
  if (only && !Object.keys(pages).some((n) => only.some((o) => `${n}${suffix}`.includes(o)))) continue;
  const page = await login(ctx);
  for (const [name, spec] of Object.entries(pages)) {
    if (only && !only.some((o) => `${name}${suffix}`.includes(o))) continue;
    let path = spec.path;
    if (spec.find) {
      await page.goto(BASE + spec.find.from, { waitUntil: "networkidle" });
      path = await page.locator(spec.find.selector).first().getAttribute("href");
    }
    await check(page, name + suffix, path, spec.full ?? false, dir);
  }
}

await browser.close();
console.log(failures ? `\n${failures} problema(s) encontrado(s).` : "\nNenhum problema de acessibilidade ou rolagem horizontal.");
process.exitCode = failures ? 1 : 0;
