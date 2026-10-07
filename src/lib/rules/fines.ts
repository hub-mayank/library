import { FINE_PER_DAY_INR } from '@/config/library-rules';

import { CalendarDate, diffInDays } from './dates';

export const calculateDaysLate = (
  dueDate: CalendarDate,
  returnedOrToday: CalendarDate,
): number => Math.max(0, diffInDays(dueDate, returnedOrToday));

export const calculateFine = (
  dueDate: CalendarDate,
  returnedOrToday: CalendarDate,
): number => calculateDaysLate(dueDate, returnedOrToday) * FINE_PER_DAY_INR;
