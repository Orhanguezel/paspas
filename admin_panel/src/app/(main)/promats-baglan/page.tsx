import BaglanOnay from './onay-client';

export default async function Page({ searchParams }: { searchParams: Promise<{ istek?: string }> }) {
  const { istek } = await searchParams;
  return <BaglanOnay istek={typeof istek === 'string' ? istek : ''} />;
}
