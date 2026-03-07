import TedarikciDetayClient from "./_components/tedarikci-detay-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TedarikciDetayClient id={id} />;
}
