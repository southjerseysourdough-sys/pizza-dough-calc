import { SiteHeader } from "@/components/layout";
import { DashboardOverview } from "@/features/dashboard";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <DashboardOverview />
      </main>
    </>
  );
}
