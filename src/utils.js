import { ALL_YEARS, COUNTRY_ACCENT_COLORS } from './constants';

export const getFlagUrl = (country) => {
  const countryCodes = {
    Austria: 'at', Azerbaijan: 'az', Belarus: 'by', Belgium: 'be',
    Bulgaria: 'bg', Canada: 'ca', Croatia: 'hr', 'Czech Republic': 'cz',
    Denmark: 'dk', England: 'gb-eng', Europe: 'eu', Finland: 'fi',
    France: 'fr', Georgia: 'ge', Germany: 'de', Greece: 'gr',
    Iceland: 'is', Ireland: 'ie', Italy: 'it', Latvia: 'lv',
    Lithuania: 'lt', Luxembourg: 'lu', Moldova: 'md', Montenegro: 'me',
    Netherlands: 'nl', 'North Macedonia': 'mk', 'Northern Ireland': 'gb-nir',
    Norway: 'no', Poland: 'pl', Portugal: 'pt', Romania: 'ro',
    Russia: 'ru', Scotland: 'gb-sct', Serbia: 'rs', Slovakia: 'sk',
    Spain: 'es', Sweden: 'se', Switzerland: 'ch', Turkey: 'tr',
    Ukraine: 'ua', USA: 'us', Wales: 'gb-wls', Kazakhstan: 'kz',
    Cuba: 'cu', Mexico: 'mx', Brazil: 'br', Estonia: 'ee', Hungary: 'hu',
  };
  const code = countryCodes[country] || 'un';
  return `https://flagcdn.com/w40/${code}.png`;
};

export const processPlayers = (rawData) => {
  return rawData.map(p => ({
    rank: 0,
    nationality: p.Nationality,
    name: p.Name,
    total: parseFloat(p.Total) || 0,
    points: Object.fromEntries(ALL_YEARS.map(y => [y, parseFloat(p[y]) || 0])),
    realName: p.RealName || null,
    birthDate: p.BirthDate || null,
    achievements: p.Achievements || [],
  }));
};

export const getCountryColors = (nationality) => {
  return COUNTRY_ACCENT_COLORS[nationality] || COUNTRY_ACCENT_COLORS.default;
};

// Helper: create composite key for player medals (name|nationality)
export const getPlayerKey = (player) => {
  // Normalize: lowercase and trim
  const name = (player.name || player.Name || '').toLowerCase();
  const nationality = (player.nationality || player.Nationality || '').toLowerCase();
  return `${name}|${nationality}`;
};