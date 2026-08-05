const complaintTransitions: Record<string, string[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: [
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_FOR_RESIDENT',
    'RESOLVED',
    'REJECTED',
  ],
  ASSIGNED: ['IN_PROGRESS', 'WAITING_FOR_RESIDENT', 'RESOLVED'],
  IN_PROGRESS: ['WAITING_FOR_RESIDENT', 'RESOLVED'],
  WAITING_FOR_RESIDENT: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  REJECTED: ['REOPENED', 'CLOSED'],
  REOPENED: ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'],
  CLOSED: ['REOPENED'],
};
const maintenanceTransitions: Record<string, string[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['VISIT_SCHEDULED', 'WORK_IN_PROGRESS', 'CANCELLED'],
  VISIT_SCHEDULED: ['WORK_IN_PROGRESS', 'CANCELLED'],
  WORK_IN_PROGRESS: ['AWAITING_PARTS', 'WAITING_FOR_RESIDENT', 'COMPLETED'],
  AWAITING_PARTS: ['WORK_IN_PROGRESS', 'COMPLETED'],
  WAITING_FOR_RESIDENT: ['WORK_IN_PROGRESS', 'COMPLETED'],
  COMPLETED: ['CLOSED', 'REOPENED'],
  REJECTED: ['REOPENED', 'CLOSED'],
  CANCELLED: ['REOPENED', 'CLOSED'],
  REOPENED: ['UNDER_REVIEW', 'APPROVED', 'ASSIGNED'],
  CLOSED: ['REOPENED'],
};

export function canTransition(
  type: 'complaint' | 'maintenance',
  from: string,
  to: string,
) {
  return (
    (type === 'complaint' ? complaintTransitions : maintenanceTransitions)[
      from
    ]?.includes(to) ?? false
  );
}
export function slaTargets(
  createdAt: Date,
  responseMinutes: number,
  resolutionMinutes: number,
) {
  return {
    targetResponseAt: new Date(createdAt.getTime() + responseMinutes * 60_000),
    targetResolutionAt: new Date(
      createdAt.getTime() + resolutionMinutes * 60_000,
    ),
  };
}
export function withinReopenWindow(completedAt: Date, now: Date, days = 14) {
  return now.getTime() <= completedAt.getTime() + days * 86_400_000;
}
export function safeDisclosure(audience: 'resident' | 'worker') {
  return audience === 'resident'
    ? [
        'workerName',
        'workerCategory',
        'workerPhone',
        'appointment',
        'ticketNumber',
      ]
    : [
        'residentName',
        'block',
        'unit',
        'residentPhone',
        'issueSummary',
        'appointment',
        'accessInstructions',
        'ticketNumber',
      ];
}
