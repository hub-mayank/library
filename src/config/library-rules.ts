// This is the single source of truth for business rules.
export const MAX_ACTIVE_LOANS = 3 as const;
export const LOAN_DAYS = 14 as const;
export const FINE_PER_DAY_INR = 5 as const;
// The library's local timezone, used to decide what "today" means.
export const APP_TIME_ZONE = 'Asia/Kolkata' as const;
