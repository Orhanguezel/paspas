import SatinAlmaClient from './_components/satin-alma-client';
import DepoMalKabulClient from '../mal-kabul/_components/depo-mal-kabul-client';

interface PageProps {
  searchParams: Promise<{ tedarikciId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { tedarikciId } = await searchParams;
  return <><div className="md:hidden"><DepoMalKabulClient /></div><div className="hidden md:block"><SatinAlmaClient initialTedarikciId={tedarikciId} /></div></>;
}
