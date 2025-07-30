import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NoticePage from './pages/NoticePage';
import CommunityPage from './pages/CommunityPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import ConflictCreatePage from './pages/ConflictCreatePage';
import ComfortPage from './pages/ComfortPage';
import ConflictListPage from './pages/ConflictListPage';
import ConflictDetailPage from './pages/ConflictDetailPage';
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
            <Route path="/community/create" element={<CreatePostPage />} />
            <Route path="/community/post/:postId" element={<PostDetailPage />} />
            <Route path="/service" element={<ConflictCreatePage />} />
            <Route path="/conflicts/create" element={<ConflictCreatePage />} />
            <Route path="/conflicts" element={<ConflictListPage />} />
            <Route path="/conflicts/:conflictId" element={<ConflictDetailPage />} />
            <Route path="/video-call" element={<VideoCallRoom />} />
            <Route path="/comfort" element={<ComfortPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
