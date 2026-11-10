import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/admin/uretim-ozeti?tab=vardiya');
}
