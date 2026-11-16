import "server-only";
import path from "node:path";
import { Circle, Document, Font, Page, Path, Rect, renderToBuffer, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { LOGO } from "@/components/logo";
import { company } from "@/lib/company";
import { db } from "@/lib/db";
import { formatBRL, formatDate } from "@/lib/format";
import { formatQuoteNumber, quoteItemKindLabel, quoteStatus } from "@/lib/labels";

// Mesmas fontes do sistema (pacotes @fontsource; incluídos no deploy via outputFileTracingIncludes).
const font = (pkg: string, file: string) => path.join(process.cwd(), "node_modules/@fontsource", pkg, "files", file);
Font.register({
  family: "Barlow Condensed",
  fonts: [
    { src: font("barlow-condensed", "barlow-condensed-latin-600-normal.woff"), fontWeight: 600 },
    { src: font("barlow-condensed", "barlow-condensed-latin-700-normal.woff"), fontWeight: 700 },
  ],
});
Font.register({
  family: "Geist",
  fonts: [
    { src: font("geist-sans", "geist-sans-latin-400-normal.woff"), fontWeight: 400 },
    { src: font("geist-sans", "geist-sans-latin-600-normal.woff"), fontWeight: 600 },
  ],
});
Font.register({ family: "JetBrains Mono", src: font("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff") });
Font.registerHyphenationCallback((word) => [word]); // não quebrar palavras com hífen

// Fundo branco: acento #e0301a (4,6:1 no branco) em filetes e no total. O ponto do logotipo
// mantém a cor da marca.
const ACCENT = "#e0301a";
const ACCENT_TEXT = ACCENT;
const INK = "#000000";
const MUTED = "#5c5c5c"; // 6,7:1 no branco
const LINE = "#e5e5e5";
const ZEBRA = "#f5f5f5";

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 64, fontSize: 9.5, color: INK, fontFamily: "Geist" },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 2, borderBottomColor: ACCENT, paddingBottom: 14 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 20, fontFamily: "Barlow Condensed", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" },
  small: { fontSize: 8.5, color: MUTED, lineHeight: 1.45 },
  title: { fontSize: 22, fontFamily: "Barlow Condensed", fontWeight: 700, textAlign: "right", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  boxes: { flexDirection: "row", gap: 12, marginTop: 18 },
  box: { borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 10 },
  label: { fontSize: 8, fontFamily: "Barlow Condensed", fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 },
  bold: { fontWeight: 600 },
  plate: { fontFamily: "JetBrains Mono", fontSize: 11 },
  th: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: INK, paddingVertical: 6, paddingHorizontal: 8, marginTop: 22, fontFamily: "Barlow Condensed", fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  cKind: { width: 70 },
  cDesc: { flex: 1 },
  cQty: { width: 40, textAlign: "right" },
  cUnit: { width: 75, textAlign: "right" },
  cTotal: { width: 80, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 220, marginTop: 12, gap: 4 },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  grand: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderTopWidth: 2, borderTopColor: ACCENT, paddingTop: 6, marginTop: 4 },
  grandLabel: { fontFamily: "Barlow Condensed", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 },
  grandValue: { fontFamily: "Barlow Condensed", fontWeight: 700, fontSize: 22, color: ACCENT_TEXT },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8, flexDirection: "row", gap: 16, fontSize: 7.5, color: MUTED },
});

export async function getQuoteByToken(token: string) {
  // Recusa antes de consultar: a coluna é UUID e um texto qualquer faria o banco errar.
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  return db.quote.findUnique({
    where: { shareToken: token },
    include: { customer: true, vehicle: true, items: { orderBy: { position: "asc" } } },
  });
}

type Quote = NonNullable<Awaited<ReturnType<typeof getQuoteByToken>>>;

function QuotePdf({ q }: { q: Quote }) {
  const discount = Number(q.discount);
  return (
    <Document title={`${formatQuoteNumber(q.number)} · ${company.name}`} author={company.name} language="pt-BR">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            <Svg viewBox="0 0 32 32" width={36} height={36}>
              <Rect width="32" height="32" rx="8" fill={LOGO.tile} />
              <Path d={LOGO.path} stroke={LOGO.line} strokeWidth={2.6} strokeLinecap="round" />
              <Circle cx="16" cy="16" r="3.8" fill={LOGO.neutral} stroke={LOGO.tile} strokeWidth={1.8} />
            </Svg>
            <View>
              <Text style={s.name}>
                Ponto <Text style={{ color: ACCENT_TEXT }}>Neutro</Text>
              </Text>
              <Text style={s.small}>{company.slogan}</Text>
            </View>
          </View>
          <View>
            <Text style={s.title}>Orçamento {formatQuoteNumber(q.number)}</Text>
            <Text style={[s.small, { textAlign: "right" }]}>
              Emitido em {formatDate(q.createdAt)}
              {q.validUntil ? ` · válido até ${formatDate(q.validUntil)}` : ""}
            </Text>
            <Text style={[s.small, { textAlign: "right" }]}>Situação: {quoteStatus[q.status].label}</Text>
          </View>
        </View>

        <View style={s.boxes}>
          <View style={[s.box, { flex: 1 }]}>
            <Text style={s.label}>Cliente</Text>
            <Text style={s.bold}>{q.customer.name}</Text>
            <Text style={s.small}>{q.customer.phone}</Text>
            {q.customer.email && <Text style={s.small}>{q.customer.email}</Text>}
          </View>
          <View style={[s.box, { flex: 1 }]}>
            <Text style={s.label}>Veículo</Text>
            <Text style={s.plate}>{q.vehicle.plate}</Text>
            <Text style={s.small}>{[q.vehicle.model, q.vehicle.year, q.vehicle.color].filter(Boolean).join(" · ")}</Text>
          </View>
        </View>

        <View style={s.th}>
          <Text style={s.cKind}>Tipo</Text>
          <Text style={s.cDesc}>Descrição</Text>
          <Text style={s.cQty}>Qtd.</Text>
          <Text style={s.cUnit}>Valor unit.</Text>
          <Text style={s.cTotal}>Total</Text>
        </View>
        {q.items.map((i) => (
          <View key={i.id} style={[s.tr, i.position % 2 === 1 ? { backgroundColor: ZEBRA } : {}]} wrap={false}>
            <Text style={[s.cKind, { color: MUTED }]}>{quoteItemKindLabel[i.kind]}</Text>
            <Text style={s.cDesc}>{i.description}</Text>
            <Text style={s.cQty}>{Number(i.quantity).toString().replace(".", ",")}</Text>
            <Text style={s.cUnit}>{formatBRL(i.unitPrice)}</Text>
            <Text style={s.cTotal}>{formatBRL(Number(i.quantity) * Number(i.unitPrice))}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text style={{ color: MUTED }}>Subtotal</Text>
            <Text>{formatBRL(q.subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={s.totalLine}>
              <Text style={{ color: MUTED }}>Desconto</Text>
              <Text>- {formatBRL(discount)}</Text>
            </View>
          )}
          <View style={s.grand}>
            <Text style={s.grandLabel}>Total</Text>
            <Text style={s.grandValue}>{formatBRL(q.total)}</Text>
          </View>
        </View>

        {q.notes && (
          <View style={[s.box, { marginTop: 20 }]}>
            <Text style={s.label}>Observações</Text>
            <Text style={{ lineHeight: 1.45 }}>{q.notes}</Text>
          </View>
        )}

        <Text style={[s.small, { marginTop: 20 }]}>
          Valores em reais. Peças sujeitas a disponibilidade.
          {(q.status === "DRAFT" || q.status === "SENT") && ` Para aprovar, responda a mensagem ou ligue para ${company.whatsapp}.`}
        </Text>

        <View style={s.footer} fixed>
          <Text style={{ flex: 1 }}>
            {company.fullName} · {company.address} · {company.phone} · {company.email}
          </Text>
          <Text>Demonstração com dados fictícios</Text>
        </View>
      </Page>
    </Document>
  );
}

export const renderQuotePdf = (q: Quote) => renderToBuffer(<QuotePdf q={q} />);
