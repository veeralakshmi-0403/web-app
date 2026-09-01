import { useEffect, useMemo, useState } from "react";
import { MapContainer, Polygon, Popup, TileLayer } from "react-leaflet";
import {
  Download,
  FileUp,
  Layers3,
  MapPin,
  Menu,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { loadPlots, type Plot } from "./data/plots";
import { mapCenter } from "./data/mapConfig";

type SortKey = "number" | "type" | "facing" | "extent" | "cost" | "status";

function App() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selected, setSelected] = useState<Plot>();
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [facing, setFacing] = useState("All facings");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("All statuses");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>(
    { key: "number", direction: "asc" },
  );
  const [maxCost, setMaxCost] = useState(10000000);
  const [maxExtent, setMaxExtent] = useState(3500);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    loadPlots()
      .then((loaded) => {
        setPlots(loaded);
        setSelected(loaded[0]);
      })
      .catch(() => setLoadError("Could not load the supplied plot records."));
  }, []);
  const filteredPlots = useMemo(
    () =>
      [
        ...plots.filter(
          (plot) =>
            plot.number.toLowerCase().includes(search.toLowerCase()) &&
            (facing === "All facings" || plot.facing === facing) &&
            (type === "All types" || plot.type === type) &&
            (status === "All statuses" || plot.status === status) &&
            plot.cost <= maxCost &&
            plot.extent <= maxExtent,
        ),
      ].sort((first, second) => {
        const firstValue =
          sort.key === "number"
            ? first.number
            : sort.key === "type"
              ? first.type
              : sort.key === "facing"
                ? first.facing
                : sort.key === "extent"
                  ? first.extent
                  : sort.key === "cost"
                    ? first.cost
                    : first.status;
        const secondValue =
          sort.key === "number"
            ? second.number
            : sort.key === "type"
              ? second.type
              : sort.key === "facing"
                ? second.facing
                : sort.key === "extent"
                  ? second.extent
                  : sort.key === "cost"
                    ? second.cost
                    : second.status;
        const comparison =
          typeof firstValue === "number" && typeof secondValue === "number"
            ? firstValue - secondValue
            : String(firstValue).localeCompare(String(secondValue), undefined, {
                numeric: true,
              });
        return sort.direction === "asc" ? comparison : -comparison;
      }),
    [plots, search, facing, type, status, maxCost, maxExtent, sort],
  );
  useEffect(() => {
    const keys: SortKey[] = [
      "number",
      "type",
      "facing",
      "extent",
      "cost",
      "status",
    ];
    const headers = Array.from(
      document.querySelectorAll<HTMLElement>(".table-header span"),
    );
    const handlers = headers.map((header, index) => {
      const handler = () =>
        setSort((current) => ({
          key: keys[index],
          direction:
            current.key === keys[index] && current.direction === "asc"
              ? "desc"
              : "asc",
        }));
      header.addEventListener("click", handler);
      return { header, handler };
    });
    return () =>
      handlers.forEach(({ header, handler }) =>
        header.removeEventListener("click", handler),
      );
  }, []);
  const activePlot = selected ?? filteredPlots[0];
  const reset = () => {
    setSearch("");
    setFacing("All facings");
    setType("All types");
    setStatus("All statuses");
    setMaxCost(10000000);
    setMaxExtent(3500);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Layers3 size={18} />
          </div>
          <div>
            <p className="eyebrow">TNHB / TIRUNELVELI</p>
            <h1>Palai Phase VII</h1>
          </div>
        </div>
        <div className="top-actions">
          <span className="data-state">
            <i />{" "}
            {plots.length
              ? `Live dataset · ${plots.length} plots`
              : "Loading plot records"}
          </span>
          <button className="outline-button">
            <Download size={15} /> Export
          </button>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileFilters(!mobileFilters)}
            aria-label="Open filters"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow accent">PLOT EXPLORER</p>
          <h2>
            Find your place
            <br />
            <em>in Palai.</em>
          </h2>
          <p className="intro-copy">
            Explore residential plots across the HIG, MIG, and LIG layouts.
            Filter by what matters to you.
          </p>
        </div>
        <div className="intro-meta">
          <span>Last synced</span>
          <strong>08 FEB 2025</strong>
          <span className="divider" />
          <span>Location</span>
          <strong>Kulavanikarpuram, Tirunelveli</strong>
        </div>
      </section>
      <section className="workspace">
        <aside className={`filter-panel ${mobileFilters ? "is-open" : ""}`}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">REFINE RESULTS</p>
              <h3>Plot filters</h3>
            </div>
            <button
              className="icon-button close-filters"
              onClick={() => setMobileFilters(false)}
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          </div>
          <label className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plot number"
            />
          </label>
          <div className="filter-group">
            <label>Layout type</label>
            <div className="segmented">
              <button
                className={type === "All types" ? "active" : ""}
                onClick={() => setType("All types")}
              >
                All
              </button>
              <button
                className={type === "HIG" ? "active" : ""}
                onClick={() => setType("HIG")}
              >
                HIG
              </button>
              <button
                className={type === "MIG" ? "active" : ""}
                onClick={() => setType("MIG")}
              >
                MIG
              </button>
              <button
                className={type === "LIG" ? "active" : ""}
                onClick={() => setType("LIG")}
              >
                LIG
              </button>
            </div>
          </div>
          <div className="filter-group">
            <label>Facing</label>
            <select
              value={facing}
              onChange={(event) => setFacing(event.target.value)}
            >
              <option>All facings</option>
              <option>North</option>
              <option>South</option>
              <option>East</option>
              <option>West</option>
              <option>Unspecified</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Availability</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All statuses</option>
              <option>Available</option>
              <option>Allotted</option>
            </select>
          </div>
          <div className="filter-group range-group">
            <div>
              <label>Maximum unit cost</label>
              <output>₹{(maxCost / 100000).toFixed(0)}L</output>
            </div>
            <input
              type="range"
              min="5000000"
              max="16000000"
              step="50000"
              value={maxCost}
              onChange={(event) => setMaxCost(Number(event.target.value))}
            />
          </div>
          <div className="filter-group range-group">
            <div>
              <label>Maximum area extent</label>
              <output>{maxExtent.toLocaleString()} sq.ft</output>
            </div>
            <input
              type="range"
              min="1500"
              max="6000"
              step="10"
              value={maxExtent}
              onChange={(event) => setMaxExtent(Number(event.target.value))}
            />
          </div>
          <button className="reset-button" onClick={reset}>
            <RotateCcw size={14} /> Reset filters
          </button>
        </aside>
        <div className="map-column">
          <div className="map-toolbar">
            <span>
              <MapPin size={14} /> SATELLITE VIEW
            </span>
          </div>
          <MapContainer
            center={mapCenter}
            zoom={16}
            maxZoom={23}
            scrollWheelZoom
            doubleClickZoom
            touchZoom
            className="map"
          >
            <TileLayer
              attribution="&copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={23}
              maxZoom={23}
            />
            {filteredPlots.map((plot) => {
              const lat = mapCenter[0] + plot.offset[0];
              const lng = mapCenter[1] + plot.offset[1];
              const bounds: [number, number][] = [
                [lat - 0.00016, lng - 0.00028],
                [lat - 0.00016, lng + 0.00028],
                [lat + 0.00016, lng + 0.00028],
                [lat + 0.00016, lng - 0.00028],
              ];
              return (
                <div key={plot.id}>
                  <Polygon
                    positions={bounds}
                    pathOptions={{
                      color: "transparent",
                      fillColor: "transparent",
                      fillOpacity: 0,
                      opacity: 0,
                      weight: 0,
                    }}
                    eventHandlers={{
                      click: () => setSelected(plot),
                    }}
                  >
                    <Popup>
                      <strong>{plot.number}</strong>
                      <br />
                      {plot.type} · {plot.status}
                    </Popup>
                  </Polygon>
                </div>
              );
            })}
          </MapContainer>
          <div className="map-legend">
            <span>
              <i className="legend-hig" /> HIG
            </span>
            <span>
              <i className="legend-mig" /> MIG
            </span>
            <span>
              <i className="legend-selected" /> Selected
            </span>
          </div>
          <section className="register">
            <div className="register-head">
              <div>
                <p className="eyebrow">PLOT REGISTER</p>
                <h3>{loadError || `${filteredPlots.length} matching plots`}</h3>
              </div>
              <span className="register-sort">
                Sorted by <strong>plot number</strong> ↕
              </span>
            </div>
            <div className="plot-table">
              <div className="table-header">
                <span>Plot</span>
                <span>Layout</span>
                <span>Facing</span>
                <span>Area</span>
                <span>Unit cost</span>
                <span>Status</span>
              </div>
              {filteredPlots.map((plot) => (
                <button
                  className={`plot-row ${activePlot?.id === plot.id ? "selected" : ""}`}
                  key={plot.id}
                  onClick={() => setSelected(plot)}
                >
                  <strong>{plot.number}</strong>
                  <span className={`type-pill ${plot.type.toLowerCase()}`}>
                    {plot.type}
                  </span>
                  <span>{plot.facing}</span>
                  <span>{plot.extent.toLocaleString()} sq.ft</span>
                  <span>₹{(plot.cost / 100000).toFixed(2)}L</span>
                  <span className={`status ${plot.status.toLowerCase()}`}>
                    <i />
                    {plot.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
      {activePlot && (
        <aside className="detail-drawer">
          <div className="drawer-label">
            <p className="eyebrow">SELECTED PLOT</p>
            <span className={`status ${activePlot.status.toLowerCase()}`}>
              <i />
              {activePlot.status}
            </span>
          </div>
          <div className="plot-title">
            <h2>{activePlot.number}</h2>
            <span>{activePlot.type} / RESIDENTIAL</span>
          </div>
          <div className="price">
            <span>UNIT COST</span>
            <strong>₹{activePlot.cost.toLocaleString("en-IN")}</strong>
          </div>
          <div className="detail-grid">
            <div>
              <span>Area extent</span>
              <strong>{activePlot.extent.toLocaleString()} sq.ft</strong>
            </div>
            <div>
              <span>Door facing</span>
              <strong>{activePlot.facing}</strong>
            </div>
            <div>
              <span>Survey no.</span>
              <strong>572 Part</strong>
            </div>
            <div>
              <span>Geometry</span>
              <strong className="muted">{activePlot.geometryStatus}</strong>
            </div>
          </div>
          <div className="evidence">
            <p className="eyebrow">SURVEY EVIDENCE</p>
            <div>
              <span>N / E / S / W</span>
              <strong>
                {activePlot.measurements.north || "-"} /{" "}
                {activePlot.measurements.east || "-"} /{" "}
                {activePlot.measurements.south || "-"} /{" "}
                {activePlot.measurements.west || "-"}
              </strong>
            </div>
            <div>
              <span>North boundary</span>
              <strong>{activePlot.boundaries.north || "Not specified"}</strong>
            </div>
          </div>
          {activePlot.surveyUrl ? (
            <a
              className="primary-button"
              href={activePlot.surveyUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FileUp size={15} /> View survey document
            </a>
          ) : (
            <button className="primary-button" disabled>
              <FileUp size={15} /> Survey unavailable
            </button>
          )}
        </aside>
      )}
      <footer>
        <span>TNHB PALAI PHASE VII / PROPERTY EXPLORER</span>
        <span>
          Data is sourced from supplied property records. Verify details with
          TNHB before purchase.
        </span>
      </footer>
    </main>
  );
}

export default App;
