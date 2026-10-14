/**
 * GrowthFlow Time-Relative Staff Operational Checklist
 *
 * Computes recommended store milestones relative to a configurable campaign start time (T0).
 * All milestones are fully editable by the business owner.
 */

import type { ChecklistMilestone } from './types.ts';

export function generateInitialChecklist(startTimeStr: string = '14:00'): ChecklistMilestone[] {
  return [
    {
      id: 'task-chalkboard',
      offsetMinutes: -30,
      timeString: calculateOffsetTime(startTimeStr, -30),
      title: 'Update & place sidewalk chalkboard sign',
      description: 'Write the 4-word hook and bundle price clearly on the front chalkboard facing street foot traffic.',
      isCompleted: false,
    },
    {
      id: 'task-social',
      offsetMinutes: -15,
      timeString: calculateOffsetTime(startTimeStr, -15),
      title: 'Publish Instagram post / story',
      description: 'Post the prepared caption with a high-contrast photo of the freshly prepared bundle.',
      isCompleted: false,
    },
    {
      id: 'task-barista',
      offsetMinutes: 0,
      timeString: calculateOffsetTime(startTimeStr, 0),
      title: 'Brief on-duty barista & setup POS shortcut',
      description: 'Confirm the promotional price, bundle items, and end time with the barista on shift.',
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
