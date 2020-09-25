
/*!
 * mi-cron
 *
 * A microscopic parser for standard cron expressions.
 *
 * Copyright (c) 2020-present, cheap glitch
 * This software is distributed under the ISC license
 */

interface CronSchedule {
	readonly minutes:  number[],
	readonly hours:    number[],
	readonly days:     number[],
	readonly months:   number[],
	readonly weekDays: number[],
	[prop: string]:    number[],
}

interface CronDate {
	minutes:           number,
	hours:             number,
	days:              number,
	months:            number,
	years:             number,
	[prop: string]:    number,
}

const shorthands: { [index: string]: string } = {
	'@hourly':   '0 * * * *',
	'@daily':    '0 0 * * *',
	'@weekly':   '0 0 * * 6',
	'@monthly':  '0 0 1 * *',
	'@yearly':   '0 0 1 1 *',
	'@annually': '0 0 1 1 *',
};

// Return a schedule as a collection of numerical arrays, or `null` if the cron expression is deemed invalid
export function parseCron(line: string): CronSchedule | null {
	const fields = line.trim().split(/\s+/);

	if (fields.length == 1) {
		return (fields[0] in shorthands) ? parseCron(shorthands[fields[0]]) : null;
	}

	if (fields.length == 5) {
		let schedule = null;

		try {
			schedule = {
				minutes:  parseField(fields[0], 0, 59),
				hours:    parseField(fields[1], 0, 23),
				days:     parseField(fields[2], 1, 31),
				months:   parseField(fields[3], 1, 12, ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
				weekDays: parseField(fields[4], 0,  6, ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
			};
		} catch {
			return null;
		}

		return schedule;
	}

	return null;
}

function parseField(field: string, min: number, max: number, aliases: string[] = []): number[] | null {
	// Parse every item of the comma-separated list, merge the values and remove duplicates
	const values = Array.from(new Set(field.split(',').flatMap(item => {
		const [exp, stepStr = '1'] = item.split('/');

		const step = parseInt(stepStr, 10);
		if (Number.isNaN(step)) {
			throw Error();
		}

		if (exp == '*') {
			return range(min, max, step);
		}

		const matches = exp.match(rangePattern);
		if (!matches) {
			throw Error();
		}
		const start = parseRangeBoundary(matches[1], min, max, aliases);
		const stop  = parseRangeBoundary(matches[2], min, max, aliases);

		// Invalid range
		if (start === null || (stop !== null && stop < start)) {
			throw Error();
		}

		return stop == null ? [start] : range(start, stop, step);
	})));

	// Sort the array numerically
	// The sort function is needed to avoid the default conversion into strings (which would give e.g. [10, 2])
	values.sort((a, b) => a - b);

	return values;
}

const bound = '(\\d{1,2}|[a-z]{3})'
const rangePattern = new RegExp(`^${bound}(?:-${bound})?$`, 'i');

function parseRangeBoundary(bound: string, min: number, max: number, aliases: string[] = []): number | null {
	if (!bound) {
		return null;
	}

	if (aliases.includes(bound)) {
		return aliases.indexOf(bound);
	}

	const value = parseInt(bound, 10);

	return (!Number.isNaN(value) && min <= value && value <= max) ? value : null;
}

// Return the closest date and time matched by the cron schedule (or `null` if the schedule is deemed invalid)
parseCron.nextDate = function(schedule: string | CronSchedule, from = new Date()): Date {
	schedule = typeof schedule == 'string' ? parseCron(schedule) : schedule;
	if (schedule === null) {
		return null;
	}

	const date: CronDate = {
		minutes: from.getUTCMinutes(),
		hours:   from.getUTCHours(),
		// Days are numbered from 1 to 31...
		days:    from.getUTCDate(),
		// ...but for whatever reason months are numbered from 0 to 11
		months:  from.getUTCMonth() + 1,
		years:   from.getUTCFullYear(),
	};

	// Find the next suitable minute and hour
	findNextTime(schedule, date, 'minutes', 'hours');
	findNextTime(schedule, date, 'hours',   'days');

	// Find the next suitable day and month
	do {
		findNextTime(schedule, date, 'days',   'months');
		findNextTime(schedule, date, 'months', 'years');
	// Ensure the selected day is one of the possible weekdays
	} while (!schedule.weekDays.includes(cronDateToUTC(date).getUTCDay()) && ++date.days);

	return cronDateToUTC(date);
}

// Try to find the next incoming time
function findNextTime(schedule: CronSchedule, date: CronDate, elem: string, nextElem: string): void {
	// Perform a strict greater-than check for the minutes only
	// as we always consider the current minute to be passed already
	date[elem] = schedule[elem].find(elem == 'minutes' ? (time => time > date[elem]) : (time => time >= date[elem]));

	if (date[elem] === undefined) {
		// If no fitting time is found, restart from the beginning of the list and increment the next date element
		date[elem] = schedule[elem][0],
		// We can just increment without worrying about boundaries
		// JavaScript will just fix incorrect dates magically \o/
		date[nextElem]++;
	}
}

function cronDateToUTC(date: CronDate): Date {
	return new Date(Date.UTC(date.years, date.months - 1, date.days, date.hours, date.minutes));
}

function range(start: number, stop: number, step = 1): number[] | null {
	return Array.from({ length: Math.floor((stop - start) / step) + 1 }).map((_, i) => start + i * step);
}
