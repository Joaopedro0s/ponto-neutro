import "server-only";
import { Circle, Document, Page, Path, Rect, renderToBuffer, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { company } from "@/lib/company";
import { db } from "@/lib/db";
import { formatBRL, formatDate } from "@/lib/format";
import { formatQuoteNumber, quoteItemKindLabel, quoteStatus } from "@/lib/labels";

// Cores da marca repetidas aqui porque o PDF não lê as variáveis CSS do site.
const BRAND = "#1d5a5e";
const ACCENT = "#e0a43a";
const INK = "#1f2329";
const MUTED = "#6b7078";
const LINE = "#e3e1dc";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, color: INK, fontFamily: "Helvetica" },
  row: { flexDirection: "row" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: BRAND, paddingBottom: 14 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 15, fontFamily: "Helvetica-Bold", color: BRAND },
  small: { fontSize: 8.5, color: MUTED, lineHeight: 1.45 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right", marginBottom: 6 },
  boxes: { flexDirection: "row", gap: 12, marginTop: 18 },
  box: { borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 10 },
  label: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  th: { flexDirection: "row", backgroundColor: "#f3f1ec", paddingVertical: 6, paddingHorizontal: 8, marginTop: 20, fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  cKind: { width: 70 },
  cDesc: { flex: 1 },
  cQty: { width: 40, textAlign: "right" },
  cUnit: { width: 75, textAlign: "right" },
  cTotal: { width: 80, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 220, marginTop: 12, gap: 4 },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  grand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: BRAND, paddingTop: 6, marginTop: 4, fontSize: 12, fontFamily: "Helvetica-Bold" },
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
            <Svg viewBox="0 0 32 32" width={34} height={34}>
              <Rect width="32" height="32" rx="8" fill={BRAND} />
              <Path d="M9 8v16M16 8v16M23 8v16M9 16h14" stroke="#f7f5f0" strokeWidth={2.4} strokeLinecap="round" />
              <Circle cx="16" cy="16" r="3.4" fill={ACCENT} stroke={BRAND} strokeWidth={1.6} />
            </Svg>
            <View>
              <Text style={s.name}>{company.name}</Text>
              <Text style={s.small}>Estética & Mecânica Automotiva</Text>
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
            <Text style={s.bold}>{q.vehicle.plate}</Text>
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
          <View key={i.id} style={s.tr} wrap={false}>
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
            <Text>Total</Text>
            <Text>{formatBRL(q.total)}</Text>
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
