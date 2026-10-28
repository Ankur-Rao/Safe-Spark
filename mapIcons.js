import L from 'leaflet';
import { CATEGORY_BY_ID } from '../../data/incidents';

/**
 * All markers are divIcons (HTML, not sprites). That means no image requests,
 * no broken-icon squares when Leaflet's asset paths get rewritten by a bundler,
 * and full control over the glow — which is the whole visual idea of the map.
 */

export function blueLightIcon({ selected = false, offline = false } = {}) {
  const core = offline ? '#64748b' : '#5ec8ff';
  const halo = offline ? 'rgba(100,116,139,0.25)' : 'rgba(34,167,240,0.35)';
  const size = selected ? 34 : 26;

  return L.divIcon({
    className: 'ss-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${
          offline
            ? ''
            : `<span style="position:absolute;inset:0;border-radius:9999px;background:${halo};"
                     class="animate-pulseRing"></span>`
        }
        <span style="position:absolute;inset:${size * 0.22}px;border-radius:9999px;
                     background:${core};
                     box-shadow:0 0 ${offline ? 4 : 14}px ${core},0 0 2px #fff inset;
                     border:1.5px solid rgba(255,255,255,.85);"></span>
        ${
          selected
            ? `<span style="position:absolute;inset:-4px;border-radius:9999px;
                           border:2px solid #5ec8ff;"></span>`
            : ''
        }
      </div>`,
  });
}

export function incidentIcon(categoryId, { weight = 1, selected = false } = {}) {
  const cat = CATEGORY_BY_ID[categoryId];
  const color = cat?.color || '#94a3b8';
  const size = selected ? 28 : 22;
  const alpha = 0.25 + 0.45 * weight;

  return L.divIcon({
    className: 'ss-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <span style="position:absolute;inset:0;border-radius:9999px;
                     background:${color};opacity:${alpha};"></span>
        <span style="position:absolute;inset:${size * 0.28}px;border-radius:9999px;
                     background:${color};border:1.5px solid rgba(8,12,20,.85);
                     box-shadow:0 0 8px ${color};"></span>
      </div>`,
  });
}

/**
 * "You" marker. Deliberately white-cored rather than tinted: every incident
 * category already owns a colour, and the one dot the user must never
 * misidentify is their own. The ring carries the GPS-vs-simulated signal.
 */
export function userIcon({ gps = false } = {}) {
  const ring = gps ? '#4ade80' : '#94a3b8';
  return L.divIcon({
    className: 'ss-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <span style="position:absolute;inset:0;border-radius:9999px;
                     background:${ring};opacity:.22;" class="animate-pulseRing"></span>
        <span style="position:absolute;inset:7px;border-radius:9999px;
                     background:${ring};opacity:.9;"></span>
        <span style="position:absolute;inset:11px;border-radius:9999px;background:#ffffff;
                     box-shadow:0 0 10px rgba(255,255,255,.9);"></span>
      </div>`,
  });
}

export function pinDropIcon() {
  return L.divIcon({
    className: 'ss-marker',
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    html: `
      <div style="position:relative;width:34px;height:42px;">
        <svg viewBox="0 0 24 30" width="34" height="42" aria-hidden="true">
          <path d="M12 0C5.9 0 1 4.9 1 11c0 8 11 19 11 19s11-11 11-19C23 4.9 18.1 0 12 0z"
                fill="#22a7f0" stroke="#ffffff" stroke-width="1.4"/>
          <circle cx="12" cy="11" r="4" fill="#05070d"/>
        </svg>
      </div>`,
  });
}
