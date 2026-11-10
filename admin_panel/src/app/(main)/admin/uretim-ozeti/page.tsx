import UretimOzetiClient from './_components/uretim-ozeti-client';

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  return <UretimOzetiClient initialTab={params.tab === 'vardiya' ? 'vardiya' : 'uretim'} />;
}
