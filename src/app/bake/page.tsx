import type { Metadata } from "next";

import { BakingDay } from "@/features/dough-calculator/components/baking-day";

export const metadata: Metadata = {
  title: "Baking Day",
  description: "A focused kitchen execution mode for your pizza dough recipe.",
};

export default function BakingDayPage() {
  return <BakingDay />;
}
