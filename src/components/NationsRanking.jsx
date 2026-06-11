import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFlagUrl, getCountryColors } from '../utils';
import {
  START_YEAR, END_YEAR, STORAGE_KEY_PREFIX, DEFAULT_COUNTRY_FILTER,
  DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR, MEDAL_SYMBOLS, MEDAL_COLORS,
} from '../constants';

// ---------- Helper functions ----------
const getStorageKey = (region) => `${STORAGE_KEY_PREFIX}_nations_${region}_filters`;

const loadStoredFilters = (region) => {
  const saved = localStorage.getItem(getStorageKey(region));
  if (!saved) return null;
  try {
    const { minY, maxY, search, country } = JSON.parse(saved);
    return {
      minYear: Math.min(Math.max(minY || DEFAULT_MIN_YEAR, START_YEAR), END_YEAR),
      maxYear: Math.min(Math.max(maxY || DEFAULT_MAX_YEAR, START_YEAR), END_YEAR),
      search: search || '',
      country: country || DEFAULT_COUNTRY_FILTER,
    };
  } catch {
    return null;
  }
};

const saveFilters = (region, minYear, maxYear, search, countryFilter) => {
  localStorage.setItem(getStorageKey(region), JSON.stringify({
    minY: minYear, maxY: maxYear, search, country: countryFilter,
  }));
};

// Dense ranking for ties
const applyDenseRanking = (items) => {
  const ranked = [];
  let currentRank = 1;
  let i = 0;
  while (i < items.length) {
    let j = i;
    while (j < items.length && items[j].points === items[i].points) j++;
    for (let k = i; k < j; k++) ranked.push({ ...items[k], rank: currentRank });
    currentRank += (j - i);
    i = j;
  }
  return ranked;
};

// Compute yearly top‑3 medals for players (used in popup)
const computePlayerYearlyMedals = (players) => {
  const medals = {};
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const yearData = players.map(p => ({
      key: `${p.Name}|${p.Nationality}`,
      points: parseFloat(p[year]) || 0,
    }));
    yearData.sort((a, b) => b.points - a.points);
    yearData.slice(0, 3).forEach((player, idx) => {
      if (!medals[player.key]) medals[player.key] = [];
      medals[player.key].push({ year, placement: idx + 1 });
    });
  }
  return medals;
};

// Compute nation yearly medals (with dense ranking) and medal counts
const computeNationMedals = (players) => {
  const yearlyMedals = {};
  const medalCounts = {};
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const pointsMap = new Map();
    players.forEach(p => {
      const nation = p.Nationality;
      pointsMap.set(nation, (pointsMap.get(nation) || 0) + (parseFloat(p[year]) || 0));
    });
    const sorted = Array.from(pointsMap.entries())
      .map(([nation, points]) => ({ nation, points }))
      .sort((a, b) => b.points - a.points);
    const ranked = applyDenseRanking(sorted);
    yearlyMedals[year] = ranked.filter(r => r.rank <= 3);
    yearlyMedals[year].forEach(m => {
      if (!medalCounts[m.nation]) medalCounts[m.nation] = { gold: 0, silver: 0, bronze: 0 };
      if (m.rank === 1) medalCounts[m.nation].gold++;
      else if (m.rank === 2) medalCounts[m.nation].silver++;
      else medalCounts[m.nation].bronze++;
    });
  }
  return { yearlyMedals, medalCounts };
};

// Compute overall nation totals for selected years
const computeNationTotals = (players, activeYears) => {
  const map = new Map();
  players.forEach(p => {
    const nation = p.Nationality;
    const total = activeYears.reduce((sum, y) => sum + (parseFloat(p[y]) || 0), 0);
    if (!map.has(nation)) map.set(nation, { name: nation, total: 0, players: [] });
    const entry = map.get(nation);
    entry.total += total;
    entry.players.push({ name: p.Name, total });
  });
  const nations = Array.from(map.values());
  nations.sort((a, b) => b.total - a.total);
  let rank = 1;
  nations.forEach((n, idx) => {
    if (idx > 0 && n.total !== nations[idx - 1].total) rank = idx + 1;
    n.rank = rank;
  });
  return nations;
};

// ---------- Main component ----------
const NationsRanking = () => {
  const { region } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minYear, setMinYear] = useState(DEFAULT_MIN_YEAR);
  const [maxYear, setMaxYear] = useState(DEFAULT_MAX_YEAR);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState(DEFAULT_COUNTRY_FILTER);
  const [countries, setCountries] = useState([]);
  const [playerYearlyMedals, setPlayerYearlyMedals] = useState({});
  const [yearlyNationMedals, setYearlyNationMedals] = useState({});
  const [nationMedalCounts, setNationMedalCounts] = useState({});
  const [nationTotals, setNationTotals] = useState([]);
  const [filteredNations, setFilteredNations] = useState([]);
  const [selectedNation, setSelectedNation] = useState(null);
  const [nationPlayers, setNationPlayers] = useState([]);
  const [showNationPopup, setShowNationPopup] = useState(false);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/${region === 'eu' ? 'data.json' : 'data_na.json'}`);
        const data = await response.json();
        setPlayers(data);
        setCountries([...new Set(data.map(p => p.Nationality))].sort());
        const stored = loadStoredFilters(region);
        if (stored) {
          setMinYear(stored.minYear);
          setMaxYear(stored.maxYear);
          setSearch(stored.search);
          setCountryFilter(stored.country);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [region]);

  // Compute player yearly medals (for popup)
  useEffect(() => {
    if (players.length) setPlayerYearlyMedals(computePlayerYearlyMedals(players));
  }, [players]);

  // Compute nation medals and counts
  useEffect(() => {
    if (players.length) {
      const { yearlyMedals, medalCounts } = computeNationMedals(players);
      setYearlyNationMedals(yearlyMedals);
      setNationMedalCounts(medalCounts);
    }
  }, [players]);

  // Persist filters
  useEffect(() => {
    if (!loading) {
      saveFilters(region, minYear, maxYear, search, countryFilter);
    }
  }, [region, minYear, maxYear, search, countryFilter, loading]);

  const activeYears = useMemo(() => {
    const years = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    return years;
  }, [minYear, maxYear]);

  // Recompute nation totals when players or activeYears change
  useEffect(() => {
    if (players.length) {
      setNationTotals(computeNationTotals(players, activeYears));
    }
  }, [players, activeYears]);

  // Apply filters (search & country filter)
  useEffect(() => {
    let filtered = nationTotals;
    if (countryFilter !== DEFAULT_COUNTRY_FILTER) {
      filtered = filtered.filter(n => n.name === countryFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(n => n.name.toLowerCase().includes(term));
    }
    setFilteredNations(filtered);
  }, [nationTotals, countryFilter, search]);

  const handleNationClick = (nation) => {
    const sortedPlayers = [...nation.players].sort((a, b) => b.total - a.total);
    setNationPlayers(sortedPlayers);
    setSelectedNation(nation);
    setShowNationPopup(true);
  };

  if (loading) return <div className="container"><div className="leaderboard-container">Loading national archives...</div></div>;

  return (
    <div className="container">
      <Link to="/" className="back-link">← BACK TO MAIN PAGE</Link>
      <div className="leaderboard-container fade-slide">
        <h2>{region === 'eu' ? 'EUROPEAN NATIONS' : 'NORTH AMERICAN NATIONS'} · RANKING</h2>

        <div className="filter-bar">
          <div className="filter-group">
            <label>YEAR RANGE</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <YearInput value={minYear} onChange={setMinYear} max={maxYear} />
              <span>—</span>
              <YearInput value={maxYear} onChange={setMaxYear} min={minYear} />
            </div>
          </div>
          <div className="filter-group">
            <label>SEARCH NATION</label>
            <input type="text" placeholder="Nation name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <h3>OVERALL RANKING (SELECTED YEARS)</h3>
        <table style={{ cursor: 'pointer' }}>
          <thead>
            <tr>
              <th className="rank-col">RANK</th>
              <th className="flag-col">NATION</th>
              <th>NAME</th>
              <th style={{ textAlign: 'center' }}>YEARS TOP‑3</th>
              <th className="points-col">TOTAL POINTS</th>
            </tr>
          </thead>
          <tbody>
            {filteredNations.map(nation => {
              const counts = nationMedalCounts[nation.name] || { gold: 0, silver: 0, bronze: 0 };
              return (
                <tr key={nation.name} onClick={() => handleNationClick(nation)} className="nation-row">
                  <td className="rank-col">{nation.rank}</td>
                  <td className="flag-col"><img className="flag-img" src={getFlagUrl(nation.name)} alt={nation.name} loading="lazy" /></td>
                  <td>
                    <strong>{nation.name}</strong>
                    <br /><span className="nation-player-count">{nation.players.length} Player{nation.players.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="nation-medal-cell">
                    {counts.gold > 0 && <MedalBadge medal="🥇" count={counts.gold} />}
                    {counts.silver > 0 && <MedalBadge medal="🥈" count={counts.silver} />}
                    {counts.bronze > 0 && <MedalBadge medal="🥉" count={counts.bronze} />}
                    {counts.gold === 0 && counts.silver === 0 && counts.bronze === 0 && <span>—</span>}
                  </td>
                  <td className="points-col">{nation.total.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h3 style={{ marginTop: '50px' }}>TOP 10 NATIONS PER YEAR</h3>
        <div className="top10-grid">
          {activeYears.map(year => {
            const pointsMap = new Map();
            players.forEach(p => {
              const nation = p.Nationality;
              pointsMap.set(nation, (pointsMap.get(nation) || 0) + (parseFloat(p[year]) || 0));
            });
            const sorted = Array.from(pointsMap.entries())
              .map(([nation, points]) => ({ nation, points }))
              .sort((a, b) => b.points - a.points)
              .slice(0, 10);
            const ranked = applyDenseRanking(sorted);
            return (
              <div key={year} className="top10-card">
                <h4>{year}</h4>
                <div className="top10-list">
                  {ranked.map((entry, idx) => (
                    <div key={idx} className="top10-entry">
                      <span className="top10-rank">#{entry.rank}</span>
                      <img src={getFlagUrl(entry.nation)} alt={entry.nation} className="top10-flag" />
                      <span className="top10-name">{entry.nation}</span>
                      <span className="top10-points">{entry.points.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nation Details Popup */}
      {showNationPopup && selectedNation && (
        <NationPopup
          nation={selectedNation}
          medalCounts={nationMedalCounts}
          playerYearlyMedals={playerYearlyMedals}
          region={region}
          onClose={() => setShowNationPopup(false)}
        />
      )}
    </div>
  );
};

// ---------- Subcomponents ----------
const YearInput = ({ value, onChange, min, max }) => (
  <input
    type="number"
    min={START_YEAR}
    max={END_YEAR}
    value={value}
    onChange={e => onChange(Math.min(Math.max(Number(e.target.value), min ?? START_YEAR), max ?? END_YEAR))}
    className="year-input"
  />
);

const MedalBadge = ({ medal, count }) => (
  <span className="medal-badge" title={`${medal} ${count} time${count !== 1 ? 's' : ''}`}>
    {medal} {count}
  </span>
);

const NationPopup = ({ nation, medalCounts, playerYearlyMedals, region, onClose }) => {
  const counts = medalCounts[nation.name] || { gold: 0, silver: 0, bronze: 0 };
  const sortedPlayers = [...nation.players].sort((a, b) => b.total - a.total);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <span className="close-button" onClick={onClose}>⨯</span>
        <div className="popup-header">
          <img src={getFlagUrl(nation.name)} alt={nation.name} className="popup-flag" />
          <h2>{nation.name}</h2>
          <div className="popup-medals">
            {counts.gold > 0 && <MedalBadge medal="🥇" count={counts.gold} />}
            {counts.silver > 0 && <MedalBadge medal="🥈" count={counts.silver} />}
            {counts.bronze > 0 && <MedalBadge medal="🥉" count={counts.bronze} />}
          </div>
        </div>
        <p><strong>TOTAL POINTS:</strong> {nation.total.toFixed(1)}</p>
        <p><strong>PLAYERS:</strong> {nation.players.length}</p>
        <h3>TOP PLAYERS</h3>
        <table className="popup-table">
          <thead><tr><th>RANK</th><th>PLAYER</th><th className="points-col">TOTAL</th><th>YEARLY MEDALS</th></tr></thead>
          <tbody>
            {sortedPlayers.map((p, idx) => {
              const medals = (playerYearlyMedals[`${p.name}|${nation.name}`] || []).sort((a, b) => a.year - b.year);
              return (
                <tr key={p.name}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <img src={getFlagUrl(nation.name)} alt="" className="inline-flag" />
                    <Link to={`/profile/${region}/${encodeURIComponent(p.name)}`} className="clickable-name">{p.name}</Link>
                  </td>
                  <td className="points-col">{p.total.toFixed(1)}</td>
                  <td className="medal-badge-container">
                    {medals.map(({ year, placement }) => (
                      <span key={year} className="popup-medal-badge" style={{ background: MEDAL_COLORS[placement] }}>
                        {year} {MEDAL_SYMBOLS[placement]}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NationsRanking;