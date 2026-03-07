import SatinAlmaDetayClient from './_components/satin-alma-detay-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <SatinAlmaDetayClient id={id} />;
}
