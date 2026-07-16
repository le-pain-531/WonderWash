import { outlets as rawOutlets } from './outlets.js';
import { cloneDefaultPricing, customPricingByOutlet } from './pricing.js';

const regionColors = {
  South: '#1f7ae0',
  East: '#22c55e',
  Central: '#f59e0b',
  North: '#8b5cf6',
  West: '#ef4444'
};

const branchImageBaseUrl = new URL('./assets/branches/', import.meta.url);
const defaultBranchImagePath = new URL('nooutlet.png', branchImageBaseUrl).href;
const knownBranchImages = new Set([
  '28JBMB',
  '491JWA1B',
  'AB',
  'AMKA10B',
  'AMKA1B',
  'AMKA4B',
  'AMKS21B',
  'AMKS31B',
  'BB',
  'BBWB',
  'BLB',
  'BNA1B',
  'BPO',
  'BRB',
  'BTRB',
  'CA3B',
  'CB',
  'CCB',
  'CCKB',
  'CLB',
  'CSB',
  'CWB',
  'DRB',
  'EPB',
  'H212B',
  'HA8B',
  'JBMB',
  'JKOB',
  'JWA1B',
  'JWB',
  'JWS91B',
  'KTB',
  'KUBKB',
  'MLSB',
  'NB',
  'NUCB',
  'PB',
  'PRB',
  'PRS51B',
  'SDB',
  'SMB',
  'SNB',
  'SRB',
  'TA8B',
  'TB',
  'TBB',
  'TBHB',
  'TGB',
  'TJB',
  'TPB116B',
  'TPB211B',
  'TPL4B',
  'TRB',
  'TS42B',
  'WB',
  'WB304B',
  'YA11B',
  'YA4B',
  'YA6B',
  'YS72B'
]);

const outlets = rawOutlets.map((outlet, index) => ({
  ...outlet,
  mapsQuery: outlet.mapsQuery ?? `Wonder Wash ${outlet.name} Singapore`,
  pricing: customPricingByOutlet[outlet.name] ?? cloneDefaultPricing(),
  loyaltyCardAvailable: outlet.loyaltyCard === true,
  id: `outlet-${index + 1}`
}));

let outletMap;
let activeMarker;
const markerByOutletId = new Map();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getMapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getRegionId(region) {
  return `region-${region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function renderPricingTable(pricingRows) {
  if (!Array.isArray(pricingRows) || pricingRows.length === 0) {
    return `
      <div class="pricing-block">
        <div class="pricing-heading">Pricing</div>
        <div class="pricing-empty">Pricing details will be updated soon.</div>
      </div>
    `;
  }

  return `
    <div class="pricing-block">
      <div class="pricing-heading">Pricing</div>
      <div class="pricing-table-wrap">
        <table class="pricing-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Capacity</th>
              <th>Machines</th>
              <th>Load</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${pricingRows.map(item => `
              <tr>
                <td>${escapeHtml(item.type)}</td>
                <td>${escapeHtml(item.capacity)}</td>
                <td>${escapeHtml(item.machines)}</td>
                <td>${escapeHtml(item.load || '-')}</td>
                <td>${escapeHtml(item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getMarkerStyle(outlet, isActive = false) {
  const color = regionColors[outlet.region] || '#1f7ae0';

  return {
    radius: isActive ? 10 : 7,
    weight: isActive ? 3 : 2,
    color: '#ffffff',
    fillColor: color,
    fillOpacity: isActive ? 1 : 0.9
  };
}

function getBranchImagePath(outletName) {
  const baseName = outletName
    .replace(/\s*\([^)]*\)/g, '')
    .match(/[A-Za-z0-9]+/g);

  if (!baseName || baseName.length === 0) {
    return defaultBranchImagePath;
  }

  const fileStem = baseName
    .map(part => (/^\d+$/.test(part) ? part : part.charAt(0).toUpperCase()))
    .join('');

  if (!knownBranchImages.has(fileStem)) {
    return defaultBranchImagePath;
  }

  return new URL(`${fileStem}.png`, branchImageBaseUrl).href;
}

function loyaltyBadgeHtml(outlet) {
  const cls = outlet.loyaltyCardAvailable ? 'available' : 'unavailable';
  const text = outlet.loyaltyCardAvailable ? 'Loyalty Card Available' : 'Loyalty Card Unavailable';
  return `<div class="map-loyalty-badge ${cls}">${escapeHtml(text)}</div>`;
}

function getMarkerTooltipContent(outlet) {
  const imagePath = getBranchImagePath(outlet.name);

  return `
    <div class="map-hover-card">
      <img
        class="map-hover-image"
        src="${escapeHtml(imagePath)}"
        alt="${escapeHtml(outlet.name)}"
        loading="lazy"
        onerror="this.onerror=null;this.src='${defaultBranchImagePath}'"
      />
      <div class="map-hover-title">${escapeHtml(outlet.name)}</div>
      ${loyaltyBadgeHtml(outlet)}
    </div>
  `;
}

function expandOutletRegion(region) {
  const collapseEl = document.getElementById(getRegionId(region));
  if (!collapseEl || collapseEl.classList.contains('show')) return;

  const collapseInstance = window.bootstrap?.Collapse.getOrCreateInstance(collapseEl, {
    toggle: false
  });
  collapseInstance?.show();
}

function highlightOutletCard(outletId) {
  document.querySelectorAll('.outlet-card-highlight').forEach(card => {
    card.classList.remove('outlet-card-highlight');
  });

  const card = document.querySelector(`[data-outlet-card-id="${outletId}"]`);
  if (!card) return;

  card.classList.add('outlet-card-highlight');
  window.setTimeout(() => {
    card.classList.remove('outlet-card-highlight');
  }, 2600);
}

function focusOutletCard(outlet) {
  expandOutletRegion(outlet.region);

  window.setTimeout(() => {
    const card = document.querySelector(`[data-outlet-card-id="${outlet.id}"]`);
    if (!card) return;

    highlightOutletCard(outlet.id);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 180);
}

function renderOutlets() {
  const outletGrid = document.getElementById('outletGrid');
  if (!outletGrid) return;

  const grouped = outlets.reduce((acc, outlet) => {
    acc[outlet.region] = acc[outlet.region] || [];
    acc[outlet.region].push(outlet);
    return acc;
  }, {});

  outletGrid.innerHTML = Object.entries(grouped).map(([region, list]) => {
    const collapseId = getRegionId(region);

    return `
      <div class="col-12">
        <div class="region-section">
          <button
            class="region-toggle"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${collapseId}"
            aria-expanded="false"
            aria-controls="${collapseId}"
          >
            <span>${escapeHtml(region)}</span>
            <span class="region-meta">${list.length} outlets</span>
          </button>

          <div id="${collapseId}" class="collapse">
            <div class="row g-4 pt-3">
              ${list.map(outlet => `
                <div class="col-md-6 col-xl-4">
                  <div class="outlet-card h-100" data-outlet-card-id="${escapeHtml(outlet.id)}">
                    <span class="outlet-region-tag">${escapeHtml(outlet.region)}</span>
                    <h4>${escapeHtml(outlet.name)}</h4>
                    <p class="mb-3">${escapeHtml(outlet.address)}</p>
                    ${renderPricingTable(outlet.pricing)}
                    <div class="d-flex flex-wrap gap-2">
                      <button
                        class="btn btn-primary btn-sm show-on-map-btn"
                        type="button"
                        data-outlet-id="${escapeHtml(outlet.id)}"
                      >
                        Show on Map
                      </button>
                      <a
                        class="btn btn-outline-primary btn-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                        href="${getMapsUrl(outlet.mapsQuery)}"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  outletGrid.querySelectorAll('[data-outlet-id]').forEach(button => {
    button.addEventListener('click', () => {
      const outlet = outlets.find(item => item.id === button.dataset.outletId);
      if (outlet) {
        focusOutletOnMap(outlet);
        document.getElementById('location')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function renderOutletDetails(outlet) {
  const detailsEl = document.getElementById('mapOutletDetails');
  if (!detailsEl || !outlet) return;
  const imagePath = getBranchImagePath(outlet.name);

  detailsEl.innerHTML = `
    <div class="map-details-head">
      <img
        class="map-detail-image"
        src="${escapeHtml(imagePath)}"
        alt="${escapeHtml(outlet.name)}"
        loading="lazy"
        onerror="this.onerror=null;this.src='${defaultBranchImagePath}'"
      />
      <span class="map-region-pill">${escapeHtml(outlet.region)} Region</span>
      <h4 class="mb-2 mt-3">${escapeHtml(outlet.name)}</h4>
      ${loyaltyBadgeHtml(outlet)}
      <p class="text-secondary mb-3">${escapeHtml(outlet.address)}</p>
    </div>
    <div class="map-detail-list">
      <div class="map-detail-row">
        <span>Opening</span>
        <strong>24 Hours</strong>
      </div>
      <div class="map-detail-row">
        <span>Area</span>
        <strong>${escapeHtml(outlet.region)}</strong>
      </div>
    </div>
    <div class="mt-4">
      ${renderPricingTable(outlet.pricing)}
    </div>
    <div class="d-flex flex-wrap gap-2 mt-4">
      <a
        class="btn btn-primary btn-sm"
        target="_blank"
        rel="noopener noreferrer"
        href="${getMapsUrl(outlet.mapsQuery)}"
      >
        Get Directions
      </a>
      <button class="btn btn-outline-primary btn-sm" type="button" id="mapResetViewBtn">
        View All Outlets
      </button>
    </div>
  `;

  document.getElementById('mapResetViewBtn')?.addEventListener('click', resetMapView);
}

function setActiveMarker(marker, outlet) {
  if (activeMarker) {
    const previousOutlet = activeMarker.__outletData;
    activeMarker.setStyle(getMarkerStyle(previousOutlet, false));
  }

  activeMarker = marker;
  activeMarker.__outletData = outlet;
  activeMarker.setStyle(getMarkerStyle(outlet, true));
  renderOutletDetails(outlet);
}

function resetMapView() {
  if (!outletMap) return;

  const validOutlets = outlets.filter(outlet => typeof outlet.lat === 'number' && typeof outlet.lng === 'number');
  if (validOutlets.length === 0) return;

  const bounds = window.L.latLngBounds(validOutlets.map(outlet => [outlet.lat, outlet.lng]));
  outletMap.fitBounds(bounds.pad(0.15));
}

function focusOutletOnMap(outlet) {
  if (!outletMap || typeof outlet.lat !== 'number' || typeof outlet.lng !== 'number') return;

  const marker = markerByOutletId.get(outlet.id);
  if (!marker) return;

  outletMap.flyTo([outlet.lat, outlet.lng], 14, {
    animate: true,
    duration: 0.8
  });
  setActiveMarker(marker, outlet);
  marker.openTooltip();
}

function renderMap() {
  const mapEl = document.getElementById('locationMap');
  if (!mapEl || !window.L) return;

  const validOutlets = outlets.filter(outlet => typeof outlet.lat === 'number' && typeof outlet.lng === 'number');
  if (validOutlets.length === 0) {
    mapEl.innerHTML = '<p class="map-fallback mb-0">Outlet coordinates are not available yet.</p>';
    return;
  }

  outletMap = window.L.map(mapEl, {
    scrollWheelZoom: false
  });
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(outletMap);

  for (const outlet of validOutlets) {
    const marker = window.L.circleMarker([outlet.lat, outlet.lng], getMarkerStyle(outlet))
      .addTo(outletMap)
      .bindTooltip(getMarkerTooltipContent(outlet), {
        direction: 'top',
        offset: [0, -8],
        className: 'map-marker-tooltip'
      });

    marker.__outletData = outlet;
    marker.on('click', () => setActiveMarker(marker, outlet));
    markerByOutletId.set(outlet.id, marker);
  }

  resetMapView();
  setActiveMarker(markerByOutletId.get(validOutlets[0].id), validOutlets[0]);
  window.setTimeout(() => outletMap?.invalidateSize(), 0);
  window.addEventListener('resize', () => outletMap?.invalidateSize());
}

function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestOutlet() {
  const nearestResult = document.getElementById('nearestResult');
  if (!nearestResult) return;

  if (!navigator.geolocation) {
    nearestResult.innerHTML =
      '<div class="nearest-placeholder">Geolocation is not supported by your browser.</div>';
    return;
  }

  nearestResult.innerHTML =
    '<div class="nearest-placeholder">Finding your nearest outlet...</div>';

  navigator.geolocation.getCurrentPosition(
    position => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const validOutlets = outlets.filter(
        outlet => typeof outlet.lat === 'number' && typeof outlet.lng === 'number'
      );

      if (validOutlets.length === 0) {
        nearestResult.innerHTML =
          '<div class="nearest-placeholder">No outlet coordinates added yet.</div>';
        return;
      }

      let nearest = validOutlets[0];
      let minDistance = getDistance(userLat, userLng, nearest.lat, nearest.lng);

      for (const outlet of validOutlets) {
        const distance = getDistance(userLat, userLng, outlet.lat, outlet.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = outlet;
        }
      }

      nearestResult.innerHTML = `
        <div class="nearest-result-card">
          <h5>${escapeHtml(nearest.name)}</h5>
          <p class="mb-2">${escapeHtml(nearest.address)}</p>
          <p class="mb-3">${minDistance.toFixed(2)} km away</p>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-primary btn-sm" type="button" id="nearestOutletInfoBtn">
              View Outlet Info
            </button>
            <a
              class="btn btn-outline-primary btn-sm"
              target="_blank"
              rel="noopener noreferrer"
              href="${getMapsUrl(nearest.mapsQuery)}"
            >
              Get Directions
            </a>
          </div>
        </div>
      `;

      focusOutletOnMap(nearest);

      document.getElementById('nearestOutletInfoBtn')?.addEventListener('click', () => {
        focusOutletOnMap(nearest);
        document.getElementById('location')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    () => {
      nearestResult.innerHTML =
        '<div class="nearest-placeholder">Unable to get your location.</div>';
    }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  renderOutlets();
  renderMap();

  const findNearestBtn = document.getElementById('findNearestBtn');
  if (findNearestBtn) {
    findNearestBtn.addEventListener('click', findNearestOutlet);
  }

  const outletCountEl = document.getElementById('outletCount');
  if (outletCountEl) {
    outletCountEl.textContent = String(outlets.length);
  }

  const contactInfoBtn = document.getElementById('contactInfoBtn');
  const contactInfoModalEl = document.getElementById('contactInfoModal');
  const contactConfirmBtn = document.getElementById('contactConfirmBtn');
  if (contactInfoBtn && contactInfoModalEl && window.bootstrap?.Modal) {
    const contactInfoModal = new window.bootstrap.Modal(contactInfoModalEl);
    contactInfoBtn.addEventListener('click', () => {
      contactInfoModal.show();
    });

    contactConfirmBtn?.addEventListener('click', () => {
      window.open(
        'https://wa.me/6597862038?text=Hi%2C%20I%20want%20to%20ask%20about%20your%20laundromat.',
        '_blank',
        'noopener,noreferrer'
      );
    });
  }
});
