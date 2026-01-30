import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import Reports from './components/Reports';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <div className="navbar">
      <h1>Ramya Goyam Upakaran</h1>
      <nav>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Inventory
        </Link>
        <Link to="/billing" className={location.pathname === '/billing' ? 'active' : ''}>
          Billing
        </Link>
        <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>
          Reports
        </Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <div className="container">
        <Routes>
          <Route path="/" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
