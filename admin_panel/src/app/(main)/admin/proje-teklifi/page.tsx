import DokumanListesi from "./_components/dokuman-listesi";
import FazlarGrid from "./_components/fazlar-grid";
import FelsefeBolumu from "./_components/felsefe-bolumu";
import KararNoktalari from "./_components/karar-noktalari";
import KpiGrid from "./_components/kpi-grid";
import MimariKatmanlar from "./_components/mimari-katmanlar";
import TechStack from "./_components/tech-stack";
import TeklifHero from "./_components/teklif-hero";

export const dynamic = "force-static";

export default function Page() {
  return (
    <div className="space-y-12 pb-12">
      <TeklifHero />
      <FelsefeBolumu />
      <FazlarGrid />
      <MimariKatmanlar />
      <KpiGrid />
      <TechStack />
      <DokumanListesi />
      <KararNoktalari />
    </div>
  );
}
