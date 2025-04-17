export const all = {
	minutes: Array.from({ length: 60 }).map((_, i) => i),
	hours: Array.from({ length: 24 }).map((_, i) => i),
	days: Array.from({ length: 31 }).map((_, i) => i + 1),
	months: Array.from({ length: 12 }).map((_, i) => i + 1),
	weekDays: Array.from({ length: 7 }).map((_, i) => i),
};
