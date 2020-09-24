
/*!
 * mi-cron
 *
 * A tiny parser for standard cron expressions.
 *
 * Copyright (c) 2020-present, cheap glitch
 * This software is distributed under ISC license
 */

interface CronSchedule {
	[index: string]: number[],
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

// Return the closest date and time matched by the cron schedule (or `null` if the schedule is deemed invalid)
// @TODO: take the week day into account
parseCron.nextDate = function(schedule: string | CronSchedule, from = new Date()): Date {
	schedule = typeof schedule == 'string' ? parseCron(schedule) : schedule;
	if (schedule === null) {
		return null;
	}

	const date: { [index: string]: number } = {
		minutes: from.getUTCMinutes(),
		hours:   from.getUTCHours(),
		days:    from.getUTCDate(),
		months:  from.getUTCMonth() + 1,
		years:   from.getUTCFullYear(),
	};
	const dateElems = Object.keys(date);

	// Loop over the date elements (excluding the year)
	for (const [elem, nextElem] of dateElems.slice(0, -1).map(e => [e, dateElems[dateElems.indexOf(e) + 1]])) {
		// Try to find the next incoming time
		// Perform a strict greater-than check for the minutes only as we always consider the current minute to be passed already
		date[elem] = schedule[elem].find(elem == 'minutes' ? (time => time > date[elem]) : (time => time >= date[elem]));

		// If none is found, restart from the beginning of the list and increment the next date element
		if (date[elem] === undefined) {
			date[elem] = schedule[elem][0],
			// We can just increment without worrying about boundaries
			// JavaScript will just fix incorrect dates magically \o/
			date[nextElem]++;
		}
	}

	return new Date(Date.UTC(date.years, date.months - 1, date.days, date.hours, date.minutes));
}

const bound = '(\\d{1,2}|[a-z]{3})'
const rangePattern = new RegExp(`^${bound}(?:-${bound})?$`, 'i');

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

function range(start: number, stop: number, step = 1): number[] | null {
	return Array.from({ length: Math.floor((stop - start) / step) + 1 }).map((_, i) => start + i * step);
}
