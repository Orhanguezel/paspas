import UretimEmriDetayClient from './_components/uretim-emri-detay-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <UretimEmriDetayClient id={id} />;
}
