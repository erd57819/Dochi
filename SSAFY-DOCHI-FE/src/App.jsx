import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NoticePage from './pages/NoticePage';
import CommunityPage from './pages/CommunityPage';
import ConflictCreatePage from './pages/ConflictCreatePage';
import './App.css';
import VideoCallRoom from './components/VideoCallRoom';
const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/notice" element={<NoticePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/service" element={<ConflictCreatePage />} />
            <Route path="/conflict/create" element={<ConflictCreatePage />} />
            <Route path="/video-call" element={<VideoCallRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
