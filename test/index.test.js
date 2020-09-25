const expect        = require('chai').expect;
const { parseCron } = require('../index.js');

const all = {
	minutes:  Array.from({ length: 60 }).map((_, i) => i),
	hours:    Array.from({ length: 24 }).map((_, i) => i),
	days:     Array.from({ length: 31 }).map((_, i) => i + 1),
	months:   Array.from({ length: 12 }).map((_, i) => i + 1),
	weekDays: Array.from({ length:  7 }).map((_, i) => i),
};
const testDate = new Date(Date.UTC(2020, 0, 1, 0, 0));

describe("parseCron", () => {

	it("returns `undefined` when given an invalid cron expression", () => { // {{{
		// Not enough fields
		expect(parseCron('')).to.be.undefined;
		expect(parseCron('* * *')).to.be.undefined;
		expect(parseCron('30 * 10-22')).to.be.undefined;

		// Too much fields
		expect(parseCron('* * * * * *')).to.be.undefined;
		expect(parseCron('0 0 1 1 * 3000')).to.be.undefined;

		// Unsupported syntax
		expect(parseCron('* * * * 5L')).to.be.undefined;
		expect(parseCron('* * * * 15W')).to.be.undefined;
		expect(parseCron('* * * * 5#3')).to.be.undefined;
		expect(parseCron('? ? * * *')).to.be.undefined;

		// Unsupported shorthand
		expect(parseCron('@reboot')).to.be.undefined;

		// Invalid syntax
		expect(parseCron('30- * * * *')).to.be.undefined;
		expect(parseCron('-30 * * * *')).to.be.undefined;

		// Invalid values
		expect(parseCron('a * * * *')).to.be.undefined;
		expect(parseCron('60 * * * *')).to.be.undefined;
		expect(parseCron('0,60 * * * *')).to.be.undefined;
		expect(parseCron('* 24 * * *')).to.be.undefined;
		expect(parseCron('* * 0 * *')).to.be.undefined;
		expect(parseCron('* * 32 * *')).to.be.undefined;
		expect(parseCron('* * * 0 *')).to.be.undefined;
		expect(parseCron('* * * 13 *')).to.be.undefined;
		expect(parseCron('* * * jan,febr *')).to.be.undefined;
		expect(parseCron('* * * * monday')).to.be.undefined;

		// Invalid ranges
		expect(parseCron('10-! * * * *')).to.be.undefined;
		expect(parseCron('30-0 * * * *')).to.be.undefined;
		expect(parseCron('* 0-100 * * *')).to.be.undefined;
		expect(parseCron('* 23-0 * * *')).to.be.undefined;
		expect(parseCron('* * * 12-4 *')).to.be.undefined;
		expect(parseCron('* * * dec-apr *')).to.be.undefined;

		// Invalid steps
		expect(parseCron('*/a * * * *')).to.be.undefined;
	}); // }}}

	it("parses standard cron expressions", () => { // {{{
		expect(parseCron('   * *   *\t*\t \t*')).to.eql({
			minutes:  all.minutes,
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		// The following examples are taken from <https://crontab.guru>
		expect(parseCron('5 0 * 8 *')).to.eql({
			minutes:  [5],
			hours:    [0],
			days:     all.days,
			months:   [8],
			weekDays: all.weekDays,
		});
		expect(parseCron('15 14 1 * *')).to.eql({
			minutes:  [15],
			hours:    [14],
			days:     [1],
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 22 * * 1-5')).to.eql({
			minutes:  [0],
			hours:    [22],
			days:     all.days,
			months:   all.months,
			weekDays: [1, 2, 3, 4, 5],
		});
		expect(parseCron('5 4 * * sun')).to.eql({
			minutes:  [5],
			hours:    [4],
			days:     all.days,
			months:   all.months,
			weekDays: [0],
		});
		expect(parseCron('0 4 8-14 * *')).to.eql({
			minutes:  [0],
			hours:    [4],
			days:     [8, 9, 10, 11, 12, 13, 14],
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 0 1,15 * 3')).to.eql({
			minutes:  [0],
			hours:    [0],
			days:     [1, 15],
			months:   all.months,
			weekDays: [3],
		});
	}); // }}}

	it("supports step values", () => { // {{{
		expect(parseCron('*/5 * * * *')).to.eql({
			minutes:  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('59 1-5 5-31/5 * 1')).to.eql({
			minutes:  [59],
			hours:    [1, 2, 3, 4, 5],
			days:     [5, 10, 15, 20, 25, 30],
			months:   all.months,
			weekDays: [1],
		});
		// The following examples are taken from <https://crontab.guru>
		expect(parseCron('23 0-20/2 * * *')).to.eql({
			minutes:  [23],
			hours:    [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 0,12 1 */2 *')).to.eql({
			minutes:  [0],
			hours:    [0, 12],
			days:     [1],
			months:   [1, 3, 5, 7, 9, 11],
			weekDays: all.weekDays,
		});
		// Test implicit ranges
		expect(parseCron('10/5 * * * *')).to.eql({
			minutes:  [10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('0 0 * * mon/2')).to.eql({
			minutes:  [0],
			hours:    [0],
			days:     all.days,
			months:   all.months,
			weekDays: [1, 3, 5],
		});
	}); // }}}

	it("supports @-shorthands", () => { // {{{
		expect(parseCron('@hourly')).to.eql({
			minutes:  [0],
			hours:    all.hours,
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('@daily')).to.eql({
			minutes:  [0],
			hours:    [0],
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('@monthly')).to.eql({
			minutes:  [0],
			hours:    [0],
			days:     [1],
			months:   all.months,
			weekDays: all.weekDays,
		});
		expect(parseCron('@yearly')).to.eql({
			minutes:  [0],
			hours:    [0],
			days:     [1],
			months:   [1],
			weekDays: all.weekDays,
		});
		expect(parseCron('@annually')).to.eql({
			minutes:  [0],
			hours:    [0],
			days:     [1],
			months:   [1],
			weekDays: all.weekDays,
		});
	}); // }}}

});

describe("parseCron.nextDate", () => {

	it("returns `undefined` when given an invalid cron expression", () => { // {{{
		expect(parseCron.nextDate('* * *')).to.be.undefined;
		expect(parseCron.nextDate('0 0 1 1 * 3000')).to.be.undefined;
		expect(parseCron.nextDate('* * * * 5#3')).to.be.undefined;
		expect(parseCron.nextDate('? ? * * *')).to.be.undefined;
		expect(parseCron.nextDate('@reboot')).to.be.undefined;
		expect(parseCron.nextDate('30- * * * *')).to.be.undefined;
		expect(parseCron.nextDate('60 * * * *')).to.be.undefined;
		expect(parseCron.nextDate('* * * 13 *')).to.be.undefined;
		expect(parseCron.nextDate('* * * * monday')).to.be.undefined;
		expect(parseCron.nextDate('* 0-100 * * *')).to.be.undefined;
		expect(parseCron.nextDate('* 23-0 * * *')).to.be.undefined;
		expect(parseCron.nextDate('*/a * * * *')).to.be.undefined;
	}); // }}}

	it("gives the correct date", () => { // {{{
		expect(parseCron.nextDate('* * * * *',       new Date('01 Jan 2020 00:00:00 GMT')).toUTCString()).to.equal(new Date('01 Jan 2020 00:01:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 * * * *',       new Date('01 Jan 2020 00:00:00 GMT')).toUTCString()).to.equal(new Date('01 Jan 2020 01:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('*/5 * * * *',     new Date('01 Jan 2020 00:01:00 GMT')).toUTCString()).to.equal(new Date('01 Jan 2020 00:05:00 GMT').toUTCString());
		expect(parseCron.nextDate('* * 5-24 * *',    new Date('12 Jan 2020 00:00:00 GMT')).toUTCString()).to.equal(new Date('12 Jan 2020 00:01:00 GMT').toUTCString());

		// Examples from <https://crontab.guru>
		expect(parseCron.nextDate('5 0 * 8 *',       new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('01 Aug 2021 00:05:00 GMT').toUTCString());
		expect(parseCron.nextDate('15 14 1 * *',     new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('01 Oct 2020 14:15:00 GMT').toUTCString());
		expect(parseCron.nextDate('23 0-20/2 * * *', new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('25 Sep 2020 12:23:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 0,12 1 */2 *',  new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('01 Nov 2020 00:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 4 8-14 * *',    new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('08 Oct 2020 04:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('@weekly',         new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('27 Sep 2020 00:00:00 GMT').toUTCString());
	}); // }}}

	it("supports week days", () => { // {{{
		expect(parseCron.nextDate('* * * * mon',     new Date('01 Jan 2020 00:00:00 GMT')).toUTCString()).to.equal(new Date('06 Jan 2020 00:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('* * 1 1 sun',     new Date('01 Jan 2020 00:00:00 GMT')).toUTCString()).to.equal(new Date('01 Jan 2023 00:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('5 4 * * sun',     new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('27 Sep 2020 04:05:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 22 * * 1-5',    new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('25 Sep 2020 22:00:00 GMT').toUTCString());
		expect(parseCron.nextDate('0 0 1,15 * 3',    new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('01 Sep 2021 00:00:00 GMT').toUTCString());
	}); // }}}

	it("works with cron schedules objects", () => { // {{{
		expect(parseCron.nextDate({
			minutes:  [5],
			hours:    [0],
			days:     all.days,
			months:   [8],
			weekDays: all.weekDays,
		}, new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('01 Aug 2021 00:05:00 GMT').toUTCString());

		expect(parseCron.nextDate({
			minutes:  [15],
			hours:    [14],
			days:     [1],
			months:   all.months,
			weekDays: all.weekDays,
		}, new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('01 Oct 2020 14:15:00 GMT').toUTCString());

		expect(parseCron.nextDate({
			minutes:  [23],
			hours:    [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
			days:     all.days,
			months:   all.months,
			weekDays: all.weekDays,
		}, new Date('25 Sep 2020 12:00:00 GMT')).toUTCString()).to.equal(new Date('25 Sep 2020 12:23:00 GMT').toUTCString());
	}); // }}}
});
