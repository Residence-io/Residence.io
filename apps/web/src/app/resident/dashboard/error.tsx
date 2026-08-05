'use client';

import { DashboardError } from '@/components/dashboard/dashboard-error';

export default function Error({ reset }: { reset: () => void }) {
  return <DashboardError reset={reset} />;
}
