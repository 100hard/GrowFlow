/**
 * GrowthFlow Time-Relative Operational Store & Service Launch Checklist
 *
 * Computes recommended operational milestones relative to a configurable campaign launch
 * or slump start time (T0). Supports local foot-traffic retail, service-area businesses,
 * and online operations.
 */

import type { ChecklistMilestone, BusinessReach, MarketingObjectiveType } from './types.ts';

export function generateInitialChecklist(
  startTimeStr: string = '14:00',
  reach: BusinessReach = 'local_foot_traffic',
  objective: MarketingObjectiveType = 'fill_capacity'
): ChecklistMilestone[] {
  if (reach === 'service_area') {
    return [
      {
        id: 'task-outreach',
        offsetMinutes: -60,
        timeString: calculateOffsetTime(startTimeStr, -60),
        title: 'Send direct outreach message to neighborhood contact list',
        description: 'Broadcast the promotional package and booking link via SMS/WhatsApp to local clients.',
        isCompleted: false,
      },
      {
        id: 'task-social',
        offsetMinutes: -30,
        timeString: calculateOffsetTime(startTimeStr, -30),
        title: 'Publish community social media post',
        description: 'Post high-contrast before/after photo and appointment window details in local community groups.',
        isCompleted: false,
      },
      {
        id: 'task-ops',
        offsetMinutes: 0,
        timeString: calculateOffsetTime(startTimeStr, 0),
        title: 'Prepare service equipment & review route bookings',
        description: 'Verify equipment inventory, confirm route schedule, and ensure booking calendar is open.',
        isCompleted: false,
      },
    ];
  }

  // Local foot-traffic retail or hospitality
  return [
    {
      id: 'task-display',
      offsetMinutes: -30,
      timeString: calculateOffsetTime(startTimeStr, -30),
      title: 'Update & place sidewalk / counter display sign',
      description: 'Write the 4-word hook and promotional deal clearly on the front display facing customer foot traffic.',
      isCompleted: false,
    },
    {
      id: 'task-social',
      offsetMinutes: -15,
      timeString: calculateOffsetTime(startTimeStr, -15),
      title: 'Publish social media post / story',
      description: 'Post the prepared caption with a high-contrast photo or graphic of the featured promotion.',
      isCompleted: false,
    },
    {
      id: 'task-team',
      offsetMinutes: 0,
      timeString: calculateOffsetTime(startTimeStr, 0),
      title: 'Brief on-duty staff & verify register pricing',
      description: 'Confirm promotional terms, bundle components, and cutoff timing with the team on shift.',
      isCompleted: false,
    },
  ];
}

export function recalculateChecklistTimes(
  milestones: ChecklistMilestone[],
  newStartTimeStr: string
): ChecklistMilestone[] {
  return milestones.map((m) => ({
    ...m,
    timeString: calculateOffsetTime(newStartTimeStr, m.offsetMinutes),
  }));
}

export function calculateOffsetTime(timeStr: string, offsetMinutes: number): string {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;

  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const totalMinutes = hours * 60 + minutes + offsetMinutes;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  const newHours = Math.floor(normalizedMinutes / 60);
  const newMins = normalizedMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}
