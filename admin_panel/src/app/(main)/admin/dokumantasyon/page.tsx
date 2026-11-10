import AdminDocsClient from "./_components/admin-docs-client";
import { parseAdminDocumentation } from "./_lib/admin-docs-parser";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DOC_FILENAME = "ADMIN_SAYFA_DOKUMANTASYONU.md";
// Bu rehber release icinde kalir; sunucudaki opsiyonel docs/ dizinine bagli degildir.
const CHATGPT_MCP_GUIDE = `## ChatGPT ile Promats MCP bağlantısı

Route: \`/admin/promats-mcp\`

### Başlamadan önce

- ChatGPT'nin web sürümünde özel MCP sunucusu ekleme yetkisi olan hesabınızı kullanın. Çalışma alanı kısıtları bu seçeneği gizleyebilir.
- ERP yöneticisi hesabınızla aynı tarayıcıda panele giriş yapın. Bağlantı onayı yalnızca yetkili yönetici hesabıyla verilir.
- MCP sunucu adresi: \`https://panel.avrasyaotomotiv.net/api/mcp\`. ChatGPT için kişisel API jetonu oluşturmayın; OAuth bağlantısını seçin.

### Bağlantı adımları

1. ChatGPT web sürümünde Plugins sayfasını açın: \`https://chatgpt.com/plugins\`.
2. Artı (+) düğmesinden Add custom MCP server seçin. Ad olarak Promats ERP yazın.
3. Connection / Server URL alanına \`https://panel.avrasyaotomotiv.net/api/mcp\` adresini girin. Kimlik doğrulamada OAuth seçin. Sunucunun dinamik istemci kaydını (DCR) kullanın; ChatGPT için OAuth Client ID veya bearer jetonu yapıştırmayın.
4. ChatGPT'nin risk uyarısını inceleyin ve Create as a plugin ile eklentiyi oluşturun. Eklentiyi hesabınıza veya çalışma alanınıza kurun.
5. OAuth yönlendirmesinde Promats paneline giriş yapın. Açılan bağlantı onayı ekranında istemcinin ChatGPT olduğunu kontrol edin. İhtiyacınız olan kapsamları ve süreyi seçip onaylayın. Yalnızca veri okumak için ERP ve görev okuma kapsamı yeterlidir.
6. ChatGPT'ye dönün. Yeni sohbette @ menüsünden kurduğunuz Promats ERP eklentisini seçin ve “Promats ERP bağlantısındaki kullanılabilir araçları göster” diye deneyin. Veri okuma denemesi için “Promats ERP'deki açık yazılım görevlerini listele” diyebilirsiniz.
7. Bağlantıyı yönetmek veya iptal etmek için \`/admin/promats-mcp\` sayfasındaki ChatGPT bağlantısını ve son kullanım bilgisini kontrol edin. İptal edilen veya süresi dolan bağlantı yeniden onay gerektirir.

### Yetki ve sorun giderme

- Okuma kapsamı ürün, sipariş, stok, üretim emri ve yazılım görevlerini açar. Yazılım görevi kapsamı görev açma, yorum ve durum değişikliği için önce önizleme, sonra açık onay ister; ERP verilerini yazma yetkisi vermez.
- ChatGPT'de özel MCP ekleme seçeneği görünmüyorsa hesap/çalışma alanı izinlerini kontrol edin. OAuth ekranı açılmazsa sunucu adresinin \`/api/mcp\` ile bittiğini ve OAuth seçildiğini doğrulayın.
- Bağlantı Promats Bağlantıları listesinde görünse bile ChatGPT'de eklentiyi kurup @ menüsünden seçmeden sohbetin onu kullandığı varsayılmamalıdır.
- OpenAI resmi kurulum rehberi: \`https://developers.openai.com/api/docs/guides/custom-mcp-server\`.
`;

export const dynamic = "force-dynamic";

async function resolveDocsPath(): Promise<string | null> {
  const candidates = [
    path.join(process.cwd(), "..", "docs", DOC_FILENAME),
    path.join(process.cwd(), "docs", DOC_FILENAME),
    path.join(process.cwd(), "public", "docs", DOC_FILENAME),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  // Sunucuda docs/ dizini deploy edilmemiş olabilir; bulunamadıysa null dön.
  return null;
}

export default async function Page() {
  // Server Component: dosya okunamazsa TÜM RSC render'ı çökertmemeli.
  // (Canlıda /var/www/paspas/docs/ yok → eski hali "Server Components render"
  //  hatası veriyordu.) Bulunamazsa boş dökümantasyon ile zarifçe düş.
  try {
    const docsPath = await resolveDocsPath();
    if (!docsPath) {
      return <AdminDocsClient sections={parseAdminDocumentation(CHATGPT_MCP_GUIDE)} updatedAt={new Date().toISOString()} />;
    }
    const [markdown, fileStat] = await Promise.all([readFile(docsPath, "utf8"), stat(docsPath)]);
    const sections = parseAdminDocumentation(`${CHATGPT_MCP_GUIDE}\n${markdown}`);
    return <AdminDocsClient sections={sections} updatedAt={fileStat.mtime.toISOString()} />;
  } catch {
    return <AdminDocsClient sections={parseAdminDocumentation(CHATGPT_MCP_GUIDE)} updatedAt={new Date().toISOString()} />;
  }
}
