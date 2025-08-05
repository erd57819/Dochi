import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import KakaoWithdrawCallbackPage from './pages/KakaoWithdrawCallbackPage';
import NoticePage from './pages/NoticePage';
import CommunityPage from './pages/CommunityPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';
import ConflictCreatePage from './pages/ConflictCreatePage';
import ConflictResultPage from './pages/ConflictResultPage';
import ConflictAnalysisResultPage from './pages/ConflictAnalysisResultPage';
import ComfortPage from './pages/ComfortPage';
import ComfortChatPage from './pages/ComfortChatPage';
import VoiceChatPage from './pages/VoiceChatPage';
import VideoRoomPage from './pages/VideoRoomPage';
import VoiceDemoPage from './pages/VoiceDemoPage';
import STTPage from './pages/STTPage';
import STTVideoRoomPage from './pages/STTVideoRoomPage';
import ConflictListPage from './pages/ConflictListPage';
import ConflictDetailPage from './pages/ConflictDetailPage';
import GamePage from './pages/GamePage';
import MyPage from './pages/MyPage';
import ProfileEditPage from './pages/ProfileEditPage';
import PasswordChangePage from './pages/PasswordChangePage';
import RoadmapPage from './pages/RoadmapPage';
import ExpertMatchingPage from './pages/ExpertMatchingPage';
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
            <Route path="/kakao/callback" element={<KakaoCallbackPage />} />
            <Route path="/kakao/withdraw" element={<KakaoWithdrawCallbackPage />} />
            <Route path="/notice" element={<NoticePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/create" element={<CreatePostPage />} />
            <Route path="/community/post/:postId" element={<PostDetailPage />} />
            <Route path="/service" element={<ConflictCreatePage />} />
            <Route path="/conflicts/create" element={<ConflictCreatePage />} />
            <Route path="/conflicts/result/:id" element={<ConflictResultPage />} />
            <Route path="/conflicts/analysis/:tempId" element={<ConflictAnalysisResultPage />} />
            <Route path="/conflicts" element={<ConflictListPage />} />
            <Route path="/conflicts/:conflictId" element={<ConflictDetailPage />} />
            <Route path="/video-call/:roomCode" element={<VideoCallRoom />} />
            <Route path="/comfort" element={<ComfortPage />} />
            <Route path="/comfort/chat" element={<ComfortChatPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/profile" element={<ProfileEditPage />} />
            <Route path="/mypage/password" element={<PasswordChangePage />} />
            <Route path="/voice-chat" element={<VoiceChatPage />} />
            <Route path="/video-room/:roomId" element={<VideoRoomPage />} />
            <Route path="/voice-demo" element={<VoiceDemoPage />} />
            <Route path="/stt" element={<STTPage />} />
            <Route path="/stt-room/:roomId" element={<STTVideoRoomPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/expert-matching" element={<ExpertMatchingPage />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
