export function asString(value) {
if (value === null || value === undefined) return '';
return String(value);
}

export function uniqueStrings(values) {
const strings = (Array.isArray(values) ? values : [])
.filter(value => typeof value === 'string' && value.length > 0);

return Array.from(new Set(strings));

}

export function getTickData(tick) {
return tick?.data && typeof tick.data === 'object'
? tick.data
: tick && typeof tick === 'object'
? tick
: {};
}
