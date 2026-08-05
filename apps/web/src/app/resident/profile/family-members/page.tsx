import Link from 'next/link';
import {
  FamilyMemberManager,
  type FamilyMember,
} from '@/components/residents/family-member-manager';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { getCurrentUser, serverApi } from '@/lib/api.server';

export default async function ResidentFamilyMembersPage() {
  const [user, members] = await Promise.all([
    getCurrentUser(),
    serverApi<FamilyMember[]>('/residents/me/household-members'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Profile"
        title="Family Members"
        description="Add and maintain the family members linked to your own residence."
      />
      <Card>
        <FamilyMemberManager
          csrfToken={user?.csrfToken ?? ''}
          initialMembers={members}
        />
      </Card>
      <Link className="font-semibold text-blue-700" href="/resident/profile">
        ← Back to My Profile
      </Link>
    </div>
  );
}
