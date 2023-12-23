import { parseCron } from '../src/index';
import { all } from './helpers';

describe('parseCron', () => {

	it('returns `undefined` when given an invalid cron expression', () => { // {{{

		// Not enough fields
		expect(parseCron('')).toBeUndefined();
		expect(parseCron('* * *')).toBeUndefined();
		expect(parseCron('30 * 10-22')).toBeUndefined();

		// Too much fields
		expect(parseCron('* * * * * *')).toBeUndefined();
		expect(parseCron('0 0 1 1 * 3000')).toBeUndefined();

		// Unsupported syntax
		expect(parseCron('* * * * 5L')).toBeUndefined();
		expect(parseCron('* * * * 15W')).toBeUndefined();
		expect(parseCron('* * * * 5#3')).toBeUndefined();
		expect(parseCron('? ? * * *')).toBeUndefined();

		// Unsupported shorthand
		expect(parseCron('@reboot')).toBeUndefined();

		// Invalid syntax
		expect(parseCron('30- * * * *')).toBeUndefined();
		expect(parseCron('-30 * * * *')).toBeUndefined();

		// Invalid values
		expect(parseCron('a * * * *')).toBeUndefined();
		expect(parseCron('60 * * * *')).toBeUndefined();
		expect(parseCron('0,60 * * * *')).toBeUndefined();
		expect(parseCron('* 24 * * *')).toBeUndefined();
		expect(parseCron('* * 0 * *')).toBeUndefined();
		expect(parseCron('* * 32 * *')).toBeUndefined();
		expect(parseCron('* * * 0 *')).toBeUndefined();
		expect(parseCron('* * * 13 *')).toBeUndefined();
		expect(parseCron('* * * jan,febr *')).toBeUndefined();
		expect(parseCron('* * * * monday')).toBeUndefined();

		// Invalid ranges
		expect(parseCron('10-! * * * *')).toBeUndefined();
		expect(parseCron('30-0 * * * *')).toBeUndefined();
		expect(parseCron('* 0-100 * * *')).toBeUndefined();
		expect(parseCron('* 23-0 * * *')).toBeUndefined();
		expect(parseCron('* * * 12-4 *')).toBeUndefined();
		expect(parseCron('* * * dec-apr *')).toBeUndefined();

		// Invalid steps
		expect(parseCron('*/a * * * *')).toBeUndefined();

	}); // }}}

	it('parses standard cron expressions', () => { // {{{

		expect(parseCron('   * *   *\t*\t \t*')).toEqual({
			minutes:  all.minutes,
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		// The following examples are taken from <https://crontab.guru>
		expect(parseCron('5 0 * 8 *')).toEqual({
			minutes:  [5],
			hours:    [0],
			days:     all.days,
			months:   [8],
			weekDays: all.weekDays,
		});
		expect(parseCron('15 14 1 * *')).toEqual({
			minutes:  [15],
			hours:    [14],
			days:     [1],
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 22 * * 1-5')).toEqual({
			minutes:  [0],
			hours:    [22],
			days:     all.days,
			months:   all.months,
			weekDays: [1, 2, 3, 4, 5],
		});
		expect(parseCron('5 4 * * sun')).toEqual({
			minutes:  [5],
			hours:    [4],
			days:     all.days,
			months:   all.months,
			weekDays: [0],
		});
		expect(parseCron('5 4 * * SAT')).toEqual({
			minutes:  [5],
			hours:    [4],
			days:     all.days,
			months:   all.months,
			weekDays: [6],
		});
		expect(parseCron('0 4 8-14 * *')).toEqual({
			minutes:  [0],
			hours:    [4],
			days:     [8, 9, 10, 11, 12, 13, 14],
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 0 1,15 * 3')).toEqual({
			minutes:  [0],
			hours:    [0],
			days:     [1, 15],
			months:   all.months,
			weekDays: [3],
		});

	}); // }}}

	it('supports step values', () => { // {{{

		expect(parseCron('*/5 * * * *')).toEqual({
			minutes:  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('59 1-5 5-31/5 * 1')).toEqual({
			minutes:  [59],
			hours:    [1, 2, 3, 4, 5],
			days:     [5, 10, 15, 20, 25, 30],
			months:   all.months,
			weekDays: [1],
		});
		// The following examples are taken from <https://crontab.guru>
		expect(parseCron('23 0-20/2 * * *')).toEqual({
			minutes:  [23],
			hours:    [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 0,12 1 */2 *')).toEqual({
			minutes:  [0],
			hours:    [0, 12],
			days:     [1],
			months:   [1, 3, 5, 7, 9, 11],
			weekDays: all.weekDays,
		});
		// Test implicit ranges
		expect(parseCron('10/5 * * * *')).toEqual({
			minutes:  [10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 0 * * mon/2')).toEqual({
			minutes:  [0],
			hours:    [0],
			days:     all.days,
			months:   all.months,
			weekDays: [1, 3, 5],
		});

	}); // }}}

	it('supports most @-shorthands', () => { // {{{

		expect(parseCron('@hourly')).toEqual({
			minutes:  [0],
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('@daily')).toEqual({
			minutes:  [0],
			hours:    [0],
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('@monthly')).toEqual({
			minutes:  [0],
			hours:    [0],
			days:     [1],
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('@yearly')).toEqual({
			minutes:  [0],
			hours:    [0],
			days:     [1],
			months:   [1],
			weekDays: all.weekDays,
		});
		expect(parseCron('@annually')).toEqual({
			minutes:  [0],
			hours:    [0],
			days:     [1],
			months:   [1],
			weekDays: all.weekDays,
		});

	}); // }}}

});

describe('parseCron.nextDate', () => {

	it('returns `undefined` when given an invalid cron expression', () => { // {{{

		expect(parseCron.nextDate('* * *')).toBeUndefined();
		expect(parseCron.nextDate('0 0 1 1 * 3000')).toBeUndefined();
		expect(parseCron.nextDate('* * * * 5#3')).toBeUndefined();
		expect(parseCron.nextDate('? ? * * *')).toBeUndefined();
		expect(parseCron.nextDate('@reboot')).toBeUndefined();
		expect(parseCron.nextDate('30- * * * *')).toBeUndefined();
		expect(parseCron.nextDate('60 * * * *')).toBeUndefined();
		expect(parseCron.nextDate('* * * 13 *')).toBeUndefined();
		expect(parseCron.nextDate('* * * * monday')).toBeUndefined();
		expect(parseCron.nextDate('* 0-100 * * *')).toBeUndefined();
		expect(parseCron.nextDate('* 23-0 * * *')).toBeUndefined();
		expect(parseCron.nextDate('*/a * * * *')).toBeUndefined();

	}); // }}}

	it('gives the correct next scheduled date', () => { // {{{

		expect(parseCron.nextDate('* * * * *',       new Date('01 Jan 2020 00:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Jan 2020 00:01:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 * * * *',       new Date('01 Jan 2020 00:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Jan 2020 01:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('*/5 * * * *',     new Date('01 Jan 2020 00:01:00 GMT'))?.toUTCString()).toBe(new Date('01 Jan 2020 00:05:00 GMT').toUTCString());
		expect(parseCron.nextDate('* * 5-24 * *',    new Date('12 Jan 2020 00:00:00 GMT'))?.toUTCString()).toBe(new Date('12 Jan 2020 00:01:00 GMT').toUTCString());

		// Examples from <https://crontab.guru>
		expect(parseCron.nextDate('5 0 * 8 *',       new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Aug 2021 00:05:00 GMT').toUTCString());
		expect(parseCron.nextDate('15 14 1 * *',     new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Oct 2020 14:15:00 GMT').toUTCString());
		expect(parseCron.nextDate('23 0-20/2 * * *', new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('25 Sep 2020 12:23:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 0,12 1 */2 *',  new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Nov 2020 00:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 4 8-14 * *',    new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('08 Oct 2020 04:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('@weekly',         new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('27 Sep 2020 00:00:00 GMT').toUTCString());

	}); // }}}

	it('supports week days', () => { // {{{

		expect(parseCron.nextDate('* * * * mon',     new Date('01 Jan 2020 00:00:00 GMT'))?.toUTCString()).toBe(new Date('06 Jan 2020 00:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('* * 1 1 sun',     new Date('01 Jan 2020 00:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Jan 2023 00:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('5 4 * * sun',     new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('27 Sep 2020 04:05:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 22 * * 1-5',    new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('25 Sep 2020 22:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 0 1,15 * 3',    new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Sep 2021 00:00:00 GMT').toUTCString());

	}); // }}}

	it('works with cron schedule objects', () => { // {{{

		expect(parseCron.nextDate({
			minutes:  [5],
			hours:    [0],
			days:     all.days,
			months:   [8],
			weekDays: all.weekDays,
		}, new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Aug 2021 00:05:00 GMT').toUTCString());

		expect(parseCron.nextDate({
			minutes:  [15],
			hours:    [14],
			days:     [1],
			months:   all.months,
			weekDays: all.weekDays,
		}, new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('01 Oct 2020 14:15:00 GMT').toUTCString());

		expect(parseCron.nextDate({
			minutes:  [23],
			hours:    [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		}, new Date('25 Sep 2020 12:00:00 GMT'))?.toUTCString()).toBe(new Date('25 Sep 2020 12:23:00 GMT').toUTCString());

	}); // }}}

});
