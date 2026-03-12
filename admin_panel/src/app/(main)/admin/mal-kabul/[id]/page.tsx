import MalKabulDetayClient from './_components/mal-kabul-detay-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <MalKabulDetayClient id={id} />;
}
