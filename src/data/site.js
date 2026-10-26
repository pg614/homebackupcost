import appliances from './appliances.json';
import batteries from './batteries.json';
import costs from './costs.json';
import programs from './programs.json';
import national from './national_homes_hear.json';
import affiliates from './affiliates.json';
import expansions from './expansions.json';
export { expansions, appliances, batteries, costs, programs, national, affiliates };
export const AS_OF = '2026-10-25';
export const USABLE = 0.85;
export const STATE_NAMES = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',PR:'Puerto Rico'};
export const LAUNCH_STATES = ['OH','MI','NY','NC','CA','IL'];
// First dollar figure in the sourced price string (the sale/low price). Parsed, not invented.
export const priceLow = (s) => { const m = String(s||'').match(/\$([\d,]+(?:\.\d+)?)/); return m ? parseFloat(m[1].replace(/,/g,'')) : null; };
// Brand pages used as affiliate PLACEHOLDERS (no affiliate accounts exist yet).
export const BRAND_URL = { EcoFlow:'https://us.ecoflow.com/collections/home-backup-battery', Anker:'https://www.ankersolix.com/', Jackery:'https://www.jackery.com/', BLUETTI:'https://www.bluettipower.com/', Bluetti:'https://www.bluettipower.com/', 'Goal Zero':'https://goalzero.com/', Tesla:'https://www.tesla.com/powerwall', FranklinWH:'https://www.franklinwh.com/' };
export const brandOf = (name) => Object.keys(BRAND_URL).find(b => name.startsWith(b)) || '';
// Calculator defaults: hours/day of actual draw. These are OUR ASSUMPTIONS, shown in the UI.
export const DEFAULT_HOURS = { 'Refrigerator':8, 'Freezer':8, 'Furnace fan 1/2 HP':8, 'Sump pump 1/3 HP':4.8, 'Sump pump 1/2 HP':4.8, 'Well pump 1/2 HP':1, 'Well pump 1 HP':1, 'Window AC 5,000 BTU':8, 'Window AC 10,000 BTU':8, 'Central AC 3 ton':8, 'Electric range (one burner)':1, 'Microwave':0.5, 'Space heater':6, 'Electric water heater':3, 'Washing machine':1, 'TV 32-55in':4, 'LED bulb (each)':5, 'Phone/laptop charger':3, 'CPAP no heat':8, 'CPAP heated humidifier':8, 'Router/modem (Wi-Fi)':24, 'Security system':24, 'Ceiling fan':8 };
