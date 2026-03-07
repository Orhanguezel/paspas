import SiparisDetayClient from '../_components/siparis-detay-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <SiparisDetayClient id={id} />;
}
