import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { communityApi } from '../services/communityApi.js';
import useAuthStore from '../stores/AuthStore.js';
import { API_BASE_URL } from '../config/api.js';
import hedgehogImg from '../assets/conflict.png';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(false); // 추가: prefilled 상태 추적

  // 카테고리별 기본 템플릿 (함수를 useEffect보다 먼저 정의)
  const getCategoryTemplate = (category, hasConflictData = false) => {
    // 갈등 데이터가 있을 때는 간단한 템플릿
    if (hasConflictData) {
      const simpleTemplates = {
        CONFLICT_SHARING: {
          title: '[찬반대결] 이런 상황에서 어떤 선택이 나을까요?',
          content: '갈등 상황을 객관적으로 검토하고, 찬성과 반대 의견을 통해 최선의 선택을 위해 여러분의 의견을 구합니다.'
        },
        ADVICE_REQUEST: {
          title: '[조언해줘] 갈등 해결을 위한 조언이 필요합니다',
          content: '현재 상황을 개선하기 위한 구체적인 조언과 해결 방법을 찾고 있습니다.'
        },
        SUCCESS_STORIES: {
          title: '[해결했어요] 갈등 해결 경험을 공유합니다',
          content: '성공적으로 해결한 갈등 경험을 단계별로 공유하여 비슷한 고민을 하는 분들에게 도움을 드리고자 합니다.'
        },
        GENERAL: {
          title: '갈등 해결 과정에서 느낀 점을 나눕니다',
          content: '갈등을 겪으며 배운 점들과 소감을 자유롭게 공유합니다.'
        }
      };
      return simpleTemplates[category] || simpleTemplates.GENERAL;
    }
    
    // 갈등 데이터가 없을 때는 자세한 가이드 템플릿
    const guideTemplates = {
      CONFLICT_SHARING: {
        title: '찬반대결 게시글 작성하기',
        content: `📝 이렇게 작성해보세요:

🤔 **상황 설명**
• 갈등이 발생한 배경과 상황을 구체적으로 설명해주세요
• 어떤 사람들이 관련되어 있는지 알려주세요
• 언제, 어디서 일어난 일인지 맥락을 제시해주세요

⚖️ **찬반 의견 구하기**
**👍 찬성 입장:**
• 이 방법이 좋다고 생각하는 이유
• 기대할 수 있는 긍정적인 결과
• 장기적으로 도움이 될 점

**👎 반대 입장:**
• 이 방법이 우려되는 이유
• 예상되는 부작용이나 위험
• 다른 대안이 더 나은 이유

💭 **커뮤니티에 묻고 싶은 점**
• 여러분이라면 어떤 선택을 하실지 궁금해요
• 다른 좋은 방법이 있다면 함께 제안해주세요

✅ **작성 팁**
• 찬성과 반대 양쪽 입장을 균형있게 제시해주세요
• 감정적인 표현보다는 논리적인 근거 위주로 작성하세요`
      },
      ADVICE_REQUEST: {
        title: '조언 구하기',
        content: `📝 이렇게 작성해보세요:

😰 현재 상황
• 갈등의 배경과 경과를 구체적으로 설명해주세요
• 어떤 점이 가장 힘든지, 무엇 때문에 고민인지 적어주세요

🎯 원하는 결과
• 어떤 방향으로 해결되기를 원하는지 적어주세요
• 관계 회복, 문제 해결, 타협점 찾기 등 구체적인 목표를 설정해주세요

🔄 시도해본 방법들
• 지금까지 어떤 노력을 해봤는지 공유해주세요
• 그 결과는 어땠는지도 함께 적어주세요

❓ 구체적인 질문
• 어떤 부분에 대한 조언이 필요한지 명확하게 질문해주세요

✅ 작성 팁
• 감정보다는 사실과 행동 위주로 설명해주세요
• 상황을 정확히 파악할 수 있도록 구체적인 정보를 제공해주세요`
      },
      SUCCESS_STORIES: {
        title: '해결 경험 공유하기',
        content: `📝 이렇게 작성해보세요:

😅 처음 상황
• 갈등이 어떻게 시작되었는지 설명해주세요
• 당시 느꼈던 감정과 어려움을 솔직하게 공유해주세요

🛠️ 해결 과정 (단계별로)
• 1단계: 초기에 어떻게 접근했는지
• 2단계: 본격적인 해결 노력은 무엇이었는지
• 3단계: 어떻게 마무리하고 관계를 회복했는지

✨ 해결 결과
• 최종적으로 어떻게 해결되었는지
• 현재 관계나 상황이 어떻게 변했는지

💡 경험에서 얻은 교훈
• 가장 효과적이었던 방법은 무엇인지
• 다시 한다면 다르게 할 점은 무엇인지
• 비슷한 상황의 분들에게 드리고 싶은 조언

✅ 작성 팁
• 구체적인 행동과 방법을 중심으로 써주세요
• 실패했던 부분도 함께 공유하면 더 도움이 됩니다`
      },
      GENERAL: {
        title: '자유롭게 이야기해요',
        content: `📝 이런 이야기들을 나눠주세요:

💭 일상의 갈등 이야기
• 가족, 친구, 직장에서 겪은 크고 작은 갈등들
• 소통이 어려웠던 경험이나 오해가 생긴 상황들

🌱 성장하는 이야기
• 갈등을 통해 배운 점이나 깨달은 것들
• 관계가 더 좋아진 경험이나 변화한 모습들

🤝 소통에 관한 이야기
• 효과적이었던 대화 방법이나 소통 기술
• 감정 조절이나 스트레스 관리 방법

❓ 궁금한 것들
• 해결하지 못한 고민이나 의문점들
• 다른 사람들의 경험이 궁금한 상황들

✅ 작성 팁
• 길지 않아도 괜찮으니 편안하게 써주세요
• 개인정보는 적당히 보호하면서 이야기해주세요
• 서로 공감하고 응원할 수 있는 따뜻한 이야기를 기대합니다`
      }
    };
    
    return guideTemplates[category] || guideTemplates.GENERAL;
  };

  // 갈등 공유하기에서 전달된 데이터 처리 및 초기 템플릿 적용
  useEffect(() => {
    const prefilledData = location.state?.prefilledData;
    const conflictData = location.state?.conflictData;
    const targetCategory = location.state?.targetCategory;
    const shouldGenerateAI = location.state?.shouldGenerateAI;
    
    // 한 번만 실행되도록 제어
    if ((prefilledData || conflictData) && !hasPrefilledData) {
      console.log("📥 전달된 데이터:", { prefilledData, conflictData, targetCategory, shouldGenerateAI });
      setHasPrefilledData(true); // prefilled 상태 설정
      
      if (prefilledData) {
        // 기존 prefilledData 처리
        setFormData({
          title: prefilledData.title || '',
          content: prefilledData.content || '',
          category: prefilledData.category || 'GENERAL'
        });
        window.conflictContext = extractConflictContext(prefilledData.content);
      } else if (conflictData && shouldGenerateAI) {
        // 갈등 데이터로 AI 생성 요청
        const category = targetCategory || 'CONFLICT_SHARING';
        setFormData({
          title: '로딩 중...',
          content: 'AI가 내용을 생성하고 있습니다...',
          category: category
        });
        
        // 갈등 데이터 저장
        window.conflictContext = {
          conflictData: conflictData,
          description: conflictData.description || conflictData.summary?.join('\n') || '',
          conflictType: conflictData.conflictTypeText || ''
        };
        
        // AI 생성 실행
        generateCategoryContent(category);
      }
    } else if (!prefilledData && !conflictData && !hasPrefilledData) {
      // 새로 접근한 경우에만 기본 카테고리(GENERAL)의 가이드 템플릿 적용
      console.log("🆕 새로운 글 작성, 가이드 템플릿 적용");
      const defaultTemplate = getCategoryTemplate('GENERAL', false); // 가이드 템플릿 사용
      console.log("📋 초기 가이드 템플릿:", defaultTemplate);
      setFormData(prev => ({
        ...prev,
        title: defaultTemplate.title,
        content: defaultTemplate.content
      }));
      setHasPrefilledData(true); // 초기화 완료 표시
      window.conflictContext = null; // 갈등 컨텍스트 초기화
    }
  }, []); // 빈 의존성 배열로 한 번만 실행
  
  // 갈등 내용에서 실제 갈등 정보 추출
  const extractConflictContext = (content) => {
    if (!content) return null;
    
    // content에서 실제 갈등 상황 추출 (📌 상황: 뒤의 내용)
    const situationMatch = content.match(/📌 상황:\s*([^🎯💢]*)/);
    if (situationMatch && situationMatch[1]) {
      const conflictDescription = situationMatch[1].trim();
      console.log("🔍 추출된 갈등 상황:", conflictDescription);
      return {
        situation: conflictDescription,
        originalContent: content
      };
    }
    
    return null;
  };

  // formData 변화 모니터링 (디버깅용)
  useEffect(() => {
    console.log('🔍 formData 상태 변화:', formData);
  }, [formData]);

  const categories = [
    { value: 'GENERAL', label: '자유게시판', color: '#7F5539', gradient: 'linear-gradient(135deg, #7F5539 0%, #a06d4d 100%)' },
    { value: 'CONFLICT_SHARING', label: '찬반대결', color: '#cd9f6e', gradient: 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)' },
    { value: 'SUCCESS_STORIES', label: '해결했어요', color: '#f8d6b3', gradient: 'linear-gradient(135deg, #f8d6b3 0%, #ffe4cc 100%)' },
    { value: 'ADVICE_REQUEST', label: '조언해줘', color: '#EE9278', gradient: 'linear-gradient(135deg, #EE9278 0%, #f5a893 100%)' }
  ];

  // 로그인 확인
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  // 갈등 공유 게시글인지 확인
  const isConflictSharingPost = formData.category === 'CONFLICT_SHARING';

  // 카테고리별 AI 제목/내용 생성
  const generateCategoryContent = async (category) => {
    console.log("🚀 generateCategoryContent 함수 시작:", category);
    console.log("🔍 갈등 컨텍스트 확인:", window.conflictContext);
    setIsGenerating(true);
    
    try {
      // 갈등 데이터 확인 (새로운 방식 또는 기존 방식)
      const newConflictData = window.conflictContext?.conflictData;
      const oldConflictSituation = window.conflictContext?.situation;
      const hasRealConflict = newConflictData || (oldConflictSituation && oldConflictSituation.length > 10);
      
      console.log("🎯 실제 갈등 상황 사용 여부:", hasRealConflict);
      
      // 갈등 데이터가 없으면 AI 호출 없이 바로 기본 템플릿 사용
      if (!hasRealConflict) {
        console.log("📋 갈등 데이터 없음 - AI 호출 없이 기본 가이드 템플릿 사용");
        const templates = getCategoryTemplate(category, false);
        setFormData(prev => ({
          ...prev,
          category: category,
          title: templates.title,
          content: templates.content
        }));
        setIsGenerating(false);
        return;
      }
      
      // 갈등 데이터가 있을 때만 로그 출력 및 AI 호출 진행
      if (newConflictData) {
        console.log("📝 사용할 새 갈등 데이터:", newConflictData);
      } else if (oldConflictSituation) {
        console.log("📝 사용할 기존 갈등 상황:", oldConflictSituation);
      }
      
      // 갈등 데이터에 따른 프롬프트 구성
      let conflictDesc, conflictType;
      
      if (newConflictData) {
        // 새로운 갈등 데이터 사용
        conflictDesc = newConflictData.description || newConflictData.summary?.join('\n') || '갈등 상황';
        conflictType = newConflictData.conflictTypeText || '일반 갈등';
      } else if (oldConflictSituation) {
        // 기존 방식 사용 (호환성)
        conflictDesc = oldConflictSituation;
        conflictType = '갈등';
      }
      
      const prompts = {
        CONFLICT_SHARING: {
          title: hasRealConflict 
            ? `${conflictType} 상황에서 커뮤니티 찬반 투표를 위한 제목을 생성해주세요. 갈등 내용: ${conflictDesc}. [찬반대결] 형식으로 시작하고 20-50자 이내로 작성해주세요.`
            : "찬반대결 게시글에 적합한 제목을 생성해주세요. 예: '[찬반대결] 이런 상황에서 어떤 선택이 나을까요?'",
          content: hasRealConflict
            ? `다음 갈등 상황에 대해 커뮤니티의 찬반 의견을 구하는 게시글을 생성해주세요. \n\n갈등 상황: ${conflictDesc}\n\n구성:\n1. 상황 설명\n2. 👍 찬성 입장: 이 방법/선택을 지지하는 이유와 기대 효과\n3. 👎 반대 입장: 이 방법/선택이 우려되는 이유와 대안 제시\n4. 커뮤니티 의견 요청\n5. 관련 해시태그. 마크다운 사용 금지, 일반 텍스트와 이모지만 사용하세요.`
            : "찬반대결 게시글 형태로 내용을 작성해주세요. 찬성 입장과 반대 입장을 명확히 제시하고 커뮤니티의 의견을 구하는 형태로 작성하세요."
        },
        ADVICE_REQUEST: {
          title: hasRealConflict
            ? `${conflictType} 상황에서 조언을 구하는 제목을 생성해주세요. 갈등 내용: ${conflictDesc}. [조언해줘] 형식으로 시작하고 20-50자 이내로 작성해주세요.`
            : "조언 요청 게시글에 적합한 제목을 생성해주세요. 예: '[조언해줘] 이런 갈등 상황에서 어떻게 해야 할까요?'",
          content: hasRealConflict
            ? `다음 갈등 상황에 대해 커뮤니티의 조언을 구하는 게시글을 생성해주세요. \n\n갈등 상황: ${conflictDesc}\n\n구성:\n1. 상황 설명\n2. 구체적인 조언 요청 내용\n3. 원하는 결과나 고민 사항\n4. 관련 해시태그. 마크다운 사용 금지, 일반 텍스트와 이모지만 사용하세요.`
            : "갈등 상황에 대한 조언을 구하는 게시글 내용을 작성해주세요. 상황을 구체적으로 설명하고 어떤 도움이 필요한지 명확히 하세요."
        },
        SUCCESS_STORIES: {
          title: hasRealConflict
            ? `${conflictType} 해결 성공사례 제목을 생성해주세요. 갈등 내용: ${conflictDesc}. [해결했어요] 형식으로 시작하고 20-50자 이내로 작성해주세요.`
            : "갈등 해결 성공사례 게시글에 적합한 제목을 생성해주세요. 예: '[해결했어요] 이런 방법으로 갈등을 해결했습니다'",
          content: hasRealConflict
            ? `다음 갈등을 성공적으로 해결한 경험담을 생성해주세요. \n\n갈등 상황: ${conflictDesc}\n\n구성:\n1. 상황 설명\n2. 해결 과정 단계별 설명\n3. 해결 결과와 깨달음\n4. 다른 사람들에게 드리는 팁. 마크다운 사용 금지, 일반 텍스트와 이모지만 사용하세요.`
            : "갈등 해결 성공사례 게시글 내용을 작성해주세요. 해결 과정을 단계별로 설명하고 다른 사람들에게 도움이 될 팁을 포함하세요."
        },
        GENERAL: {
          title: hasRealConflict
            ? `${conflictType} 경험을 자유게시판에 공유할 제목을 생성해주세요. 갈등 내용: ${conflictDesc}. 20-50자 이내로 작성해주세요.`
            : "자유게시판에 적합한 제목을 생성해주세요. 예: '일상에서 겪은 갈등 경험 공유'",
          content: hasRealConflict
            ? `다음 갈등 경험을 자유게시판에 자연스럽게 공유하는 글을 생성해주세요. \n\n갈등 상황: ${conflictDesc}\n\n구성:\n1. 자연스러운 경험 공유\n2. 느낀 점이나 감정\n3. 커뮤니티와 대화 유도. 마크다운 사용 금지, 일반 텍스트와 이모지만 사용하세요.`
            : "자유게시판 게시글 내용을 작성해주세요. 일상 경험과 고민을 자유롭게 나누는 형태로 작성하세요."
        }
      };

      const categoryPrompt = prompts[category];
      
      // AI API 호출 (백엔드에 새 엔드포인트 추가 필요)
      const response = await fetch(`${API_BASE_URL}/community/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          category: category,
          titlePrompt: categoryPrompt.title,
          contentPrompt: categoryPrompt.content
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          category: category, // 카테고리도 함께 업데이트
          title: result.data?.title || '',
          content: result.data?.content || ''
        }));
      } else {
        console.log('🔄 AI API 실패, 기본 템플릿 사용');
        // 백엔드 API가 없으면 기본 템플릿 사용
        const hasConflictData = hasRealConflict;
        const templates = getCategoryTemplate(category, hasConflictData);
        console.log('📋 기본 템플릿 적용:', templates, '갈등데이터:', hasConflictData);
        setFormData(prev => {
          const newData = {
            ...prev,
            category: category, // 카테고리도 함께 업데이트
            title: templates.title,
            content: templates.content
          };
          console.log('📝 formData 업데이트 전:', prev);
          console.log('📝 formData 업데이트 후:', newData);
          return newData;
        });
      }
    } catch (error) {
      console.error('❌ AI 콘텐츠 생성 오류:', error);
      // 오류 시 기본 템플릿 사용
      const hasConflictData = hasRealConflict;
      const templates = getCategoryTemplate(category, hasConflictData);
      console.log('📋 오류 시 기본 템플릿 적용:', templates, '갈등데이터:', hasConflictData);
      setFormData(prev => {
        const newData = {
          ...prev,
          category: category, // 카테고리도 함께 업데이트
          title: templates.title,
          content: templates.content
        };
        console.log('📝 오류 시 formData 업데이트 전:', prev);
        console.log('📝 오류 시 formData 업데이트 후:', newData);
        return newData;
      });
    } finally {
      console.log('✅ generateCategoryContent 완료, isGenerating = false');
      setIsGenerating(false);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = async (e) => {
    const { name, value } = e.target;
    
    console.log("🎯 카테고리 변경:", { name, value, currentHasPrefilledData: hasPrefilledData });
    console.log("🔍 현재 location.state:", location.state);
    
    // 카테고리 변경 시 항상 해당 카테고리의 템플릿 적용
    if (name === 'category') {
      console.log("✨ 카테고리 변경 - 새 템플릿 적용:", value);
      
      // 갈등 공유 상태 초기화 (prefilled 상태 해제)
      if (hasPrefilledData) {
        console.log("🔄 갈등 공유 상태 초기화 - prefilled 해제");
        setHasPrefilledData(false);
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      // 카테고리가 변경되면 항상 새 템플릿 적용
      setFormData(prev => ({
        ...prev,
        [name]: value,
        title: '', // 생성 중임을 표시하기 위해 임시로 비움
        content: ''
      }));
      
      // AI 콘텐츠 생성
      await generateCategoryContent(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      await communityApi.createPost(formData);
      alert('게시글이 성공적으로 작성되었습니다!');
      navigate('/community');
    } catch (error) {
      alert('게시글 작성에 실패했습니다: ' + error.message);
      console.error('게시글 작성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-10 left-20 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-2 py-4 relative z-10">
        {/* 헤더 */}
        <div className="px-6 py-4 mb-5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-4xl font-bold mb-3" 
                  style={{ 
                    background: 'black',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {isConflictSharingPost ? '갈등 상황 공유하기' : '새 게시글 작성'}
                </h2>
                <p className="text-gray-600">
                  {isConflictSharingPost 
                    ? '갈등 상황을 공유하고 커뮤니티의 조언을 구해보세요' 
                    : '갈등 해결 경험과 조언을 커뮤니티와 나누어보세요'
                  }
                </p>
              </div>
            </div>
            {/* 작성자 정보 */}
            <div className="text-right">
              <p className="text-sm text-gray-500">작성자</p>
              <p className="font-bold" style={{ color: '#8B4513' }}>
                {user?.nickname || user?.name || user?.email}님
              </p>
            </div>
          </div>
        </div>

        {/* 카테고리별 안내 */}
        {formData.category === 'CONFLICT_SHARING' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">찬반대결 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 개인정보나 실명은 절대 포함하지 마세요</li>
                  <li>• 객관적이고 균형잡힌 시각으로 상황을 설명해주세요</li>
                  <li>• A안/B안 형태로 선택지를 제시하면 더 많은 의견을 받을 수 있어요</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {formData.category === 'ADVICE_REQUEST' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤝</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">조언 요청 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 상황을 구체적이고 명확하게 설명해주세요</li>
                  <li>• 어떤 도움이 필요한지 직접적으로 말해주세요</li>
                  <li>• 이미 시도해본 방법들도 함께 공유해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {formData.category === 'SUCCESS_STORIES' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🎉</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">해결 성공사례 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 해결 과정을 단계별로 상세히 공유해주세요</li>
                  <li>• 다른 사람에게 도움이 될 수 있는 팁을 포함해주세요</li>
                  <li>• 어려웠던 점과 극복한 방법을 솔직하게 작성해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {formData.category === 'GENERAL' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">💬</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">자유게시판 게시글 안내</h3>
                <ul className="text-gray-600 space-y-1 text-xs">
                  <li>• 서로 존중하는 대화로 자유롭게 소통해주세요</li>
                  <li>• 일상 경험과 고민을 나누며 공감대를 형성해보세요</li>
                  <li>• 긍정적이고 건설적인 내용으로 작성해주세요</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 작성 폼 */}
        <div className="bg-white rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                ✨ 카테고리를 선택하면 AI가 해당 유형에 맞는 제목과 내용 템플릿을 자동으로 생성해드려요
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(category => (
                  <label
                    key={category.value}
                    className="cursor-pointer p-4 rounded-lg border-2 text-center transition-all duration-250 ease-in-out transform hover:scale-105 hover:rotate-1"
                    style={{
                      background: formData.category === category.value ? category.gradient : '#FFFFFF',
                      borderColor: formData.category === category.value ? category.color : '#E5E7EB',
                      color: formData.category === category.value ? '#FFFFFF' : category.color
                    }}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={handleCategoryChange}
                      className="hidden"
                      disabled={isGenerating}
                    />
                    <div className="font-bold text-base">{category.label}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
                {isGenerating && (
                  <span className="ml-2 text-xs text-blue-600">
                    🤖 AI가 제목을 생성하고 있습니다...
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={isGenerating ? "AI가 제목을 생성하고 있습니다..." : "게시글 제목을 입력하세요"}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-300 focus:bg-orange-50 text-gray-800 placeholder-gray-400 transition-all duration-250 ease-in-out"
                  disabled={isLoading || isGenerating}
                  required
                />
                {isGenerating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100자
              </p>
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
                {isGenerating && (
                  <span className="ml-2 text-xs text-blue-600">
                    🤖 AI가 내용을 생성하고 있습니다...
                  </span>
                )}
              </label>
              <div className="relative">
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder={isGenerating 
                    ? "AI가 카테고리에 맞는 내용을 생성하고 있습니다..." 
                    : "게시글 내용을 입력하세요\n\n• 갈등 상황을 구체적으로 설명해주세요\n• 어떤 도움이 필요한지 명확히 해주세요\n• 다른 사람들에게 도움이 될 수 있는 경험을 공유해주세요"
                  }
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-300 focus:bg-orange-50 text-gray-800 placeholder-gray-400 resize-none transition-all duration-350 ease-in-out"
                  disabled={isLoading || isGenerating}
                  required
                />
                {isGenerating && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000자
              </p>
            </div>


            {/* 버튼 그룹 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-250 ease-in-out transform hover:scale-105 font-bold text-2xl"
                disabled={isLoading}
                style={{
                  borderColor: '#cd9f6e',
                  color: '#cd9f6e',
                  background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #cd9f6e 0%, #e6b88a 100%)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)';
                  e.currentTarget.style.color = '#cd9f6e';
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
                className="flex-1 py-3 text-white rounded transition-all duration-250 ease-in-out transform hover:scale-105 hover:brightness-110 disabled:bg-gray-300 disabled:transform-none disabled:hover:scale-100 disabled:hover:brightness-100 font-bold"
                style={{
                  background: isLoading || !formData.title.trim() || !formData.content.trim() 
                    ? '#D1D5DB' 
                    : 'linear-gradient(135deg, #8B4513 0%, #cd9f6e 100%)'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isConflictSharingPost ? '공유 중...' : '작성 중...'}
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-2xl">
                    <img src={hedgehogImg} alt="갈등도치" className="relative w-12 h-12 right-5 animate-bounce" />
                    {isConflictSharingPost ? '갈등 상황 공유하기' : '게시글 작성'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 하단 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            게시글 작성 시 <Link to="/community" className="font-bold hover:underline" style={{ color: '#8B4513' }}>커뮤니티 이용규칙</Link>에 동의한 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;