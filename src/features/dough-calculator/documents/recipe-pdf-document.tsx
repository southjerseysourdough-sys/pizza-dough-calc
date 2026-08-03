import {
  Document,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import { polarArcPath } from "../domain/formula-signature";
import type { RecipePresentationModel } from "../utils/recipe-presentation";
import { formatIngredientGrams, formatPercentage } from "../utils/format";

const colors = {
  ink: "#101112",
  graphite: "#383b3f",
  smoke: "#8a8f98",
  line: "#d0d3d8",
  lime: "#b4c000",
};
const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 42,
    paddingHorizontal: 42,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.ink,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.7,
    borderBottomColor: colors.graphite,
    paddingBottom: 14,
    marginBottom: 16,
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.graphite,
    marginBottom: 5,
  },
  title: { fontSize: 22, marginBottom: 4 },
  subtitle: { color: colors.graphite },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 0.6,
    borderColor: colors.line,
    marginBottom: 18,
  },
  metric: {
    width: "33.333%",
    padding: 9,
    borderRightWidth: 0.4,
    borderBottomWidth: 0.4,
    borderColor: colors.line,
  },
  metricLabel: {
    fontFamily: "Courier",
    fontSize: 6.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.smoke,
    marginBottom: 3,
  },
  metricValue: { fontSize: 10 },
  group: { marginBottom: 14 },
  groupTitle: {
    fontFamily: "Courier",
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.graphite,
    borderBottomWidth: 0.7,
    borderBottomColor: colors.graphite,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4.5,
    borderBottomWidth: 0.35,
    borderBottomColor: colors.line,
  },
  rowLabel: { flexDirection: "row", gap: 7 },
  detail: { color: colors.smoke },
  value: { fontFamily: "Courier" },
  notes: {
    marginTop: 4,
    padding: 9,
    borderLeftWidth: 2,
    borderLeftColor: colors.lime,
    backgroundColor: "#f5f5f5",
  },
  note: { marginBottom: 3, lineHeight: 1.35 },
  bakeNotes: { marginTop: 8 },
  noteLine: {
    height: 22,
    borderBottomWidth: 0.4,
    borderBottomColor: colors.line,
  },
  footer: {
    position: "absolute",
    left: 42,
    right: 42,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Courier",
    fontSize: 6.5,
    color: colors.smoke,
  },
});

export function RecipePdfDocument({
  model,
}: {
  model: RecipePresentationModel;
}) {
  return (
    <Document
      title={model.name}
      author={model.brand}
      subject="Pizza dough recipe"
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.kicker}>
              {model.brand} / {model.product}
            </Text>
            <Text style={styles.title}>{model.name}</Text>
            <Text style={styles.subtitle}>{model.style}</Text>
          </View>
          <PdfSignature model={model} />
        </View>
        <View style={styles.metrics}>
          <PdfMetric
            label="Total dough"
            value={`${Math.round(model.totalDoughWeightGrams)} g`}
          />
          <PdfMetric
            label={`Per ${model.unitNoun}`}
            value={`${Math.round(model.doughWeightPerUnitGrams)} g`}
          />
          <PdfMetric label="Quantity" value={`${model.quantity}`} />
          <PdfMetric label="Format" value={model.size} />
          <PdfMetric
            label="Hydration"
            value={formatPercentage(model.hydration)}
          />
          <PdfMetric label="Surface" value={model.surface} />
        </View>
        <PdfGroup title="Ingredient ledger">
          {model.mainIngredients.map((ingredient) => (
            <PdfRow
              key={ingredient.id}
              label={ingredient.label}
              detail={formatPercentage(ingredient.bakersPercentage)}
              value={`${formatIngredientGrams(ingredient.grams, ingredient.kind)} g`}
            />
          ))}
        </PdfGroup>
        {model.flourBlend.length > 1 ? (
          <PdfGroup title="Main dough flour blend">
            {model.flourBlend.map((flour) => (
              <PdfRow
                key={flour.id}
                label={flour.name}
                detail={formatPercentage(flour.percentage)}
                value={`${Math.round(flour.grams)} g`}
              />
            ))}
          </PdfGroup>
        ) : null}
        {model.starter ? (
          <PdfGroup title="Starter breakdown">
            <PdfRow
              label="Total starter"
              value={`${Math.round(model.starter.weightGrams)} g`}
            />
            <PdfRow
              label="Starter flour"
              detail="Already counted"
              value={`${Math.round(model.starter.flourGrams)} g`}
            />
            <PdfRow
              label="Starter water"
              detail="Already counted"
              value={`${Math.round(model.starter.waterGrams)} g`}
            />
            <PdfRow
              label="Prefermented flour"
              value={formatPercentage(
                model.starter.prefermentedFlourPercentage
              )}
            />
          </PdfGroup>
        ) : null}
        {model.warnings.length > 0 ? (
          <View style={styles.notes} wrap={false}>
            {model.warnings.map((warning) => (
              <Text key={warning.code} style={styles.note}>
                • {warning.message}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={styles.bakeNotes}>
          <Text style={styles.groupTitle}>Bake notes</Text>
          <View style={styles.noteLine} />
          <View style={styles.noteLine} />
          <View style={styles.noteLine} />
        </View>
        <View style={styles.footer} fixed>
          <Text>{model.productionUrl}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${model.name} · ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function PdfSignature({ model }: { model: RecipePresentationModel }) {
  return (
    <Svg width={72} height={72} viewBox="0 0 112 112">
      {model.signature.arcs.map((arc) => (
        <Path
          key={arc.key}
          d={polarArcPath(arc.radius, arc.start, arc.sweep)}
          fill="none"
          stroke={arc.active ? colors.lime : colors.line}
          strokeWidth={arc.active ? 1.5 : 0.75}
        />
      ))}
    </Svg>
  );
}
function PdfMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}
function PdfGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} minPresenceAhead={40}>
        {title}
      </Text>
      {children}
    </View>
  );
}
function PdfRow({
  label,
  detail,
  value,
}: {
  label: string;
  detail?: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
