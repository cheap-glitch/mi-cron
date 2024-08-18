# 📆 mi-cron

[![License](https://shields.io/github/license/cheap-glitch/mi-cron)](LICENSE)
[![Latest release](https://shields.io/github/v/release/cheap-glitch/mi-cron?sort=semver&label=latest%20release&color=green)](https://github.com/cheap-glitch/mi-cron/releases/latest)
[![Coverage status](https://shields.io/coveralls/github/cheap-glitch/mi-cron)](https://coveralls.io/github/cheap-glitch/mi-cron)

**mi-cron** is a microscopic ([~1KB minified & gzipped](https://bundlephobia.com/result?p=@fregante/mi-cron))
parser for [standard cron expressions](https://en.wikipedia.org/wiki/Cron#CRON_expression).

## Features

 * Supports the complete standard cron syntax
 * Supports some convenient syntax extensions: @-shorthands (`@daily`) and steps (`*/10`)
 * Can compute the next scheduled date for a given expression
 * Tiny & dependency-free

## Installation

```
npm i @fregante/mi-cron
```

## Usage

```javascript
const { parseCron } = require('@fregante/mi-cron');

console.log(parseCron.nextDate('*/5 6-12 3 3 *').toUTCString());
// Wed, 03 Mar 2021 06:00:00
```

## API

### parseCron(exp: string): CronSchedule

Parses a standard cron expression. Supports:
 * globs (`*`)
 * ranges (`0-30`, `mon-fri`)
 * steps (`*/3`, `20-31/2`, `10/5`)
 * lists (`1,15`, `0-10,20-30/2`)
 * @-shorthands (`@weekly`)

Does NOT support:
 * `L`, `W`, `#`, `?`, `H`
 * year field
 * `@reboot`

Returns an object with all possible values for each field (minutes, hours, days,
months and days of the week), or `undefined` if the expression is invalid (wrong
syntax, unsupported instruction, impossible range, etc).

```javascript
const { parseCron } = require('@fregante/mi-cron');

console.log(parseCron('*/5 6-10 1,15 * wed'));
// {
// 	minutes:  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
// 	hours:    [6, 7, 8, 9, 10],
// 	days:     [1, 15],
// 	months:   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
// 	weekDays: [3],
// }
```

### parseCron.nextDate(exp: string | CronSchedule[, from: Date = new Date.now()]): Date

Takes a cron schedule  or expression and returns the next  date that matches the
schedule, or  `undefined` if the expression  is invalid. If given  a datetime as
the second argument, it will start  the computation from this time (otherwise it
will use the current datetime at the moment it's called).

```javascript
const { parseCron } = require('@fregante/mi-cron');

console.log(parseCron.nextDate('* * * * *', new Date('01 Jan 2020 00:00:00 GMT')).toUTCString());
// Wed, 01 Jan 2020 00:01:00

// Get the next five scheduled dates
const schedule = parseCron('@weekly');
const nextDate = new Date();
for (let i=0; i<5; i++) {
	console.log(nextDate = parseCron.nextDate(schedule, nextDate));
}
```

## Changelog

See the full changelog [here](https://github.com/cheap-glitch/devlint/releases).

## Contributing

Contributions are welcomed! Please open an issue before submitting substantial changes.

## Related

 * [crontab.guru](https://crontab.guru) – Interactive cron schedule editor
 * [Description of the crontab format](https://crontab.guru/crontab.5.html)
 * [Best practices for cron](https://www.endpoint.com/blog/2008/12/08/best-practices-for-cron)

## License

ISC
