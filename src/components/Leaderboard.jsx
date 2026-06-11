import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFlagUrl, processPlayers, getPlayerKey } from '../utils';
import {
  START_YEAR, END_YEAR, ROWS_PER_PAGE, MAX_VISIBLE_PAGES,
  DEBOUNCE_DELAY_MS, STORAGE_KEY_PREFIX, DEFAULT_COUNTRY_FILTER,
  DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, MEDAL_SYMBOLS, MEDAL_COLORS,
} from '../constants';

// ---------- Helper functions ----------
const computeYearlyMedals = (players) => {
  const yearlyRankings = {};
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const yearData = players.map(p => {
      // Create normalized key using lowercase
      const key = `${p.Name.toLowerCase()}|${p.Nationality.toLowerCase()}`;
      return {
        key,
        points: parseFloat(p[year]) || 0,
      };
    });
    yearData.sort((a, b) => b.points - a.points);
    yearlyRankings[year] = yearData;
  }
  const medals = {};
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    yearlyRankings[year].slice(0, 3).forEach((player, idx) => {
      if (!medals[player.key]) medals[player.key] = [];
      medals[player.key].push({ year, placement: idx + 1 });
    });
  }
  return medals;
};

const calculateTotalsAndRanks = (players, activeYears) => {
  const processed = players.map(p => ({
    ...processPlayers([p])[0],
    total: activeYears.reduce((sum, y) => sum + (parseFloat(p[y]) || 0), 0),
  }));
  processed.sort((a, b) => b.total - a.total);
  let rank = 1;
  processed.forEach((p, idx) => {
    if (idx > 0 && p.total !== processed[idx - 1].total) rank = idx + 1;
    p.rank = rank;
  });
  return processed;
};

const filterPlayers = (players, countryFilter, searchTerm) => {
  let filtered = players;
  if (countryFilter !== DEFAULT_COUNTRY_FILTER) {
    filtered = filtered.filter(p => p.nationality === countryFilter);
  }
  if (searchTerm.trim()) {
    const lowerSearch = searchTerm.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(lowerSearch));
  }
  return filtered;
};

const getStorageKey = (region) => `${STORAGE_KEY_PREFIX}_${region}_filters`;

const loadStoredFilters = (region) => {
  const saved = localStorage.getItem(getStorageKey(region));
  if (!saved) return null;
  try {
    const { country, minY, maxY, search } = JSON.parse(saved);
    return {
      country: country || DEFAULT_COUNTRY_FILTER,
      minYear: Math.min(Math.max(minY || DEFAULT_MIN_YEAR, START_YEAR), END_YEAR),
      maxYear: Math.min(Math.max(maxY || DEFAULT_MAX_YEAR, START_YEAR), END_YEAR),
      search: search || '',
    };
  } catch {
    return null;
  }
};

const saveFilters = (region, countryFilter, minYear, maxYear, searchInput) => {
  localStorage.setItem(getStorageKey(region), JSON.stringify({
    country: countryFilter,
    minY: minYear,
    maxY: maxYear,
    search: searchInput,
  }));
};

// ---------- Main component ----------
const Leaderboard = () => {
  const { region } = useParams();
  const navigate = useNavigate();

  const [rawPlayers, setRawPlayers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState(DEFAULT_COUNTRY_FILTER);
  const [countries, setCountries] = useState([]);
  const [minYear, setMinYear] = useState(DEFAULT_MIN_YEAR);
  const [maxYear, setMaxYear] = useState(DEFAULT_MAX_YEAR);
  const [currentPage, setCurrentPage] = useState(1);

  const [playerYearlyMedals, setPlayerYearlyMedals] = useState({});

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/${region === 'eu' ? 'data.json' : 'data_na.json'}`);
        const data = await response.json();
        setRawPlayers(data);
        setCountries([...new Set(data.map(p => p.Nationality))].sort());
        const stored = loadStoredFilters(region);
        if (stored) {
          setCountryFilter(stored.country);
          setMinYear(stored.minYear);
          setMaxYear(stored.maxYear);
          setSearchInput(stored.search);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [region]);

  // Compute yearly medals from raw players (using normalized lowercase keys)
  useEffect(() => {
    if (rawPlayers.length) {
      const medals = computeYearlyMedals(rawPlayers);
      setPlayerYearlyMedals(medals);
    }
  }, [rawPlayers]);

  // Persist filters
  useEffect(() => {
    if (!loading) {
      saveFilters(region, countryFilter, minYear, maxYear, searchInput);
    }
  }, [region, countryFilter, minYear, maxYear, searchInput, loading]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeYears = useMemo(() => {
    const years = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    return years;
  }, [minYear, maxYear]);

  // Recalculate totals & ranks
  useEffect(() => {
    if (rawPlayers.length) {
      setPlayers(calculateTotalsAndRanks(rawPlayers, activeYears));
    }
  }, [rawPlayers, activeYears]);

  // Apply filters
  useEffect(() => {
    const filteredList = filterPlayers(players, countryFilter, debouncedSearch);
    setFiltered(filteredList);
    setCurrentPage(1);
  }, [players, countryFilter, debouncedSearch]);

  const resetFilters = () => {
    setCountryFilter(DEFAULT_COUNTRY_FILTER);
    setMinYear(DEFAULT_MIN_YEAR);
    setMaxYear(DEFAULT_MAX_YEAR);
    setSearchInput('');
    setDebouncedSearch('');
  };

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const getPageNumbers = useCallback(() => {
    let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);
    if (end - start + 1 < MAX_VISIBLE_PAGES) {
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="container">
        <div className="leaderboard-container">Loading dispatch records...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Link to="/" className="back-link">← BACK TO MAIN PAGE</Link>
      <div className="leaderboard-container fade-slide">
        <h2>{region === 'eu' ? 'EUROPEAN INFANTRY' : 'NORTH AMERICAN INFANTRY'} · RANKING</h2>
        <div className="filter-bar">
          <div className="filter-group">
            <label>NATIONALITY</label>
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>
              <option>{DEFAULT_COUNTRY_FILTER}</option>
              {countries.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>SEARCH</label>
            <input
              type="text"
              placeholder="Player name..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>YEAR RANGE</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                min={START_YEAR}
                max={END_YEAR}
                value={minYear}
                onChange={e => setMinYear(Math.min(Number(e.target.value), maxYear))}
                style={{ width: '80px', background: '#1f1c18', border: '1px solid #3a332b', padding: '6px', color: '#e7dfd3' }}
              />
              <span>—</span>
              <input
                type="number"
                min={START_YEAR}
                max={END_YEAR}
                value={maxYear}
                onChange={e => setMaxYear(Math.max(Number(e.target.value), minYear))}
                style={{ width: '80px', background: '#1f1c18', border: '1px solid #3a332b', padding: '6px', color: '#e7dfd3' }}
              />
            </div>
          </div>
          <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={resetFilters}
              style={{ background: '#d97a54', border: 'none', padding: '10px 16px', color: '#0c0b0a', fontWeight: 'bold', cursor: 'pointer' }}
            >
              RESET FILTERS
            </button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th className="rank-col">RANK</th>
              <th className="flag-col">NATION</th>
              <th>NAME</th>
              <th className="points-col">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => {
              // Look up medals using normalized key from processed player
              const playerKey = getPlayerKey(p);
              const medals = (playerYearlyMedals[playerKey] || []).sort((a, b) => a.year - b.year);
              return (
                <tr key={p.name}>
                  <td className="rank-col">{p.rank}</td>
                  <td className="flag-col">
                    <img className="flag-img" src={getFlagUrl(p.nationality)} alt={p.nationality} loading="lazy" />
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <div>
                      <span className="clickable-name" onClick={() => navigate(`/profile/${region}/${encodeURIComponent(p.name)}`)}>
                        {p.name}
                      </span>
                    </div>
                    {medals.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap' }}>
                        {medals.map(({ year, placement }) => (
                          <span
                            key={year}
                            style={{
                              background: MEDAL_COLORS[placement],
                              color: '#0c0b0a',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              margin: '2px 4px 2px 0',
                              borderRadius: '12px',
                              cursor: 'help',
                            }}
                            title={`${placement === 1 ? '1st' : placement === 2 ? '2nd' : '3rd'} place in ${year}`}
                          >
                            {year} {MEDAL_SYMBOLS[placement]}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="points-col">{p.total.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>PREV</button>
            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                className={pageNum === currentPage ? 'active' : ''}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>NEXT</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;