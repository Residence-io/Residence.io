'use client';

import { DashboardErrorMessage } from './dashboard-ui';

export function DashboardError({ reset }: { reset: () => void }) {
  return <DashboardErrorMessage reset={reset} />;
}
