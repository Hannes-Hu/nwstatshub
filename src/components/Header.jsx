import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <div className="archive-header">
      <div className="logo-area">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1>MOUNT & BLADE<br />ARCHIVE</h1>
        </Link>
        <p>STATISTICS</p>
      </div>
      <div className="archive-badge">[ YEARS ARCHIVED 2012 – 2026 ]</div>
    </div>
  );
};

export default Header;