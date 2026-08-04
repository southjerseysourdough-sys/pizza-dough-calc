import { calculateDough } from "./calculate-dough";
import type { FermentationStageType } from "./fermentation";
import type { PizzaRecipeDocument } from "./recipe-document";

export type BakingInstruction = {
  id: string;
  title: string;
  detail: string;
};

export type BakingInstructionSet = {
  stageType: FermentationStageType;
  instructions: BakingInstruction[];
  observation: string;
};

const item = (
  id: string,
  title: string,
  detail: string
): BakingInstruction => ({ id, title, detail });

export function createBakingInstructions(
  document: PizzaRecipeDocument,
  stageType: FermentationStageType
): BakingInstructionSet {
  const input = document.calculatorInput;
  const calculation = calculateDough(input);
  const result = calculation.ok ? calculation.result : null;
  const sheetPan = input.sizing.shape === "rectangular";
  const highHydration = input.hydration >= 0.68;
  const method = input.leavening.method;
  const instructions: BakingInstruction[] = [];

  if (stageType === "ingredient-prep") {
    instructions.push(
      item(
        "weigh",
        "Weigh precisely",
        "Set out every ingredient in grams and keep starter flour and water inside the formula accounting."
      )
    );
    if (method !== "commercial-yeast")
      instructions.push(
        item(
          "starter",
          "Check starter readiness",
          "Use ripe, active starter or levain. Its condition matters more than an exact scheduled peak time."
        )
      );
  }

  if (stageType === "mix") {
    instructions.push(
      item(
        "incorporate",
        "Complete incorporation",
        highHydration
          ? "Mix until no dry flour remains, then use wet or lightly oiled hands for gentle strengthening."
          : "Mix until evenly incorporated and develop enough strength without adding unnecessary flour."
      )
    );
    if (method !== "sourdough")
      instructions.push(
        item(
          "yeast",
          "Distribute the yeast",
          input.leavening.yeastType === "active-dry"
            ? "Disperse active dry yeast evenly according to its package guidance before completing the mix."
            : "Distribute the commercial yeast evenly through the flour and water."
        )
      );
    if (method === "hybrid")
      instructions.push(
        item(
          "hybrid",
          "Both systems are active",
          "The starter and commercial yeast both leaven this dough; neither is present only for flavor."
        )
      );
    if (input.fat > 0)
      instructions.push(
        input.fatType === "tallow"
          ? item(
              "tallow",
              "Add tallow after hydration",
              "Use softened tallow, or melted tallow cooled until just fluid. Work it in after flour and water are incorporated so it coats the developed dough evenly."
            )
          : item(
              "fat",
              "Add fat after hydration",
              "Work the oil in after flour and water are incorporated so it does not slow initial hydration."
            )
      );
  }

  if (stageType === "folds")
    instructions.push(
      item(
        "fold",
        highHydration ? "Use gentle folds" : "Build strength evenly",
        highHydration
          ? "Use wet or lightly oiled hands, lift gently, and preserve gas rather than forcing the dough."
          : "Fold or knead until the dough gains elasticity; avoid dusting in extra flour just to prevent sticking."
      )
    );

  if (stageType === "room-bulk" || stageType === "final-proof")
    instructions.push(
      item(
        "observe",
        "Read the dough",
        stageType === "room-bulk"
          ? "Look for a smoother surface, gas formation, increasing elasticity, and useful strength."
          : "Look for relaxation, visible aeration, reduced resistance, and appropriate edge development."
      )
    );

  if (stageType === "divide" || stageType === "ball")
    instructions.push(
      item(
        "portion",
        `Portion ${input.sizing.quantity} ${input.sizing.quantity === 1 ? "piece" : "pieces"}`,
        result
          ? `Target about ${Math.round(result.sizing.doughWeightPerUnitGrams)} g each. Keep the skin taut without tearing and preserve internal gas.`
          : "Divide evenly and form smooth balls without tearing the surface."
      )
    );

  if (stageType === "pan")
    instructions.push(
      item(
        "prepare-pan",
        "Prepare and stretch in the pan",
        "Oil the measured interior evenly. Stretch gently toward the corners, rest when the dough resists, then repeat rather than forcing it."
      )
    );

  if (stageType === "shape")
    instructions.push(
      item(
        "shape",
        "Shape with restraint",
        highHydration
          ? "Use minimal bench flour, preserve the rim gas, and support the soft center as you stretch."
          : "Open the dough evenly without pressing out the rim, and avoid excess bench flour on the underside."
      )
    );

  if (stageType === "top")
    instructions.push(
      item(
        "top",
        sheetPan ? "Top the proofed pan" : "Top and launch promptly",
        sheetPan
          ? "Handle the aerated dough gently. Apply toppings evenly without collapsing the edge or overloading the center."
          : "Prepare the peel, keep toppings balanced, check that the dough still slides, and launch without delay."
      )
    );

  if (stageType === "preheat")
    instructions.push(
      item(
        "preheat",
        sheetPan
          ? "Preheat the oven fully"
          : "Heat the baking surface thoroughly",
        sheetPan
          ? "Give the oven time to stabilize before the pan goes in."
          : "A steel or stone needs a full preheat; oven air reaching temperature does not mean the surface is ready."
      )
    );

  if (stageType === "bake")
    instructions.push(
      item(
        "doneness",
        "Judge doneness directly",
        sheetPan
          ? "Check the edge color and lift the crust to inspect the bottom. Rotate if your oven browns unevenly."
          : "Watch bottom browning and rim color. Use a broiler only if your equipment and topping load need it, and never leave it unattended."
      )
    );

  if (instructions.length === 0)
    instructions.push(
      item(
        "stage",
        "Follow the planned stage",
        "Use the schedule as a prompt and adjust to the actual dough condition."
      )
    );

  return {
    stageType,
    instructions,
    observation:
      method === "sourdough"
        ? "Judge the dough and starter strength, not merely the clock."
        : "Judge the dough, not merely the clock; temperature and handling can change the pace.",
  };
}
