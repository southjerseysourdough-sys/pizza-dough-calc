import type { PizzaRecipeDocumentV1 } from "../domain/recipe-document";
import type { RecipePresentationModel } from "./recipe-presentation";
import { formatIngredientGrams, formatPercentage } from "./format";

export const IMPORT_FILE_SIZE_LIMIT_BYTES = 512 * 1024;

export function sanitizeRecipeFilename(
  name: string,
  extension: "json" | "pdf"
): string {
  const base =
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "pizza-recipe";
  return `${base}.${extension}`;
}

export function serializeRecipeDocument(
  document: PizzaRecipeDocumentV1
): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

function grams(
  value: number,
  kind: Parameters<typeof formatIngredientGrams>[1] = "flour"
): string {
  return `${formatIngredientGrams(value, kind)} g`;
}

export function formatRecipeAsPlainText(
  model: RecipePresentationModel
): string {
  const lines = [
    model.name,
    `${model.brand} · ${model.product}`,
    "",
    `Style: ${model.style}`,
    `Shape: ${model.shape === "round" ? "Round" : "Sheet pan"}`,
    `Size: ${model.size}`,
    `Quantity: ${model.quantity} ${model.unitNoun}${model.quantity === 1 ? "" : "s"}`,
    `Baking surface: ${model.surface}`,
    `Dough per ${model.unitNoun}: ${grams(model.doughWeightPerUnitGrams)}`,
    `Total dough: ${grams(model.totalDoughWeightGrams)}`,
    `True hydration: ${formatPercentage(model.hydration)}`,
    `Dough loading: ${model.doughLoading.toFixed(2)} g per square inch`,
    "",
    "MAIN DOUGH",
    ...model.mainIngredients.map(
      (ingredient) =>
        `${ingredient.label}: ${grams(ingredient.grams, ingredient.kind)} (${formatPercentage(ingredient.bakersPercentage)})`
    ),
  ];

  if (model.flourBlend.length > 1) {
    lines.push(
      "",
      "MAIN DOUGH FLOUR BLEND",
      ...model.flourBlend.map(
        (flour) =>
          `${flour.name}: ${grams(flour.grams)} (${formatPercentage(flour.percentage)})`
      )
    );
  }
  if (model.starter) {
    lines.push(
      "",
      "STARTER BREAKDOWN",
      `Total starter: ${grams(model.starter.weightGrams, "starter")}`,
      `Starter flour (already counted): ${grams(model.starter.flourGrams)}`,
      `Starter water (already counted): ${grams(model.starter.waterGrams, "water")}`,
      `Starter hydration: ${formatPercentage(model.starter.hydration)}`,
      `Prefermented flour: ${formatPercentage(model.starter.prefermentedFlourPercentage)}`
    );
  }
  if (model.customIngredients.length > 0) {
    lines.push(
      "",
      "CUSTOM INGREDIENTS",
      ...model.customIngredients.map(
        (ingredient) =>
          `${ingredient.label}: ${grams(ingredient.grams, ingredient.kind)} (${formatPercentage(ingredient.bakersPercentage)})`
      )
    );
  }
  if (model.warnings.length > 0) {
    lines.push(
      "",
      "NOTES",
      ...model.warnings.map((warning) => `- ${warning.message}`)
    );
  }
  lines.push("", model.productionUrl);
  return lines.join("\n");
}
