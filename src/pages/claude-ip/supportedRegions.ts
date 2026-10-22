/**
 * ISO 3166-1 alpha-2 allowlist of Claude supported regions.
 *
 * Source: https://www.anthropic.com/legal/supported-regions
 * Retrieved: 2026-10-21 (185 countries and regions listed). Territories and
 * dependencies of a listed country are also supported per the policy, but a
 * `/cdn-cgi/trace` `loc` only ever carries the parent territory code, so the
 * parent codes are all we need to compare against.
 *
 * Confirmed absent on retrieval (the markets this page's audience exits
 * through): CN (mainland China), HK, MO, RU, BY, IR, KP, SY, CU, VE.
 * Confirmed present: US, JP, SG, TW.
 *
 * Re-check the source page when Anthropic updates the policy and regenerate.
 */

export const SUPPORTED_REGIONS: ReadonlySet<string> = new Set([
  'AD', // Andorra
  'AE', // United Arab Emirates
  'AG', // Antigua and Barbuda
  'AL', // Albania
  'AM', // Armenia
  'AO', // Angola
  'AR', // Argentina
  'AT', // Austria
  'AU', // Australia
  'AZ', // Azerbaijan
  'BA', // Bosnia and Herzegovina
  'BB', // Barbados
  'BD', // Bangladesh
  'BE', // Belgium
  'BF', // Burkina Faso
  'BG', // Bulgaria
  'BH', // Bahrain
  'BI', // Burundi
  'BJ', // Benin
  'BN', // Brunei
  'BO', // Bolivia
  'BR', // Brazil
  'BS', // Bahamas
  'BT', // Bhutan
  'BW', // Botswana
  'BZ', // Belize
  'CA', // Canada
  'CD', // Congo, Democratic Republic of the
  'CF', // Central African Republic
  'CG', // Congo (Brazzaville)
  'CH', // Switzerland
  'CI', // Côte d'Ivoire
  'CL', // Chile
  'CM', // Cameroon
  'CO', // Colombia
  'CR', // Costa Rica
  'CV', // Cabo Verde
  'CY', // Cyprus
  'CZ', // Czechia
  'DE', // Germany
  'DJ', // Djibouti
  'DK', // Denmark
  'DM', // Dominica
  'DO', // Dominican Republic
  'DZ', // Algeria
  'EC', // Ecuador
  'EE', // Estonia
  'EG', // Egypt
  'ER', // Eritrea
  'ES', // Spain
  'ET', // Ethiopia
  'FI', // Finland
  'FJ', // Fiji
  'FM', // Micronesia
  'FR', // France
  'GA', // Gabon
  'GB', // United Kingdom
  'GD', // Grenada
  'GE', // Georgia
  'GH', // Ghana
  'GM', // Gambia
  'GN', // Guinea
  'GQ', // Equatorial Guinea
  'GR', // Greece
  'GT', // Guatemala
  'GW', // Guinea-Bissau
  'GY', // Guyana
  'HN', // Honduras
  'HR', // Croatia
  'HT', // Haiti
  'HU', // Hungary
  'ID', // Indonesia
  'IE', // Ireland
  'IL', // Israel
  'IN', // India
  'IQ', // Iraq
  'IS', // Iceland
  'IT', // Italy
  'JM', // Jamaica
  'JO', // Jordan
  'JP', // Japan
  'KE', // Kenya
  'KG', // Kyrgyzstan
  'KH', // Cambodia
  'KI', // Kiribati
  'KM', // Comoros
  'KN', // Saint Kitts and Nevis
  'KR', // South Korea
  'KW', // Kuwait
  'KZ', // Kazakhstan
  'LA', // Laos
  'LB', // Lebanon
  'LC', // Saint Lucia
  'LI', // Liechtenstein
  'LK', // Sri Lanka
  'LR', // Liberia
  'LS', // Lesotho
  'LT', // Lithuania
  'LU', // Luxembourg
  'LV', // Latvia
  'LY', // Libya
  'MA', // Morocco
  'MC', // Monaco
  'MD', // Moldova
  'ME', // Montenegro
  'MG', // Madagascar
  'MH', // Marshall Islands
  'MK', // North Macedonia
  'ML', // Mali
  'MN', // Mongolia
  'MR', // Mauritania
  'MT', // Malta
  'MU', // Mauritius
  'MV', // Maldives
  'MW', // Malawi
  'MX', // Mexico
  'MY', // Malaysia
  'MZ', // Mozambique
  'NA', // Namibia
  'NE', // Niger
  'NG', // Nigeria
  'NI', // Nicaragua
  'NL', // Netherlands
  'NO', // Norway
  'NP', // Nepal
  'NR', // Nauru
  'NZ', // New Zealand
  'OM', // Oman
  'PA', // Panama
  'PE', // Peru
  'PG', // Papua New Guinea
  'PH', // Philippines
  'PK', // Pakistan
  'PL', // Poland
  'PS', // Palestine
  'PT', // Portugal
  'PW', // Palau
  'PY', // Paraguay
  'QA', // Qatar
  'RO', // Romania
  'RS', // Serbia
  'RW', // Rwanda
  'SA', // Saudi Arabia
  'SB', // Solomon Islands
  'SC', // Seychelles
  'SD', // Sudan
  'SE', // Sweden
  'SG', // Singapore
  'SI', // Slovenia
  'SK', // Slovakia
  'SL', // Sierra Leone
  'SM', // San Marino
  'SN', // Senegal
  'SO', // Somalia
  'SR', // Suriname
  'SS', // South Sudan
  'ST', // São Tomé and Príncipe
  'SV', // El Salvador
  'SZ', // Eswatini
  'TD', // Chad
  'TG', // Togo
  'TH', // Thailand
  'TJ', // Tajikistan
  'TL', // Timor-Leste
  'TM', // Turkmenistan
  'TN', // Tunisia
  'TO', // Tonga
  'TR', // Türkiye
  'TT', // Trinidad and Tobago
  'TW', // Taiwan
  'TV', // Tuvalu
  'TZ', // Tanzania
  'UA', // Ukraine
  'UG', // Uganda
  'US', // United States of America
  'UY', // Uruguay
  'UZ', // Uzbekistan
  'VA', // Vatican City
  'VC', // Saint Vincent and the Grenadines
  'VN', // Vietnam
  'VU', // Vanuatu
  'WS', // Samoa
  'ZA', // South Africa
  'ZM', // Zambia
  'ZW', // Zimbabwe
]);
