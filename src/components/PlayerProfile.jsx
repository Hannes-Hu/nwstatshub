import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import { getFlagUrl, processPlayers, getCountryColors } from '../utils';
import { START_YEAR, END_YEAR, ALL_YEARS, MEDAL_SYMBOLS, MEDAL_COLORS } from '../constants';

// ---------- Helper functions ----------
const computeMedalCounts = (achievements) => {
  let gold = 0, silver = 0, bronze = 0;
  achievements?.forEach(ach => {
    const placement = String(ach.placement).toLowerCase();
    if (placement === '1' || placement === '1st' || placement === '1') gold++;
    else if (placement === '2' || placement === '2nd' || placement === '2') silver++;
    else if (placement === '3' || placement === '3rd' || placement === '3') bronze++;
    else if (placement.includes('3/4')) bronze++;
  });
  return { gold, silver, bronze };
};

const groupAchievementsByTournament = (achievements) => {
  const groups = {};
  achievements?.forEach(ach => {
    let type = 'OTHER';
    const name = ach.tournament.toLowerCase();
    if (name.includes('byt')) type = 'BYT SERIES';
    else if (name.includes('r. tournament')) type = 'R. TOURNAMENT';
    else if (name.includes('nwwc')) type = 'NWWC';
    else if (name.includes('wurst')) type = 'WU(0)RST';
    else if (name.includes('ats')) type = 'ATS DRAFT';
    if (!groups[type]) groups[type] = { wins: 0, top3: 0 };
    if (ach.placement === 1 || ach.placement === '1') groups[type].wins++;
    if ([1, 2, 3, '1', '2', '3', '1st', '2nd', '3rd'].includes(ach.placement) || ach.placement === '3/4') groups[type].top3++;
  });
  return groups;
};

const computeRankingHistory = (player, allPlayersRaw) => {
  const history = [];
  for (let cutoff = START_YEAR; cutoff <= END_YEAR; cutoff++) {
    const years = Array.from({ length: cutoff - START_YEAR + 1 }, (_, i) => START_YEAR + i);
    const totals = allPlayersRaw.map(p => ({
      name: p.Name,
      total: years.reduce((sum, y) => sum + (parseFloat(p[y]) || 0), 0),
    }));
    totals.sort((a, b) => b.total - a.total);
    const rank = totals.findIndex(p => p.name === player.name) + 1;
    history.push({ year: cutoff, rank });
  }
  return history;
};

const computeAllTimeRank = (player, allPlayersRaw) => {
  const totals = allPlayersRaw.map(p => ({
    name: p.Name,
    total: ALL_YEARS.reduce((sum, y) => sum + (parseFloat(p[y]) || 0), 0),
  }));
  totals.sort((a, b) => b.total - a.total);
  return totals.findIndex(p => p.name === player.name) + 1;
};

const getCareerPeakAndLow = (player) => {
  let high = -Infinity, highYear = null, low = Infinity, lowYear = null;
  ALL_YEARS.forEach(y => {
    const pts = player.points[y] || 0;
    if (pts > high) { high = pts; highYear = y; }
    if (pts < low && pts > 0) { low = pts; lowYear = y; }
  });
  return { high, highYear, low, lowYear };
};

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ---------- Custom hooks for charts ----------
const useYearlyPointsChart = (chartRef, player) => {
  const instanceRef = useRef(null);
  useEffect(() => {
    if (!player || !chartRef.current) return;
    if (instanceRef.current) instanceRef.current.destroy();
    const colors = getCountryColors(player.nationality);
    instanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: ALL_YEARS,
        datasets: [{
          label: 'POINTS',
          data: ALL_YEARS.map(y => player.points[y] || 0),
          backgroundColor: colors.primary,
          borderColor: colors.secondary,
          borderWidth: 1,
          borderRadius: 2,
          barPercentage: 0.7,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e7dfd3' } }, tooltip: { backgroundColor: '#1f1c18', titleColor: colors.primary, bodyColor: '#e7dfd3' } },
        scales: { x: { ticks: { color: '#e7dfd3', stepSize: 1, maxRotation: 45 } }, y: { beginAtZero: true, ticks: { color: '#e7dfd3' } } },
      },
    });
    return () => instanceRef.current?.destroy();
  }, [player, chartRef]);
};

const useRankingPercentileChart = (rankChartRef, rankingHistory, allPlayersRaw, player) => {
  const instanceRef = useRef(null);
  useEffect(() => {
    if (!rankChartRef.current || rankingHistory.length === 0 || !allPlayersRaw.length) return;
    if (instanceRef.current) instanceRef.current.destroy();
    const totalPlayers = allPlayersRaw.length;
    const years = rankingHistory.map(r => r.year);
    const ranks = rankingHistory.map(r => r.rank);
    const percentiles = ranks.map(rank => ((rank - 1) / (totalPlayers - 1)) * 100);
    const colors = getCountryColors(player?.nationality);
    instanceRef.current = new Chart(rankChartRef.current, {
      type: 'line',
      data: {
        labels: years,
        datasets: [{
          label: 'PERCENTILE (0% = BEST)',
          data: percentiles,
          borderColor: colors.primary,
          borderWidth: 2,
          pointBackgroundColor: colors.primary,
          pointRadius: 4,
          tension: 0.2,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => [`Rank: #${ranks[ctx.dataIndex]}`, `Percentile: ${percentiles[ctx.dataIndex].toFixed(1)}%`],
            },
            backgroundColor: '#1f1c18',
            titleColor: colors.primary,
            bodyColor: '#e7dfd3',
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            reverse: true,
            ticks: { callback: val => `${val}%` },
            title: { display: true, text: 'PERCENTILE (0% = BEST)', color: '#e7dfd3' },
          },
        },
      },
    });
    return () => instanceRef.current?.destroy();
  }, [rankingHistory, allPlayersRaw, player, rankChartRef]);
};

// ---------- Main component ----------
const PlayerProfile = () => {
  const { region, playerName } = useParams();
  const [player, setPlayer] = useState(null);
  const [allPlayersRaw, setAllPlayersRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [rankingHistory, setRankingHistory] = useState([]);
  const [allTimeRank, setAllTimeRank] = useState(null);

  const chartRef = useRef(null);
  const rankChartRef = useRef(null);

  useYearlyPointsChart(chartRef, player);
  useRankingPercentileChart(rankChartRef, rankingHistory, allPlayersRaw, player);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

  // Fetch player data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/${region === 'eu' ? 'data.json' : 'data_na.json'}`);
        const data = await response.json();
        setAllPlayersRaw(data);
        const decodedName = decodeURIComponent(playerName);
        const rawPlayer = data.find(p => p.Name === decodedName);
        if (rawPlayer) {
          setPlayer(processPlayers([rawPlayer])[0]);
        } else {
          setPlayer(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [region, playerName]);

  // Compute ranking history and all‑time rank when data is ready
  useEffect(() => {
    if (player && allPlayersRaw.length) {
      setRankingHistory(computeRankingHistory(player, allPlayersRaw));
      setAllTimeRank(computeAllTimeRank(player, allPlayersRaw));
    }
  }, [player, allPlayersRaw]);

  const copyProfileLink = useCallback(() => {
    const url = `${window.location.origin}/profile/${region}/${encodeURIComponent(player.name)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [region, player]);

  if (loading) {
    return (
      <div className="container">
        <div className="profile-container" style={{ textAlign: 'center', padding: '60px' }}>
          LOADING SERVICE RECORD...
        </div>
      </div>
    );
  }
  if (!player) {
    return (
      <div className="container">
        <div className="profile-container">
          <h2>MISSING IN ACTION</h2>
          <p>Player not found in archives.</p>
          <Link to="/" className="back-link">← RETURN TO HQ</Link>
        </div>
      </div>
    );
  }

  const { gold, silver, bronze } = computeMedalCounts(player.achievements);
  const tournamentGroups = groupAchievementsByTournament(player.achievements);
  const age = calculateAge(player.birthDate);
  const colors = getCountryColors(player.nationality);
  const career = getCareerPeakAndLow(player);

  return (
    <div className="container">
      <Link to={`/leaderboard/${region}`} className="back-link">← BACK TO RANKINGS</Link>
      <div className="profile-container fade-slide">
        <div className="profile-header">
          <img src={getFlagUrl(player.nationality)} alt={player.nationality} />
          <h1 className="profile-name">{player.name}</h1>
        </div>
        <p><strong>REAL NAME:</strong> {player.realName || '[CLASSIFIED]'}</p>
        {age && <p><strong>AGE:</strong> {age}</p>}
        <p><strong>NATIONALITY:</strong> {player.nationality}</p>
        <p><strong>TOTAL POINTS:</strong> {player.total.toFixed(1)}</p>
        {allTimeRank && <p><strong>ALL-TIME RANK:</strong> #{allTimeRank}</p>}

        <div style={{ display: 'flex', gap: '20px', margin: '24px 0', flexWrap: 'wrap' }}>
          <MedalCard title="1ST PLACE" count={gold} color={colors.primary} />
          <MedalCard title="2ND PLACE" count={silver} color={colors.secondary} />
          <MedalCard title="3RD PLACE" count={bronze} color={colors.tertiary} />
        </div>

        <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', background: '#0c0b0a', padding: '16px', borderLeft: `3px solid ${colors.primary}` }}>
          <div><strong>PEAK YEAR:</strong> {career.highYear} — {career.high?.toFixed(1)} pts</div>
          {career.lowYear && <div><strong>LOWEST ACTIVE:</strong> {career.lowYear} — {career.low?.toFixed(1)} pts</div>}
        </div>

        <h3>YEARLY POINTS</h3>
        <canvas ref={chartRef} style={{ marginBottom: '30px', maxHeight: '250px' }}></canvas>

        <h3>RANKING HISTORY (0% = BEST)</h3>
        <canvas ref={rankChartRef} style={{ marginBottom: '30px', maxHeight: '250px' }}></canvas>

        <h3>POINTS BY YEAR</h3>
        <ul className="points-list">
          {ALL_YEARS.map(y => (
            <li key={y} style={{ borderLeftColor: colors.primary }}>
              <strong>{y}:</strong> {(player.points[y] || 0).toFixed(1)}
            </li>
          ))}
        </ul>

        <h3>ACHIEVEMENTS</h3>
        {player.achievements?.length ? (
          player.achievements.map((ach, idx) => (
            <div key={idx} className="achievement-item" style={{ borderLeftColor: colors.primary }}>
              <strong>#{ach.placement}</strong> — {ach.tournament} ({ach.year})
            </div>
          ))
        ) : (
          <p>No recorded achievements.</p>
        )}

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={copyProfileLink} style={{ background: 'transparent', border: `1px solid ${colors.primary}`, padding: '8px 16px', color: colors.primary, cursor: 'pointer' }}>
            {copied ? 'LINK COPIED' : 'COPY PROFILE LINK'}
          </button>
        </div>
      </div>
      {showBackToTop && (
        <button onClick={scrollToTop} style={{ position: 'fixed', bottom: '30px', right: '30px', background: colors.primary, border: 'none', color: '#0c0b0a', padding: '10px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
          ↑ TOP
        </button>
      )}
    </div>
  );
};

// Small reusable subcomponent for medal cards
const MedalCard = ({ title, count, color }) => (
  <div style={{ background: '#0c0b0a', borderLeft: `3px solid ${color}`, padding: '12px 20px', flex: 1, minWidth: '100px', textAlign: 'center' }}>
    <div style={{ fontSize: '0.8rem', letterSpacing: '1px', color }}>{title}</div>
    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{count}</div>
  </div>
);

export default PlayerProfile;