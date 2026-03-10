import MusteriDetayClient from "./_components/musteri-detay-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <MusteriDetayClient id={id} />;
}
