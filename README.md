# mi-cron
![license badge](https://badgen.net/github/license/cheap-glitch/mi-cron?color=green)
![latest release badge](https://badgen.net/github/release/cheap-glitch/mi-cron?color=green)
[![codecov badge](https://codecov.io/gh/cheap-glitch/mi-cron/branch/main/graph/badge.svg)](https://codecov.io/gh/cheap-glitch/mi-cron)

```javascript
const { parseCron } = require('mi-cron');

console.log(parseCron.nextDate('*/5 6-12 3 3 *').toUTCString());
// Wed, 03 Mar 2021 06:00:00
```

This is a microscopic (>2KB gzipped) parser for [standard cron expressions](https://en.wikipedia.org/wiki/Cron#CRON_expression).
It also supports a few non-standard but convenient features, such as `@`-shorthands (e.g. `@daily`) and step (e.g. `*/10`).

## Installation
```shell
npm i mi-cron
```

## API
TODO

## License
```
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
