/**
 * Per-user signature country assignments (hardcoded until profile API exists).
 * Country ids match portal/education/assets/world-countries.json.
 */
(function (global) {
  /** @type {Record<string, string[]>} */
  const USER_SIGNATURE_COUNTRIES = {
    aam: ['india', 'singapore'],
    n8n: ['india', 'usa'],
  };

  function forUser(username) {
    const key = String(username || '')
      .trim()
      .toLowerCase();
    return USER_SIGNATURE_COUNTRIES[key] ? USER_SIGNATURE_COUNTRIES[key].slice() : [];
  }

  function hasAssignments(username) {
    return forUser(username).length > 0;
  }

  global.AnyoUserCountries = {
    USER_SIGNATURE_COUNTRIES,
    forUser,
    hasAssignments,
  };
})(typeof window !== 'undefined' ? window : globalThis);
