import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import ScrollToTop from './components/ScrollToTop';
import PrePage from './pages/PrePage';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import KakaoWithdrawCallbackPage from './pages/KakaoWithdrawCallbackPage';
import NoticePage from './pages/NoticePage';
import CommunityPage from './pages/CommunityPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import PostDetailPage from './pages/PostDetailPage';
import ConflictCreatePage from './pages/ConflictCreatePage';
import ConflictResultPage from './pages/ConflictResultPage';
import ConflictAnalysisResultPage from './pages/ConflictAnalysisResultPage';
import ComfortPage from './pages/ComfortPage';
import ComfortChatPage from './pages/ComfortChatPage';
import ConflictDetailPage from './pages/ConflictDetailPage';
import GamePage from './pages/GamePage';
import MyPage from './pages/MyPage';
import ProfileEditPage from './pages/ProfileEditPage';
import PasswordChangePage from './pages/PasswordChangePage';
import RoadmapPage from './pages/RoadmapPage';
import ExpertMatchingPage from './pages/ExpertMatchingPage';
import ConflictReportPage from './pages/ConflictReportPage';
import './App.css';
import VideoCallRoom from './components/videocall/VideoCallRoom';


const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Nav />
        </div>
        <main className="pt-16 lg:pt-20">
          <Routes>
            {/* three.js 완성되면주석 해제 예정 */}
            {/* <Route path="/" element={<PrePage />} />
            <Route path="/main" element={<MainPage />} /> */}
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/kakao/callback" element={<KakaoCallbackPage />} />
            <Route path="/kakao/withdraw" element={<KakaoWithdrawCallbackPage />} />
            <Route path="/notice" element={<NoticePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/create" element={<CreatePostPage />} />
            <Route path="/community/edit/:postId" element={<EditPostPage />} />
            <Route path="/community/post/:postId" element={<PostDetailPage />} />
            <Route path="/service" element={<ConflictCreatePage />} />
            <Route path="/conflicts/create" element={<ConflictCreatePage />} />
            <Route path="/conflicts/result/:id" element={<ConflictResultPage />} />
            <Route path="/conflicts/analysis/:tempId" element={<ConflictAnalysisResultPage />} />
            {/* <Route path="/conflicts" element={<ConflictListPage />} /> */}
            <Route path="/conflicts/:conflictId" element={<ConflictDetailPage />} />
            <Route path="/conflict-report/:roomId" element={<ConflictReportPage />} />
            <Route path="/video-call/:roomCode" element={<VideoCallRoom />} />
            <Route path="/comfort" element={<ComfortPage />} />
            <Route path="/comfort/chat" element={<ComfortChatPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/profile" element={<ProfileEditPage />} />
            <Route path="/mypage/password" element={<PasswordChangePage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/expert-matching" element={<ExpertMatchingPage />} />
            <Route path="/game" element={<GamePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
