import {
  createRecipeDocument,
  type PizzaRecipeDocument,
  type PizzaRecipeDocumentV1,
} from "../domain/recipe-document";
import { DEFAULT_PRESET } from "../presets/formulas";
import { presetToFormValues } from "../presets/preset-form-values";

export function makeRecipeDocument(
  name = "Test New York Pizza"
): PizzaRecipeDocument {
  const result = createRecipeDocument({
    name,
    values: presetToFormValues(DEFAULT_PRESET),
    context: {
      presetId: DEFAULT_PRESET.id,
      surfaceId: DEFAULT_PRESET.surface,
      panProfileId: DEFAULT_PRESET.panProfileId ?? "half-sheet-13x18",
      panInteriorMeasured: false,
    },
  });
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

export function makeLegacyRecipeDocument(
  name = "Legacy Test New York Pizza"
): PizzaRecipeDocumentV1 {
  const current = makeRecipeDocument(name);
  return {
    schemaVersion: 1,
    name: current.name,
    calculatorInput: current.calculatorInput,
    context: current.context,
  };
}
