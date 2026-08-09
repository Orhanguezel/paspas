import { Package } from "lucide-react";

import { FuarSectionPage } from "../_components/fuar-section-page";

export default function FuarUrunlerPage() {
  return (
    <FuarSectionPage
      title="Fuar Ürünleri"
      description="Fuar tekliflerine özel ürün ve lojistik değerleri."
      icon={Package}
      items={[
        "Ürün kartı ve fiyat bilgileri",
        "Set, koli ve palet dönüşümleri",
        "MOQ ve tam koli kuralları",
        "Ölçü, CBM ve ağırlık değerleri",
      ]}
    />
  );
}
