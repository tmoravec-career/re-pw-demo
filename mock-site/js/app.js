const AUTH_KEY = "re-pw-demo-user";
const SAVED_KEY = "re-pw-demo-saved";
const LOAD_MS = 1000;

const STATUS_LABEL = {
  active: "For sale",
  pending: "Pending",
  sold: "Sold",
};

const TYPE_LABEL = {
  house: "House",
  condo: "Condo",
  townhouse: "Townhouse",
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatSqft(sqft) {
  return `${new Intl.NumberFormat("en-US").format(sqft)} sqft`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function getUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

function getSaved() {
  const raw = localStorage.getItem(SAVED_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setSaved(ids) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

function toggleSaved(id) {
  const saved = getSaved();
  const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
  setSaved(next);
}

// Rule: pending and sold listings cannot be saved.
// KNOWN BUG: pending is still treated as saveable. Only sold is excluded.
function canSave(listing) {
  return listing.status !== "sold";
}

function paintSession() {
  const user = getUser();
  const loginLink = document.querySelector('[data-testid="login-link"]');
  const savedLink = document.querySelector('[data-testid="saved-link"]');
  const currentUser = document.querySelector('[data-testid="current-user"]');
  if (!loginLink || !savedLink || !currentUser) return;

  loginLink.hidden = Boolean(user);
  savedLink.hidden = !user;
  currentUser.hidden = !user;
  currentUser.textContent = user ? user.email : "";
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${url}`);
  }
  return response.json();
}

async function fetchListings(delay) {
  if (delay) await sleep(LOAD_MS);
  return fetchJson("data/listings.json");
}

function readFilter() {
  const city = document.querySelector("#city");
  const minPrice = document.querySelector("#min-price");
  const maxPrice = document.querySelector("#max-price");
  const minBeds = document.querySelector("#min-beds");
  const minBaths = document.querySelector("#min-baths");
  const status = document.querySelector("#status");
  const types = [...document.querySelectorAll("input[name='home-type']:checked")].map((input) => input.value);
  return {
    city: city ? city.value : "",
    minPrice: minPrice ? minPrice.value : "",
    maxPrice: maxPrice ? maxPrice.value : "",
    minBeds: minBeds ? minBeds.value : "",
    minBaths: minBaths ? minBaths.value : "",
    status: status ? status.value : "",
    types,
  };
}

function readSort() {
  const sort = document.querySelector("#sort");
  return sort ? sort.value : "desk";
}

function sortListings(listings, sort) {
  const ranked = [...listings];
  if (sort === "price-asc") ranked.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  else if (sort === "price-desc") ranked.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
  else if (sort === "beds-desc") ranked.sort((a, b) => b.beds - a.beds || a.price - b.price || a.id.localeCompare(b.id));
  return ranked;
}

function paymentAmount(price, downPercent, annualRate, years) {
  const principal = price * (1 - downPercent / 100);
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return Math.round(principal / months);
  const factor = (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
  return Math.round(principal * factor);
}

const REGIONS = [
  {
    id: "metro",
    name: "Twin Cities",
    west: -93.36,
    east: -93.02,
    south: 44.9,
    north: 45.02,
    water: [
      [45.02, -93.28],
      [44.98, -93.26],
      [44.955, -93.24],
      [44.93, -93.22],
      [44.9, -93.2],
    ],
  },
  {
    id: "duluth",
    name: "Duluth",
    west: -92.2,
    east: -91.98,
    south: 46.72,
    north: 46.84,
    water: [
      [46.84, -92.06],
      [46.8, -92.03],
      [46.74, -92.02],
    ],
  },
  {
    id: "rochester",
    name: "Rochester",
    west: -92.58,
    east: -92.35,
    south: 43.97,
    north: 44.08,
    water: [
      [44.06, -92.5],
      [44.02, -92.47],
      [43.98, -92.45],
    ],
  },
];

function project(lat, lng, region) {
  return {
    x: ((lng - region.west) / (region.east - region.west)) * 100,
    y: ((region.north - lat) / (region.north - region.south)) * 100,
  };
}

function inRegion(listing, region) {
  return listing.lat <= region.north && listing.lat >= region.south && listing.lng <= region.east && listing.lng >= region.west;
}

function groupsFor(listings) {
  const claimed = new Set();
  const groups = [];
  for (const region of REGIONS) {
    const inside = listings.filter((listing) => inRegion(listing, region));
    inside.forEach((listing) => claimed.add(listing.id));
    if (inside.length) groups.push({ region, listings: inside });
  }
  for (const listing of listings) {
    if (claimed.has(listing.id)) continue;
    groups.push({
      region: {
        id: `listing-${listing.id}`,
        name: listing.city,
        west: listing.lng - 0.08,
        east: listing.lng + 0.08,
        south: listing.lat - 0.04,
        north: listing.lat + 0.04,
        water: [],
      },
      listings: [listing],
    });
  }
  return groups;
}

function renderPin(listing, region, link) {
  const point = project(listing.lat, listing.lng, region);
  const label = `${listing.address}, ${listing.city}, ${formatPrice(listing.price)}`;
  const href = link ? ` href="listing.html?id=${escapeHtml(listing.id)}"` : ` role="img"`;
  const tag = link ? "a" : "span";
  return `
    <${tag}
      class="pin status-${escapeHtml(listing.status)}"
      style="left:${point.x.toFixed(2)}%;top:${point.y.toFixed(2)}%"
      data-testid="listing-pin"
      data-id="${escapeHtml(listing.id)}"
      data-city="${escapeHtml(listing.city)}"
      aria-label="${escapeHtml(label)}"
      ${href}
    >
      <span class="pin-label">${escapeHtml(listing.address)}</span>
      <span class="pin-dot"></span>
    </${tag}>
  `;
}

function renderRegion(group, link) {
  const { region, listings } = group;
  const water = region.water
    .map(([lat, lng]) => {
      const point = project(lat, lng, region);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
  return `
    <section class="region" data-region="${escapeHtml(region.id)}">
      <p class="region-name">${escapeHtml(region.name)}</p>
      <div class="region-frame">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <rect class="region-land" x="0" y="0" width="100" height="100"></rect>
          ${water ? `<polyline class="region-water" points="${water}"></polyline>` : ""}
        </svg>
        ${listings.map((listing) => renderPin(listing, region, link)).join("")}
      </div>
    </section>
  `;
}

function renderMap(container, listings, link) {
  if (!container) return;
  if (listings.length === 0) {
    container.innerHTML = `<p class="map-empty" data-testid="map-empty">No houses on the map</p>`;
    return;
  }
  const groups = groupsFor(listings);
  container.innerHTML = `<div class="regions" data-count="${groups.length}">${groups.map((group) => renderRegion(group, link)).join("")}</div>`;
}

function highlightPin(mapEl, id) {
  if (!mapEl) return;
  mapEl.querySelectorAll("[data-testid='listing-pin']").forEach((pin) => {
    pin.classList.toggle("is-hot", pin.dataset.id === id);
  });
}

function bindPinHighlight(listEl, mapEl) {
  const idFromEvent = (event) => {
    const card = event.target.closest("[data-testid='listing-card']");
    return card ? card.dataset.id : "";
  };
  listEl.addEventListener("mouseover", (event) => highlightPin(mapEl, idFromEvent(event)));
  listEl.addEventListener("mouseleave", () => highlightPin(mapEl, ""));
  listEl.addEventListener("focusin", (event) => {
    const id = idFromEvent(event);
    if (id) highlightPin(mapEl, id);
  });
}

function matches(listing, filter) {
  const query = filter.city.trim().toLowerCase();
  if (query && !`${listing.address} ${listing.city}`.toLowerCase().includes(query)) return false;
  if (filter.minPrice !== "" && listing.price < Number(filter.minPrice)) return false;
  if (filter.maxPrice !== "" && listing.price > Number(filter.maxPrice)) return false;
  if (filter.minBeds !== "" && listing.beds < Number(filter.minBeds)) return false;
  if (filter.minBaths !== "" && listing.baths < Number(filter.minBaths)) return false;
  if (filter.status && listing.status !== filter.status) return false;
  if (filter.types.length && !filter.types.includes(listing.type)) return false;
  return true;
}

function renderCard(listing) {
  const saved = getSaved().includes(listing.id);
  const showSave = getUser() && canSave(listing);
  const saveLabel = saved ? "Unsave listing" : "Save listing";
  const saveButton = showSave
    ? `<button type="button" data-testid="save-listing" data-id="${escapeHtml(listing.id)}" aria-pressed="${saved}">${saveLabel}</button>`
    : "";

  return `
    <article
      class="listing"
      data-testid="listing-card"
      data-id="${escapeHtml(listing.id)}"
      data-price="${listing.price}"
      data-beds="${listing.beds}"
      data-baths="${listing.baths}"
      data-sqft="${listing.sqft}"
      data-type="${escapeHtml(listing.type)}"
      data-status="${escapeHtml(listing.status)}"
      data-city="${escapeHtml(listing.city)}"
    >
      <div>
        <a href="listing.html?id=${escapeHtml(listing.id)}">${escapeHtml(listing.address)}</a>
        <p class="meta">
          ${escapeHtml(listing.city)}
          · ${TYPE_LABEL[listing.type]}
          · ${listing.beds} bd
          · ${listing.baths} ba
          · ${formatSqft(listing.sqft)}
          · <span class="status status-${escapeHtml(listing.status)}">${STATUS_LABEL[listing.status]}</span>
        </p>
      </div>
      <div class="price-col">
        <p class="price">${formatPrice(listing.price)}</p>
        ${saveButton}
      </div>
    </article>
  `;
}

function renderList(container, listings) {
  container.innerHTML = listings.map(renderCard).join("");
}

function showLoadError(errorEl, loadingEl) {
  if (loadingEl) loadingEl.hidden = true;
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = "Listings could not be loaded.";
  }
}

function bootListings() {
  const loadingEl = document.querySelector('[data-testid="loading"]');
  const errorEl = document.querySelector('[data-testid="load-error"]');
  const emptyEl = document.querySelector('[data-testid="empty-state"]');
  const countEl = document.querySelector('[data-testid="result-count"]');
  const listEl = document.querySelector("#listings");
  const mapEl = document.querySelector("#map");
  const form = document.querySelector("#filters");
  let listings = [];

  const render = () => {
    const visible = sortListings(
      listings.filter((listing) => matches(listing, readFilter())),
      readSort(),
    );
    renderList(listEl, visible);
    renderMap(mapEl, visible, true);
    countEl.hidden = false;
    countEl.dataset.count = String(visible.length);
    countEl.textContent = visible.length === 1 ? "1 listing" : `${visible.length} listings`;
    emptyEl.hidden = visible.length !== 0;
  };

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-testid='save-listing']");
    if (!button) return;
    toggleSaved(button.dataset.id);
    render();
  });

  bindPinHighlight(listEl, mapEl);
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", render);
  form.addEventListener("change", render);

  fetchListings(true)
    .then((loaded) => {
      listings = loaded;
      loadingEl.hidden = true;
      render();
    })
    .catch(() => showLoadError(errorEl, loadingEl));
}

function bootDetail() {
  const root = document.querySelector("#detail");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  fetchListings(false)
    .then((listings) => {
      const listing = listings.find((item) => item.id === id);
      if (!listing) {
        root.innerHTML = `<h1 data-testid="not-found">Listing not found</h1>
          <p class="lede">That id is not on the desk.</p>`;
        return;
      }

      const saved = getSaved().includes(listing.id);
      const showSave = getUser() && canSave(listing);
      const saveLabel = saved ? "Unsave listing" : "Save listing";
      root.innerHTML = `
        <article
          data-testid="listing-detail"
          data-id="${escapeHtml(listing.id)}"
          data-price="${listing.price}"
          data-beds="${listing.beds}"
          data-status="${escapeHtml(listing.status)}"
        >
          <h1>${escapeHtml(listing.address)}</h1>
          <p class="lede">${escapeHtml(listing.city)} · ${TYPE_LABEL[listing.type]} · built ${listing.yearBuilt}</p>
          <div class="panel">
            <p class="price">${formatPrice(listing.price)}</p>
            <p class="meta">${listing.beds} bd · ${listing.baths} ba · ${formatSqft(listing.sqft)} · <span class="status status-${escapeHtml(listing.status)}">${STATUS_LABEL[listing.status]}</span></p>
            ${
              showSave
                ? `<p><button type="button" data-testid="save-listing" data-id="${escapeHtml(listing.id)}" aria-pressed="${saved}">${saveLabel}</button></p>`
                : ""
            }
          </div>
          <form id="mortgage" class="mortgage">
            <h2>Monthly payment</h2>
            <p class="lede">Principal and interest. Taxes and insurance are not included.</p>
            <div class="mortgage-fields">
              <label>
                Down payment
                <input id="down" name="down" type="number" min="0" max="100" step="1" value="20" />
              </label>
              <label>
                Interest rate
                <input id="rate" name="rate" type="number" min="0" max="25" step="0.1" value="6.5" />
              </label>
              <label>
                Years
                <select id="term" name="term">
                  <option value="30" selected>30</option>
                  <option value="15">15</option>
                </select>
              </label>
            </div>
            <p class="payment" data-testid="monthly-payment" data-amount=""></p>
          </form>
          <div class="detail-map" data-testid="listing-map"></div>
        </article>
      `;
      renderMap(root.querySelector("[data-testid='listing-map']"), [listing], false);
      const paymentEl = root.querySelector("[data-testid='monthly-payment']");
      const updatePayment = () => {
        const down = Number(root.querySelector("#down").value);
        const rate = Number(root.querySelector("#rate").value);
        const years = Number(root.querySelector("#term").value);
        const amount = paymentAmount(listing.price, down, rate, years);
        paymentEl.dataset.amount = String(amount);
        paymentEl.textContent = `${formatPrice(amount)} / month`;
      };
      root.querySelector("#mortgage").addEventListener("input", updatePayment);
      updatePayment();

      const button = root.querySelector("[data-testid='save-listing']");
      if (!button) return;
      button.addEventListener("click", () => {
        toggleSaved(listing.id);
        bootDetail();
      });
    })
    .catch(() => {
      root.innerHTML = `<p data-testid="load-error">Listings could not be loaded.</p>`;
    });
}

function bootLogin() {
  const form = document.querySelector("#login-form");
  const errorEl = document.querySelector('[data-testid="login-error"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    const user = await fetchJson("data/user.json");
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    if (email === user.email && password === user.password) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: user.email }));
      location.assign("index.html");
      return;
    }
    errorEl.hidden = false;
  });
}

function bootSaved() {
  if (!getUser()) {
    location.replace("login.html");
    return;
  }

  const listEl = document.querySelector("#listings");
  const mapEl = document.querySelector("#map");
  const emptyEl = document.querySelector('[data-testid="saved-empty"]');
  const errorEl = document.querySelector('[data-testid="load-error"]');
  let listings = [];

  const render = () => {
    const savedIds = new Set(getSaved());
    const mine = listings.filter((listing) => savedIds.has(listing.id));
    renderList(listEl, mine);
    renderMap(mapEl, mine, true);
    emptyEl.hidden = mine.length !== 0;
  };

  bindPinHighlight(listEl, mapEl);

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-testid='save-listing']");
    if (!button) return;
    toggleSaved(button.dataset.id);
    render();
  });

  fetchListings(false)
    .then((loaded) => {
      listings = loaded;
      render();
    })
    .catch(() => {
      errorEl.hidden = false;
    });
}

paintSession();

const pageName = document.body.dataset.page;
if (pageName === "listings") bootListings();
if (pageName === "detail") bootDetail();
if (pageName === "login") bootLogin();
if (pageName === "saved") bootSaved();
