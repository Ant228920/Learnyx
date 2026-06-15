import { useState, useEffect, useCallback } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
import type { SlotsByDay, SlotItem } from '../types';

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function dayOf(iso: string): number {
  return parseInt(iso.slice(8, 10), 10);
}

export function useTeacherSchedule() {
  const [slotsByDay, setSlotsByDay] = useState<SlotsByDay>({});
  const [allSlots, setAllSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildItems = useCallback((rawSlots: Awaited<ReturnType<typeof teacherApi.getSlots>>) => {
    const items: SlotItem[] = rawSlots.map(s => {
      const r = s as Record<string, unknown>;
      return {
        id: s.id,
        time: `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
        is_booked: s.status === 'booked',
        start_time: s.start_time,
        end_time: s.end_time,
        lesson_status: (r.lesson_status as string | null) ?? null,
        lesson_student_name: (r.lesson_student_name as string | null) ?? null,
      };
    });
    const map: SlotsByDay = {};
    for (const item of items) {
      const day = dayOf(item.start_time);
      if (!map[day]) map[day] = [];
      map[day].push(item);
    }
    return { items, map };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await teacherApi.getSlots();
      const { items, map } = buildItems(raw);
      setAllSlots(items);
      setSlotsByDay(map);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [buildItems]);

  useEffect(() => { void fetch(); }, [fetch]);

  const createSlot = useCallback(async (startIso: string, endIso: string) => {
    try {
      const slot = await teacherApi.createSlot(startIso, endIso);
      const item: SlotItem = {
        id: slot.id,
        time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
        is_booked: slot.status === 'booked',
        start_time: slot.start_time,
        end_time: slot.end_time,
      };
      const day = dayOf(item.start_time);
      setAllSlots(prev => [...prev, item]);
      setSlotsByDay(prev => ({ ...prev, [day]: [...(prev[day] ?? []), item] }));
    } catch (e) { showError('Помилка створення слоту: ' + extractErrorMessage(e)); throw e; }
  }, []);

  const deleteSlot = useCallback(async (slotId: number) => {
    try {
      await teacherApi.deleteSlot(slotId);
      setAllSlots(prev => prev.filter(s => s.id !== slotId));
      setSlotsByDay(prev => {
        const next = { ...prev };
        for (const day of Object.keys(next)) {
          next[+day] = next[+day].filter(s => s.id !== slotId);
          if (next[+day].length === 0) delete next[+day];
        }
        return next;
      });
    } catch (e) { showError('Помилка видалення слоту: ' + extractErrorMessage(e)); throw e; }
  }, []);

  return { slotsByDay, allSlots, loading, error, refetch: fetch, createSlot, deleteSlot };
}
