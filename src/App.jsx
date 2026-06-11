import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Leaderboard from './components/Leaderboard';
import PlayerProfile from './components/PlayerProfile';
import NationsRanking from './components/NationsRanking';
import './App.css';

const App = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard/:region" element={<Leaderboard />} />
        <Route path="/profile/:region/:playerName" element={<PlayerProfile />} />
        <Route path="/nations/:region" element={<NationsRanking />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;