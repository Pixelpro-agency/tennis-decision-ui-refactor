import { asString } from './shared.js';

export function normalizeName(value) {
return asString(value)
.replace(/\u0141/g, 'L')
.replace(/\u0142/g, 'l')
.replace(/\u00D8/g, 'O')
.replace(/\u00F8/g, 'o')
.replace(/\u00C6/g, 'Ae')
.replace(/\u00E6/g, 'ae')
.replace(/\u0152/g, 'Oe')
.replace(/\u0153/g, 'oe')
.replace(/[\u00DF\u1E9E]/g, 'ss')
.replace(/[\u0110\u00D0]/g, 'D')
.replace(/[\u0111\u00F0]/g, 'd')
.replace(/\u00DE/g, 'Th')
.replace(/\u00FE/g, 'th')
.replace(/\u0131/g, 'i')
.normalize('NFKD')
.replace(/\p{M}+/gu, '')
.toLowerCase()
.replace(/[^\p{L}\p{N}]+/gu, ' ')
.trim()
.replace(/\s+/g, ' ');
}
