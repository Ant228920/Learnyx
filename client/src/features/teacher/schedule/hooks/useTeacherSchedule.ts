import { useState, useEffect, useCallback } from 'react';
import { teacherApi, extractErrorMessage } from '../../../../services/api';
import { showError } from '../../../../utils/toast';
import type { SlotsByDay, SlotItem } from '../types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
}

function dayOf(iso: string): number {
  return new Date(iso).getDate();
}

export function useTeacherSchedule() {
  const [slotsByDay, setSlotsByDay] = useState<SlotsByDay>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildMap = useCallback((rawSlots: Awaited<ReturnType<typeof teacherApi.getSlots>>) => {
    const map: SlotsByDay = {};
    for (const s of rawSlots) {
      const day = dayOf(s.start_time);
      const item: SlotItem = {
        id: s.id,
        time: `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`,
        is_booked: s.is_booked,
        start_time: s.start_time,
        end_time: s.end_time,
      };
      if (!map[day]) map[day] = [];
      map[day].push(item);
    }
    return map;
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await teacherApi.getSlots();
      setSlotsByDay(buildMap(raw));
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [buildMap]);

  useEffect(() => { void fetch(); }, [fetch]);

  const createSlot = useCallback(async (startIso: string, endIso: string) => {
    try {
      const slot = await teacherApi.createSlot(startIso, endIso);
      const day = dayOf(slot.start_time);
      const item: SlotItem = {
        id: slot.id,
        time: `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`,
        is_booked: slot.is_booked,
        start_time: slot.start_time,
        end_time: slot.end_time,
      };
      setSlotsByDay(prev => ({ ...prev, [day]: [...(prev[day] ?? []), item] }));
    } catch (e) { showError('Помилка створення слоту: ' + extractErrorMessage(e)); throw e; }
  }, []);

  const deleteSlot = useCallback(async (slotId: number) => {
    try {
      await teacherApi.deleteSlot(slotId);
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

  return { slotsByDay, loading, error, refetch: fetch, createSlot, deleteSlot };
}
