import { redirect } from 'next/navigation';
import { roleDestination } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/api.server';

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? roleDestination(user) : '/login');
}
