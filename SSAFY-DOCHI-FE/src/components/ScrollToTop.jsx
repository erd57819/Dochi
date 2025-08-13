import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 즉시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // 추가로 한 번 더 확실히 처리
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 10);
    
    // 메인페이지의 경우 추가 처리
    if (pathname === '/') {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 50);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;