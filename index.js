"use strict";
/*!
 * mi-cron
 *
 * A microscopic parser for standard cron expressions.
 *
 * Copyright (c) 2020-present, cheap glitch
 * This software is distributed under the ISC license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCron = void 0;
const shorthands = {
    '@hourly': '0 * * * *',
    '@daily': '0 0 * * *',
    '@weekly': '0 0 * * 0',
    '@monthly': '0 0 1 * *',
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
};
function parseCron(exp) {
    const fields = exp.trim().split(/\s+/);
    if (fields.length == 1) {
        return (fields[0] in shorthands) ? parseCron(shorthands[fields[0]]) : undefined;
    }
    if (fields.length == 5) {
        let schedule = undefined;
        try {
            schedule = {
                minutes: parseField(fields[0], 0, 59),
                hours: parseField(fields[1], 0, 23),
                days: parseField(fields[2], 1, 31),
                months: parseField(fields[3], 1, 12, ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']),
                weekDays: parseField(fields[4], 0, 6, ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']),
            };
        }
        catch (_a) {
            return undefined;
        }
        return schedule;
    }
    return undefined;
}
exports.parseCron = parseCron;
const boundary = '(\\d{1,2}|[a-z]{3})';
const rangePattern = new RegExp(`^${boundary}(?:-${boundary})?$`, 'i');
function parseField(field, min, max, aliases = []) {
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
        if (start === undefined || (stop !== undefined && stop < start)) {
            throw Error();
        }
        return stop == undefined ? [start] : range(start, stop, step);
    })));
    values.sort((a, b) => a - b);
    return values;
}
parseCron.nextDate = function (exp, from = new Date()) {
    const schedule = typeof exp == 'string' ? parseCron(exp) : exp;
    if (schedule === undefined) {
        return undefined;
    }
    const date = {
        years: from.getUTCFullYear(),
        months: from.getUTCMonth() + 1,
        days: from.getUTCDate(),
        hours: from.getUTCHours(),
        minutes: from.getUTCMinutes() + 1,
    };
    const dials = Object.keys(date);
    for (let i = 1; i < dials.length; i++) {
        const dial = dials[i];
        if (!schedule[dial].includes(date[dial])) {
            dials.filter((_, j) => j > i).forEach(d => date[d] = schedule[d][0]);
            const nextTime = schedule[dial].find(t => t >= date[dial]);
            if (nextTime !== undefined) {
                date[dial] = nextTime;
            }
            else {
                date[dial] = schedule[dial][0];
                date[dials[i - 1]]++;
                i = (dial != 'months') ? (i - 2) : i;
            }
        }
        if (dial == 'days' && !schedule.weekDays.includes(cronDateToUTC(date).getUTCDay())) {
            date.days++;
            date.hours = schedule.hours[0];
            date.minutes = schedule.minutes[0];
            i = 1;
        }
    }
    return cronDateToUTC(date);
};
function cronDateToUTC(date) {
    return new Date(Date.UTC(date.years, date.months - 1, date.days, date.hours, date.minutes));
}
function range(start, stop, step) {
    return Array.from({ length: Math.floor((stop - start) / step) + 1 }).map((_, i) => start + i * step);
}
