import SatinAlmaClient from './_components/satin-alma-client';

interface PageProps {
  searchParams: Promise<{ tedarikciId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { tedarikciId } = await searchParams;
  return <SatinAlmaClient initialTedarikciId={tedarikciId} />;
}
