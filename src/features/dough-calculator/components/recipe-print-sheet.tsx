import { forwardRef } from "react";

import { FormulaSignature } from "./formula-signature";
import type { RecipePresentationModel } from "../utils/recipe-presentation";
import { formatIngredientGrams, formatPercentage } from "../utils/format";

export const RecipePrintSheet = forwardRef<
  HTMLDivElement,
  { model: RecipePresentationModel }
>(function RecipePrintSheet({ model }, ref) {
  return (
    <div ref={ref} className="recipe-print-sheet" aria-hidden="true">
      <header className="print-sheet-header">
        <div>
          <p className="print-kicker">
            {model.brand} · {model.product}
          </p>
          <h1>{model.name}</h1>
          <p>{model.style}</p>
        </div>
        <FormulaSignature data={model.signature} className="size-24" />
      </header>
      <section className="print-result-grid">
        <PrintStat
          label="Total dough"
          value={`${Math.round(model.totalDoughWeightGrams)} g`}
          strong
        />
        <PrintStat
          label={`Per ${model.unitNoun}`}
          value={`${Math.round(model.doughWeightPerUnitGrams)} g`}
        />
        <PrintStat label="Quantity" value={`${model.quantity}`} />
        <PrintStat label="Format" value={model.size} />
        <PrintStat
          label="Hydration"
          value={formatPercentage(model.hydration)}
        />
        <PrintStat label="Surface" value={model.surface} />
      </section>
      <PrintGroup title="Ingredient ledger">
        {model.mainIngredients.map((ingredient) => (
          <PrintRow
            key={ingredient.id}
            label={ingredient.label}
            detail={formatPercentage(ingredient.bakersPercentage)}
            value={`${formatIngredientGrams(ingredient.grams, ingredient.kind)} g`}
          />
        ))}
      </PrintGroup>
      {model.flourBlend.length > 1 ? (
        <PrintGroup title="Main dough flour blend">
          {model.flourBlend.map((flour) => (
            <PrintRow
              key={flour.id}
              label={flour.name}
              detail={formatPercentage(flour.percentage)}
              value={`${Math.round(flour.grams)} g`}
            />
          ))}
        </PrintGroup>
      ) : null}
      {model.starter ? (
        <PrintGroup title="Starter breakdown">
          <PrintRow
            label="Total starter"
            value={`${Math.round(model.starter.weightGrams)} g`}
          />
          <PrintRow
            label="Starter flour"
            detail="Already counted"
            value={`${Math.round(model.starter.flourGrams)} g`}
          />
          <PrintRow
            label="Starter water"
            detail="Already counted"
            value={`${Math.round(model.starter.waterGrams)} g`}
          />
          <PrintRow
            label="Prefermented flour"
            value={formatPercentage(model.starter.prefermentedFlourPercentage)}
          />
        </PrintGroup>
      ) : null}
      {model.warnings.length > 0 ? (
        <PrintGroup title="Equipment and formula notes">
          <ul>
            {model.warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        </PrintGroup>
      ) : null}
      <section className="print-notes">
        <h2>Bake notes</h2>
        <div />
        <div />
        <div />
      </section>
      <footer>{model.productionUrl}</footer>
    </div>
  );
});

function PrintStat({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={strong ? "print-stat print-stat-strong" : "print-stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PrintGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function PrintRow({
  label,
  detail,
  value,
}: {
  label: string;
  detail?: string;
  value: string;
}) {
  return (
    <div className="print-row">
      <span>
        {label}
        {detail ? <small>{detail}</small> : null}
      </span>
      <strong>{value}</strong>
    </div>
  );
}
