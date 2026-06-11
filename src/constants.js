// Years range
export const START_YEAR = 2012;
export const END_YEAR = 2026;
export const ALL_YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

// UI configuration
export const ROWS_PER_PAGE = 10;
export const MAX_VISIBLE_PAGES = 5;
export const DEBOUNCE_DELAY_MS = 300;

// Local storage keys
export const STORAGE_KEY_PREFIX = 'nw_stats';

// Default filter values
export const DEFAULT_COUNTRY_FILTER = 'All Countries';
export const DEFAULT_MIN_YEAR = START_YEAR;
export const DEFAULT_MAX_YEAR = END_YEAR;

// Medal placement symbols and colors
export const MEDAL_SYMBOLS = { 1: '🥇', 2: '🥈', 3: '🥉' };
export const MEDAL_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

// Nation accent colors – primary, secondary, tertiary (used for borders, charts, etc.)
export const COUNTRY_ACCENT_COLORS = {
  default: { primary: '#d97a54', secondary: '#ba5a3a', tertiary: '#9e7a60' },

  // Europe (EU flag)
  Europe: { primary: '#003399', secondary: '#FFCC00', tertiary: '#FFFFFF' },

  // Major nations
  France: { primary: '#0055A4', secondary: '#EF4135', tertiary: '#FFFFFF' },
  Germany: { primary: '#DD0000', secondary: '#28282D', tertiary: '#FFCE00' },
  England: { primary: '#CF081F', secondary: '#00247D', tertiary: '#FFFFFF' },
  USA: { primary: '#B22234', secondary: '#3C3B6E', tertiary: '#FFFFFF' },
  Canada: { primary: '#D80621', secondary: '#FFFFFF', tertiary: '#FF0000' },
  Netherlands: { primary: '#FF6100', secondary: '#FFFFFF', tertiary: '#21468B' },
  Poland: { primary: '#DC143C', secondary: '#FFFFFF', tertiary: '#D4213D' },
  Sweden: { primary: '#005B99', secondary: '#FECC02', tertiary: '#FFFFFF' },
  Spain: { primary: '#C60B1E', secondary: '#FFC400', tertiary: '#AD1519' },
  Italy: { primary: '#009246', secondary: '#FFFFFF', tertiary: '#CE2B37' },
  Russia: { primary: '#D52B1E', secondary: '#0039A6', tertiary: '#FFFFFF' },
  Ukraine: { primary: '#FFD700', secondary: '#0057B8', tertiary: '#FFFFFF' },
  Ireland: { primary: '#169B62', secondary: '#FF883E', tertiary: '#FFFFFF' },
  Scotland: { primary: '#0065BD', secondary: '#FFFFFF', tertiary: '#005EB8' },
  Wales: { primary: '#D00000', secondary: '#FFFFFF', tertiary: '#008000' },
  Belgium: { primary: '#FAE042', secondary: '#000000', tertiary: '#EF3340' },
  Switzerland: { primary: '#FF0000', secondary: '#FFFFFF', tertiary: '#CC0000' },
  Austria: { primary: '#ED2939', secondary: '#FFFFFF', tertiary: '#ED2939' },
  Denmark: { primary: '#C60C30', secondary: '#FFFFFF', tertiary: '#C60C30' },
  Finland: { primary: '#002F6C', secondary: '#FFFFFF', tertiary: '#003580' },
  Norway: { primary: '#BA0C2F', secondary: '#002664', tertiary: '#FFFFFF' },
  Portugal: { primary: '#FF0000', secondary: '#006600', tertiary: '#FFD700' },
  Greece: { primary: '#0D5EAF', secondary: '#FFFFFF', tertiary: '#004C9E' },
  Turkey: { primary: '#E30A17', secondary: '#FFFFFF', tertiary: '#000000' },
  'Czech Republic': { primary: '#11457E', secondary: '#D7141A', tertiary: '#FFFFFF' },
  Hungary: { primary: '#CD2A3E', secondary: '#FFFFFF', tertiary: '#436F4D' },
  Romania: { primary: '#002B7F', secondary: '#FCD116', tertiary: '#CE1126' },
  Bulgaria: { primary: '#00966E', secondary: '#FFFFFF', tertiary: '#D62612' },
  Serbia: { primary: '#C6362C', secondary: '#0C4076', tertiary: '#EDC000' },
  Croatia: { primary: '#005B99', secondary: '#FFFFFF', tertiary: '#FF0000' },
  Slovakia: { primary: '#EE1C25', secondary: '#0B4EA2', tertiary: '#FFFFFF' },
  Slovenia: { primary: '#005B99', secondary: '#FFFFFF', tertiary: '#CE1126' },
  Estonia: { primary: '#0072CE', secondary: '#000000', tertiary: '#FFFFFF' },
  Latvia: { primary: '#9E3039', secondary: '#FFFFFF', tertiary: '#9E3039' },
  Lithuania: { primary: '#006A44', secondary: '#FFFFFF', tertiary: '#C1272D' },
  Luxembourg: { primary: '#00A1DE', secondary: '#FFFFFF', tertiary: '#ED2939' },
  Moldova: { primary: '#003399', secondary: '#FFCC00', tertiary: '#9E1B34' },
  Montenegro: { primary: '#C41E3A', secondary: '#FFD700', tertiary: '#000000' },
  'North Macedonia': { primary: '#D20000', secondary: '#FFD700', tertiary: '#FFFFFF' },
  'Northern Ireland': { primary: '#0065BD', secondary: '#FFFFFF', tertiary: '#D00000' },
  Iceland: { primary: '#02529C', secondary: '#DC1E35', tertiary: '#FFFFFF' },
  Georgia: { primary: '#FF0000', secondary: '#FFFFFF', tertiary: '#FF0000' },
  Azerbaijan: { primary: '#00B5E2', secondary: '#EF4135', tertiary: '#FFFFFF' },
  Belarus: { primary: '#FF0000', secondary: '#00B5E2', tertiary: '#FFFFFF' },
  Kazakhstan: { primary: '#00B5E2', secondary: '#FFD700', tertiary: '#FFFFFF' },
  'North America / NA': { primary: '#2C5F2D', secondary: '#FFFFFF', tertiary: '#97BC62' },
  Mexico: { primary: '#006847', secondary: '#FFFFFF', tertiary: '#CE1126' },
  Brazil: { primary: '#009C3B', secondary: '#FFDF00', tertiary: '#002776' },
  Cuba: { primary: '#0050B0', secondary: '#FFFFFF', tertiary: '#CE1126' },
};