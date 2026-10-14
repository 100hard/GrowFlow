import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInitialChecklist, recalculateChecklistTimes, calculateOffsetTime } from '../src/lib/checklist.ts';

describe('GrowthFlow Time-Relative Checklist Unit Tests', () => {
  it('AC-3.1: Calculates relative operational milestone times for 14:00 start', () => {
    const checklist = generateInitialChecklist('14:00');

    assert.equal(checklist.length, 3);
    assert.equal(checklist[0].offsetMinutes, -30);
    assert.equal(checklist[0].timeString, '13:30');

    assert.equal(checklist[1].offsetMinutes, -15);
    assert.equal(checklist[1].timeString, '13:45');

    assert.equal(checklist[2].offsetMinutes, 0);
    assert.equal(checklist[2].timeString, '14:00');
  });

  it('AC-3.2: Automatically recalculates checklist times when Elena updates start time to 15:30', () => {
    const checklist = generateInitialChecklist('14:00');
    checklist[0].isCompleted = true; // Elena completed task 0

    const updated = recalculateChecklistTimes(checklist, '15:30');

    assert.equal(updated[0].timeString, '15:00');
    assert.equal(updated[0].isCompleted, true); // preserves completion status

    assert.equal(updated[1].timeString, '15:15');
    assert.equal(updated[2].timeString, '15:30');
  });

  it('Calculates time offsets across hour boundaries correctly', () => {
    assert.equal(calculateOffsetTime('13:10', -30), '12:40');
    assert.equal(calculateOffsetTime('00:15', -30), '23:45');
    assert.equal(calculateOffsetTime('12:00', 0), '12:00');
  });
});
