import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [popupVisible, setPopupVisible] = useState(false);
  const [nationsPopup, setNationsPopup] = useState(false);
  const [category, setCategory] = useState(null);

  const showRegionPopup = (cat) => {
    setCategory(cat);
    setPopupVisible(true);
  };

  const selectRegion = (region) => {
    setPopupVisible(false);
    if (category === 'players') {
      navigate(`/leaderboard/${region}`);
    } else {
      alert(`${category} data for ${region.toUpperCase()} coming soon.`);
    }
  };

  return (
    <main>
      <div className="categories">
        <div className="category" onClick={() => showRegionPopup('players')}>
          <div className="category-img"><div className="mil-icon">[ PLAYERS ]</div></div>
          <h3>PLAYERS</h3>
        </div>
        <div className="category" onClick={() => showRegionPopup('regiments')}>
          <div className="category-img"><div className="mil-icon">[ REGIMENT ]</div></div>
          <h3>REGIMENTS</h3>
        </div>
        <div className="category" onClick={() => showRegionPopup('teams')}>
          <div className="category-img"><div className="mil-icon">[ TEAMS ]</div></div>
          <h3>TEAMS</h3>
        </div>
        <div className="category" onClick={() => setNationsPopup(true)}>
          <div className="category-img"><div className="mil-icon">[ NATIONS ]</div></div>
          <h3>NATIONS</h3>
        </div>
      </div>

      {/* Region Selection Modal */}
      {popupVisible && (
        <div className="modal-overlay" onClick={() => setPopupVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setPopupVisible(false)}>⨯</span>
            <h2>SELECT REGION</h2>
            <button onClick={() => selectRegion('eu')}>EUROPE</button>
            <button onClick={() => selectRegion('na')}>NORTH AMERICA</button>
          </div>
        </div>
      )}

      {/* Nations Modal */}
      {nationsPopup && (
        <div className="modal-overlay" onClick={() => setNationsPopup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setNationsPopup(false)}>⨯</span>
            <h2>NATIONAL ARCHIVES</h2>
            <button onClick={() => navigate('/nations/eu')}>EUROPE</button>
            <button onClick={() => navigate('/nations/na')}>NORTH AMERICA</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;