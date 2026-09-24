/**
 * Continent groupings for the curriculum universe hub.
 * Country ids must match portal/education/assets/world-countries.json.
 */
(function (global) {
  const CONTINENTS = [
    {
      id: 'asia',
      name: 'Asia',
      icon: '🌏',
      blurb: 'South & East Asia curricula',
      countryIds: ['bangladesh', 'japan', 'malaysia', 'philippines', 'singapore', 'south-korea'],
    },
    {
      id: 'europe',
      name: 'Europe',
      icon: '🌍',
      blurb: 'GCSE · A Level · Nordic tracks',
      countryIds: ['finland', 'uk'],
    },
    {
      id: 'north-america',
      name: 'North America',
      icon: '🌎',
      blurb: 'US & Canadian science pathways',
      countryIds: ['canada', 'usa'],
    },
    {
      id: 'africa',
      name: 'Africa',
      icon: '🌍',
      blurb: 'WAEC · NECO aligned science',
      countryIds: ['nigeria'],
    },
    {
      id: 'middle-east',
      name: 'Middle East',
      icon: '🕌',
      blurb: 'Regional matric & intermediate',
      countryIds: ['pakistan'],
    },
    {
      id: 'south-america',
      name: 'South America',
      icon: '🌎',
      blurb: 'Coming soon',
      countryIds: [],
      comingSoon: true,
    },
    {
      id: 'oceania',
      name: 'Oceania',
      icon: '🏝️',
      blurb: 'Australian science pathways',
      countryIds: ['australia'],
    },
  ];

  /** India is pinned separately but belongs to Asia for drill-down. */
  const INDIA_ID = 'india';

  function continentById(id) {
    return CONTINENTS.find((c) => c.id === id) || null;
  }

  function continentForCountry(countryId) {
    if (countryId === INDIA_ID) return continentById('asia');
    return CONTINENTS.find((c) => c.countryIds.includes(countryId)) || null;
  }

  function countriesForContinent(continentId, manifestCountries) {
    const cont = continentById(continentId);
    if (!cont) return [];
    const byId = Object.fromEntries((manifestCountries || []).map((c) => [c.id, c]));
    return cont.countryIds.map((id) => byId[id]).filter(Boolean);
  }

  global.AnyoContinentsConfig = {
    CONTINENTS,
    INDIA_ID,
    continentById,
    continentForCountry,
    countriesForContinent,
  };
})(typeof window !== 'undefined' ? window : globalThis);
