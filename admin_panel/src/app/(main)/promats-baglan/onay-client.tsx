'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDecidePromatsOAuthMutation, useGetPromatsOAuthRequestQuery } from '@/integrations/endpoints/admin/promats_mcp.endpoints';

function errorInfo(error: unknown) {
  const e = error as { status?: number; data?: { message?: string; error?: string } } | undefined;
  return { status: typeof e?.status === 'number' ? e.status : undefined, message: e?.data?.message ?? e?.data?.error ?? '' };
}

export default function BaglanOnay({ istek }: { istek: string }) {
  const router = useRouter();
  const valid = /^[A-Za-z0-9_-]{43}$/.test(istek);
  const request = useGetPromatsOAuthRequestQuery(istek, { skip: !valid, refetchOnMountOrArgChange: true });
  const [decide, deciding] = useDecidePromatsOAuthMutation();
  const [scopes, setScopes] = useState<('okuma' | 'not')[]>(['okuma']);
  const [days, setDays] = useState(90);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const requestError = request.isError ? errorInfo(request.error) : null;
  useEffect(() => {
    if (requestError?.status === 401) router.replace(`/auth/login?next=${encodeURIComponent(`/promats-baglan?istek=${istek}`)}`);
  }, [requestError?.status, istek, router]);

  async function submit(approve: boolean) {
    setError('');
    if (approve && !scopes.length) { setError('En az bir kapsam seçin.'); return; }
    try {
      const response = await decide({ istek, onay: approve, kapsamlar: scopes, gun: days }).unwrap();
      setRedirecting(true);
      window.location.assign(response.yonlendir);
    } catch (cause) {
      const info = errorInfo(cause);
      setError(info.status === 410 ? 'Bağlantı isteğinin süresi doldu; asistan üzerinden yeniden başlatın.'
        : info.message.includes('tarayici') ? 'Bu istek başka bir tarayıcıda başlatılmış.'
        : 'Bağlantı onaylanamadı. Panel oturumunuzu ve isteği kontrol edin.');
    }
  }

  return <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4"><Card className="w-full max-w-lg min-w-0">
    <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Promats MCP bağlantı onayı</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      {!valid ? <p role="alert" className="text-sm text-destructive">Bağlantı isteği eksik veya bozuk. Asistan üzerinden yeniden başlatın.</p>
        : request.isLoading || requestError?.status === 401 ? <p className="text-sm text-muted-foreground">Bağlantı isteği denetleniyor…</p>
        : requestError ? <p role="alert" className="text-sm text-destructive">İstek geçersiz veya süresi dolmuş. Asistan üzerinden yeniden başlatın.</p>
        : redirecting ? <p className="text-sm text-muted-foreground">{request.data?.istemci} uygulamasına dönülüyor…</p>
        : <><p className="text-sm"><strong>{request.data?.istemci}</strong>, Promats yazılım görevlerinize seçtiğiniz kapsamda erişmek istiyor. Bağlantıyı Promats Bağlantıları sayfasından istediğiniz zaman iptal edebilirsiniz.</p>
          <p className="text-xs text-muted-foreground">Okuma kapsamı ürün, sipariş, stok, üretim emri ve yazılım görevlerini açar. Görev yazma kapsamı değişiklikleri otomatik uygulamaz; önce önizleme, sonra açık onay ister.</p>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">Kapsamlar</legend>{request.data?.kapsamSecenekleri.map((scope) => <label key={scope.kod} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={scopes.includes(scope.kod)} onChange={(event) => setScopes((current) => event.target.checked ? [...current, scope.kod] : current.filter((value) => value !== scope.kod))} /><span><strong>{scope.ad}</strong><span className="block text-xs text-muted-foreground">{scope.aciklama}</span></span></label>)}</fieldset>
          <div className="space-y-1"><label htmlFor="oauth-days" className="text-sm font-medium">Bağlantı süresi</label><select id="oauth-days" className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={days} onChange={(event) => setDays(Number(event.target.value))}>{(request.data?.sureler ?? [30, 90, 180, 365]).map((value) => <option key={value} value={value}>{value} gün</option>)}</select></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2"><Button disabled={deciding.isLoading} onClick={() => void submit(true)}>Onayla ve bağlan</Button><Button variant="outline" disabled={deciding.isLoading} onClick={() => void submit(false)}>Reddet</Button></div>
        </>}
    </CardContent>
  </Card></div>;
}
