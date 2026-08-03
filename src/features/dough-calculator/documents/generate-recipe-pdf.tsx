import { pdf } from "@react-pdf/renderer";

import type { RecipePresentationModel } from "../utils/recipe-presentation";
import { RecipePdfDocument } from "./recipe-pdf-document";

export async function generateRecipePdf(
  model: RecipePresentationModel
): Promise<Blob> {
  return pdf(<RecipePdfDocument model={model} />).toBlob();
}
