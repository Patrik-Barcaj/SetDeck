import { Region, SetlistShow } from '../types';

export function detectRegion(shows: SetlistShow[]): Region {
  if (!shows || shows.length === 0) return 'World';

  const countryCodes = shows.map((s) => s.venue?.city?.country?.code).filter(Boolean);
  
  if (countryCodes.length === 0) return 'World';

  const euCountries = [
    'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'AT', 'CH'
  ];

  let usCount = 0;
  let euCount = 0;
  let auCount = 0;

  countryCodes.forEach((code) => {
    if (code === 'US' || code === 'CA') usCount++;
    else if (code === 'AU' || code === 'NZ') auCount++;
    else if (euCountries.includes(code.toUpperCase())) euCount++;
  });

  const total = countryCodes.length;

  if (usCount / total >= 0.5) return 'US';
  if (euCount / total >= 0.5) return 'EU';
  if (auCount / total >= 0.5) return 'Australia';

  return 'World';
}
