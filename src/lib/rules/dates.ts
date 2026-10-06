import { APP_TIME_ZONE } from '@/config/library-rules';

/** A calendar date in the form YYYY-MM-DD. */
export type CalendarDate = string;

type ParsedCalendarDate = {
  year: number;
  month: number;
  day: number;
};

export const parseCalendarDate = (date: CalendarDate): ParsedCalendarDate => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const value = new Date(Date.UTC(year, month - 1, day));

  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }

  return { year, month, day };
};

export const toCalendarDate = (
  instant: Date,
  timeZone: string = APP_TIME_ZONE,
): CalendarDate => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

export const addDays = (date: CalendarDate, days: number): CalendarDate => {
  const { year, month, day } = parseCalendarDate(date);

  if (!Number.isInteger(days)) {
    throw new RangeError(`Days must be an integer: ${days}`);
  }

  const value = new Date(Date.UTC(year, month - 1, day + days));

  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}-${String(value.getUTCDate()).padStart(2, '0')}`;
};

export const diffInDays = (from: CalendarDate, to: CalendarDate): number => {
  const fromParts = parseCalendarDate(from);
  const toParts = parseCalendarDate(to);
  const fromTime = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day);
  const toTime = Date.UTC(toParts.year, toParts.month - 1, toParts.day);

  return (toTime - fromTime) / (24 * 60 * 60 * 1000);
};
