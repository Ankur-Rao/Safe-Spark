import {
  BellRing,
  DoorClosed,
  Fingerprint,
  Flashlight,
  Hammer,
  Key,
  Siren,
  SprayCan,
  TestTube,
  Watch,
} from 'lucide-react';

/** Product "photography" is an icon on a tinted gradient — no image requests,
 *  nothing to 404, and the catalog looks consistent before real shots exist. */
export const PRODUCT_ICONS = {
  Siren,
  SprayCan,
  Hammer,
  Fingerprint,
  BellRing,
  DoorClosed,
  Flashlight,
  TestTube,
  Key,
  Watch,
};

export function productIcon(name) {
  return PRODUCT_ICONS[name] || Siren;
}
