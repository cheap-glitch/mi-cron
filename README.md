<h1>
mi-cron
&nbsp;
<img alt="license badge"        src="https://badgen.net/github/license/cheap-glitch/mi-cron?color=green">
<img alt="latest release badge" src="https://badgen.net/github/release/cheap-glitch/mi-cron?color=green">
<a href="https://codecov.io/gh/cheap-glitch/mi-cron"><img alt="codecov badge" src="https://codecov.io/gh/cheap-glitch/mi-cron/graph/badge.svg"></a>
</h1>

```javascript
const { parseCron } = require('@cheap-glitch/mi-cron');

console.log(parseCron.nextDate('*/5 6-12 3 3 *').toUTCString());
// Wed, 03 Mar 2021 06:00:00
```

This is  a microscopic  (~1KB minified &  gzipped) zero-dependencies  parser for
[standard cron expressions](https://en.wikipedia.org/wiki/Cron#CRON_expression).
It  also  supports   a  few  non-standard  but  convenient   features,  such  as
@-shorthands (e.g. `@daily`)  and steps (e.g. `*/10`), and can  compute the next
scheduled date for a given expression.

## Installation
```shell
npm i @cheap-glitch/mi-cron
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
const { parseCron } = require('@cheap-glitch/mi-cron');

console.log(parseCron('*/5 6-10 1,15 * wed'));
// {
// 	minutes:  [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
// 	hours:    [6, 7, 8, 9, 10],
// 	days:     [1, 15],
// 	months:   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
// 	weekDays: [3],
// }
```

### parseCron.nextDate(exp: string | CronSchedule, from: Date = new Date.now()): Date
Takes a cron schedule  or expression and returns the next  date that matches the
schedule, or  `undefined` if the expression  is invalid. If given  a datetime as
the second argument, it will start  the computation from this time (otherwise it
will use the current datetime at the moment it's called).

```javascript
const { parseCron } = require('@cheap-glitch/mi-cron');

console.log(parseCron.nextDate('* * * * *', new Date('01 Jan 2020 00:00:00 GMT')).toUTCString());
// Wed, 01 Jan 2020 00:01:00

// Get the next five scheduled dates
const schedule = parseCron('@weekly');
const nextDate = new Date();
for (let i=0; i<5; i++) {
	console.log(nextDate = parseCron.nextDate(schedule, nextDate));
}
```

## Related
 * [crontab.guru](https://crontab.guru/), an interactive cron schedule editor
 * [A description of the crontab format](https://crontab.guru/crontab.5.html)
 * [Best practices for cron](https://www.endpoint.com/blog/2008/12/08/best-practices-for-cron)

## License
```text
Copyright (c) 2020-present, cheap glitch

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby  granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE  IS PROVIDED "AS IS"  AND THE AUTHOR DISCLAIMS  ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING  ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS.  IN NO  EVENT  SHALL THE  AUTHOR  BE LIABLE  FOR  ANY SPECIAL,  DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR  PROFITS, WHETHER IN AN ACTION OF  CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN  CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
```
