import { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { SubNav } from '@/components/ui/sub-nav';

export const metadata: Metadata = {
  title: 'Security & Gate | Residence.io',
};

const navItems = [
  { label: 'Visitors', href: '/admin/security/visitors' },
  { label: 'Deliveries', href: '/admin/security/deliveries' },
  { label: 'Vehicles', href: '/admin/security/vehicles' },
  { label: 'Parking', href: '/admin/security/parking' },
];

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Security & Gate"
        description="Manage physical access, visitors, parcels, and vehicles."
      />
      <SubNav items={navItems} />
      <div>{children}</div>
    </div>
  );
}
