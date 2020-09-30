
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
	'@weekly':   '0 0 * * 0',
	'@monthly':  '0 0 1 * *',
	'@yearly':   '0 0 1 1 *',
	'@annually': '0 0 1 1 *',
};

// Return a schedule as a collection of numerical arrays, or `undefined` if the cron expression is deemed invalid
export function parseCron(exp: string): CronSchedule | undefined {
	const fields = exp.trim().split(/\s+/);

	if (fields.length == 1) {
		return (fields[0] in shorthands) ? parseCron(shorthands[fields[0]]) : undefined;
	}

	if (fields.length == 5) {
		let schedule = undefined;

		try {
			schedule = {
				minutes:  parseField(fields[0], 0, 59),
				hours:    parseField(fields[1], 0, 23),
				days:     parseField(fields[2], 1, 31),
				months:   parseField(fields[3], 1, 12, ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
				weekDays: parseField(fields[4], 0,  6, ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
			};
		} catch {
			return undefined;
		}

		return schedule;
	}

	return undefined;
}

const boundary     = '(\\d{1,2}|[a-z]{3})'
const rangePattern = new RegExp(`^${boundary}(?:-${boundary})?$`, 'i');

function parseField(field: string, min: number, max: number, aliases: string[] = []): number[] {
	// Parse every item of the comma-separated list, merge the values and remove duplicates
	const values = Array.from(new Set(field.split(',').flatMap(item => {
		const [exp, stepStr = '1'] = item.split('/', 2);

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

		const [start, stop = item.includes('/') ? max : undefined] = matches.slice(1).map(match => {
			if (aliases.includes(match)) {
				return aliases.indexOf(match);
			}

			const value = parseInt(match, 10);

			return (!Number.isNaN(value) && min <= value && value <= max) ? value : undefined;
		});

		// Invalid range
		if (start === undefined || (stop !== undefined && stop < start)) {
			throw Error();
		}

		return stop == undefined ? [start] : range(start, stop, step);
	})));

	// Sort the array numerically
	// The sort function is needed to avoid the default conversion into strings (which would give e.g. [10, 2])
	values.sort((a, b) => a - b);

	return values;
}

// Return the closest date and time matched by the cron schedule, or `undefined` if the schedule is deemed invalid
parseCron.nextDate = function(exp: string | CronSchedule, from = new Date()): Date | undefined {
	const schedule = typeof exp == 'string' ? parseCron(exp) : exp;
	if (schedule === undefined) {
		return undefined;
	}

	const date: CronDate = {
		years:   from.getUTCFullYear(),
		// For whatever reason, UTC months are numbered from 0 to 11...
		months:  from.getUTCMonth() + 1,
		days:    from.getUTCDate(),
		hours:   from.getUTCHours(),
		// Always consider the current minute to be already passed
		minutes: from.getUTCMinutes() + 1,
	};
	const dials = Object.keys(date);

	for (let i=1; i<dials.length; i++) {
		const dial = dials[i];

		if (!schedule[dial].includes(date[dial])) {
			// Reset all the next dials
			dials.filter((_, j) => j > i).forEach(d => date[d] = schedule[d][0]);

			// Try to find the next incoming time
			const nextTime = schedule[dial].find(t => t >= date[dial]);

			if (nextTime !== undefined) {
				date[dial] = nextTime;
			// If no fitting time is found...
			} else {
				// ...restart from the beginning of the list...
				date[dial] = schedule[dial][0];

				// ...and increment the previous dial
				// NB: We can just increment without worrying about boundaries
				//     JavaScript will just fix incorrect dates magically \o/
				date[dials[i-1]]++;

				// Go back to the previous dial (unless we're at the months)
				i = (dial != 'months') ? (i - 2) : i;
			}
		}

		// Make sure the selected day is one of the possible weekdays
		if (dial == 'days' && !schedule.weekDays.includes(cronDateToUTC(date).getUTCDay())) {
			date.days++;
			date.hours   = schedule.hours[0];
			date.minutes = schedule.minutes[0];
			i = 1;
		}
	}

	return cronDateToUTC(date);
}

function cronDateToUTC(date: CronDate): Date {
	return new Date(Date.UTC(date.years, date.months - 1, date.days, date.hours, date.minutes));
}

function range(start: number, stop: number, step: number): number[] {
	return Array.from({ length: Math.floor((stop - start) / step) + 1 }).map((_, i) => start + i * step);
}
