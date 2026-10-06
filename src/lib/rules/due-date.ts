import { LOAN_DAYS } from '@/config/library-rules';

import { addDays, CalendarDate } from './dates';

export const getDueDate = (issuedOn: CalendarDate): CalendarDate =>
  addDays(issuedOn, LOAN_DAYS);
