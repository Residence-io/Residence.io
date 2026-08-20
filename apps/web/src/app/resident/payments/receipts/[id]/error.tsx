'use client';

import { PageError } from '@/components/ui/page-error';

export default function Error({ reset }: { reset: () => void }) {
  return <PageError reset={reset} />;
}
