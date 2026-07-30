import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// /profile temel hesap alanına yönlenir.
export default async function ProfileRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/me/settings`);
}
