import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import Reports from './components/Reports';

function Navigation() {
  const location = useLocation();

  return (
    <div className="bg-blue-600 text-white px-5 py-4 mb-5 shadow-md">
      <h1 className="text-2xl font-semibold">Ramya Goyam Upakaran</h1>
      <nav className="mt-2 flex gap-2">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded transition ${
            location.pathname === '/' ? 'bg-white/30' : 'hover:bg-white/20'
          }`}
        >
          Inventory
        </Link>
        <Link
          to="/billing"
          className={`px-3 py-1.5 rounded transition ${
            location.pathname === '/billing' ? 'bg-white/30' : 'hover:bg-white/20'
          }`}
        >
          Billing
        </Link>
        <Link
          to="/reports"
          className={`px-3 py-1.5 rounded transition ${
            location.pathname === '/reports' ? 'bg-white/30' : 'hover:bg-white/20'
          }`}
        >
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
      <div className="max-w-[1400px] mx-auto px-5 py-5">
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
