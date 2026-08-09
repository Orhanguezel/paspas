import { FileSignature } from "lucide-react";

import { FuarSectionPage } from "../_components/fuar-section-page";

export default function FuarTekliflerPage() {
  return (
    <FuarSectionPage
      title="Fuar Teklifleri"
      description="Fuar görüşmelerinden oluşan teklif ve revizyon kayıtları."
      icon={FileSignature}
      items={[
        "Katalog ve sepetten teklif oluşturma",
        "EXW, FOB ve CIF teslim şekilleri",
        "R1, R2 ve devam eden revizyonlar",
        "PDF, proforma ve packing list çıktıları",
      ]}
    />
  );
}
