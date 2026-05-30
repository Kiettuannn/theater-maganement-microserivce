import { FC } from 'react';
import '../styles/App.css';

const Footer: FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#faq">FAQ</a>
        </div>
        <p>&copy; 2024 CinemaFlex. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
