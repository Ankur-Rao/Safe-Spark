/**
 * Speed-dial targets.
 *
 * `emergency: true` entries are public emergency numbers. The two IU/Bloomington
 * numbers below are the publicly listed non-emergency lines — re-verify them
 * against iu.edu/police and bloomington.in.gov before shipping, and keep 911 as
 * the primary route for anything in progress.
 */

export const PUBLIC_LINES = [
  {
    id: 'line-911',
    name: '911',
    role: 'Police · Fire · Medical',
    number: '911',
    emergency: true,
    note: 'Always the fastest route for anything happening right now.',
  },
  {
    id: 'line-iupd',
    name: 'IU Police (IUPD)',
    role: 'Bloomington campus · non-emergency',
    number: '812-855-4111',
    emergency: false,
    note: 'Campus-specific. Also the number for a safety escort.',
  },
  {
    id: 'line-bpd',
    name: 'Bloomington Police',
    role: 'City of Bloomington · non-emergency',
    number: '812-339-4477',
    emergency: false,
    note: 'Off-campus streets, Kirkwood, the downtown square.',
  },
  {
    id: 'line-crisis',
    name: 'Crisis & support line',
    role: '988 Suicide & Crisis Lifeline',
    number: '988',
    emergency: false,
    note: 'Call or text, 24/7, for you or for someone you are with.',
  },
];

/** Default trusted contacts — the user edits these in the SOS tab. */
export const DEFAULT_TRUSTED_CONTACTS = [
  {
    id: 'tc-1',
    name: 'Mom',
    relation: 'Parent',
    number: '812-555-0142',
    notify: true,
  },
  {
    id: 'tc-2',
    name: 'Ava — roommate',
    relation: 'Roommate',
    number: '317-555-0188',
    notify: true,
  },
  {
    id: 'tc-3',
    name: 'Dez',
    relation: 'Best friend',
    number: '765-555-0119',
    notify: false,
  },
];
