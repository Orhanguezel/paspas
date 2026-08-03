import TeklifEditorClient from './_components/teklif-editor-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <TeklifEditorClient id={id} />;
}
