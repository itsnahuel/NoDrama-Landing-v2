import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ShopPage from './pages/shop/ShopPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav className="main-nav">
            <Link to="/" className="logo">
              NoDrama Records
            </Link>
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

// Placeholder components
const HomePage = () => (
  <div className="home-page">
    <h1>Welcome to NoDrama Records</h1>
    <p>Discover amazing music and merchandise</p>
    <Link to="/shop" className="cta-button">
      Shop Now
    </Link>
  </div>
);

const AboutPage = () => (
  <div className="about-page">
    <h1>About NoDrama Records</h1>
    <p>We are a music label dedicated to bringing you the best sounds...</p>
  </div>
);

const ContactPage = () => (
  <div className="contact-page">
    <h1>Contact Us</h1>
    <p>Get in touch with NoDrama Records</p>
  </div>
);

export default App;
