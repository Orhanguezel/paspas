import { Users } from "lucide-react";

import { FuarSectionPage } from "../_components/fuar-section-page";

export default function FuarMusterilerPage() {
  return (
    <FuarSectionPage
      title="Fuar Müşterileri"
      description="Fuar tekliflerinde kullanılacak bağımsız müşteri kayıtları."
      icon={Users}
      items={[
        "Firma ve iletişim bilgileri",
        "Fatura ve teslimat adresleri",
        "Varsayılan para birimi",
        "Müşteriye özel genel indirim",
      ]}
    />
  );
}
