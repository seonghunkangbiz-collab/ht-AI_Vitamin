import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const openai = (apiKey && !apiKey.includes('your-openai'))
  ? new OpenAI({ apiKey })
  : null;

const AI_SUGGESTIONS = [
  "회의 중 동료의 돋보이는 의견이 있다면 '좋은 아이디어네요!' 하고 말로 표현해 보세요.",
  "오늘 유난히 바빠 보이는 다른 팀 동료에게 따뜻한 음료 한 잔과 인사를 건네보세요.",
  "동료가 소소하게 도와준 일이 있다면 '덕분에 잘 마무리했어요'라고 작은 감사를 남겨보세요.",
  "타 부서와의 업무 협용 과정에서 인내심 있게 들어준 동료의 배려를 찾아보세요.",
  "항상 묵묵히 프로젝트의 기초 작업을 단단하게 다져주는 동료를 유심히 관찰해보세요.",
  "회의 자료나 문서를 명확하고 깔끔하게 작성해 준 동료에게 감사의 미소를 보여주세요.",
  "팀 분위기를 밝고 긍정적으로 끌어올려 주는 동료의 웃음에 칭찬 한 마디를 더해보세요.",
];

export async function fetchAISuggestion(): Promise<string> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '너는 HT사업본부 조직문화 코치야. 동료 간 따뜻한 관심과 칭찬을 유도하는 가볍고 자발적인 1문장 제안을 한국어로 작성해줘. 부담이나 미션 느낌이 없어야 해.'
          },
          {
            role: 'user',
            content: '오늘의 칭찬 제안 1문장을 작성해줘.'
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      });
      const result = response.choices[0]?.message?.content?.trim();
      if (result) return result.replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn('OpenAI API call failed for suggestion, using fallback:', e);
    }
  }

  // Fallback suggestion
  const randomIndex = Math.floor(Math.random() * AI_SUGGESTIONS.length);
  return AI_SUGGESTIONS[randomIndex];
}

export async function fetchAIRefinedPraise(originalText: string): Promise<string> {
  if (!originalText || originalText.trim().length === 0) return originalText;

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `너는 직장 동료 간의 칭찬 문장을 더욱 따뜻하고 예의바르며 감동적인 메시지로 다듬어주는 전문가야.
규칙:
1. 입력된 원문의 핵심 메시지와 진심을 100% 보존해줘.
2. 매번 동일한 상투어(예: "항상 묵묵히...", "언제나 당신의 노고가...", "진심으로 감사드립니다")를 일률적으로 덧붙이지 마.
3. 원문의 구체적인 행동이나 맥락(도움, 배려, 꼼꼼함, 웃음, 긍정에너지 등)에 어울리는 다양하고 자연스러운 한국어 문장 1~2개로 다듬어줘.
4. 불필요한 서두나 큰따옴표 없이 최종 다듬은 칭찬 메시지만 바로 반환해줘.`
          },
          {
            role: 'user',
            content: `다음 칭찬 문장을 자연스럽고 정성스럽게 다듬어줘 (다양성 시드: ${Math.random().toString(36).substring(7)}):\n"${originalText}"`
          }
        ],
        temperature: 0.85,
        max_tokens: 250
      });
      const result = response.choices[0]?.message?.content?.trim();
      if (result) return result.replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn('OpenAI API call failed for praise refinement, using fallback:', e);
    }
  }

  // Fallback engine: 10 distinct high-quality variations to prevent repeated/identical outputs
  const trimmed = originalText.trim();
  const VARIED_ENHANCERS = [
    (text: string) => `${text} 평소 보여주신 따뜻한 배려와 긍정적인 에너지가 우리 팀에 늘 큰 힘이 됩니다! ✨`,
    (text: string) => `${text} 묵묵히 최선을 다해주시는 덕분에 언제나 안심하고 함께 일할 수 있어요. 진심으로 감사해요! 🌟`,
    (text: string) => `${text} 세심한 관심과 센스 덕분에 팀 분위기가 한층 더 밝아지는 것 같아요. 늘 고맙습니다! 💖`,
    (text: string) => `${text} 동료들을 먼저 챙겨주시는 성실한 모습에 큰 감동을 받았습니다. 언제나 응원합니다! 👍`,
    (text: string) => `${text} 작은 부분까지 책임감 있게 챙겨주셔서 큰 도움이 되었습니다. 멋진 동료와 함께해서 기뻐요! 😊`,
    (text: string) => `${text} 매순간 보여주신 열정과 친절함이 함께하는 사람들에게 귀감이 됩니다. 진심으로 감사드려요! 🍀`,
    (text: string) => `${text} 따뜻한 미소와 인내심으로 함께해주셔서 업무 현장이 훨씬 더 훈훈해지는 느낌입니다! 🔥`,
    (text: string) => `${text} 늘 든든하게 받쳐주시고 시너지를 내주셔서 감사한 마음입니다. 앞으로도 화이팅입니다! 🎉`,
    (text: string) => `${text} 보이지 않는 곳에서도 팀을 위해 마음 써주시는 노고에 깊이 감사드립니다! 👏`,
    (text: string) => `${text} 언제나 밝은 표정과 유연한 태도로 배려해주셔서 함께 일하는 시간이 즐겁습니다! 💕`
  ];

  const randomIndex = Math.floor(Math.random() * VARIED_ENHANCERS.length);
  return VARIED_ENHANCERS[randomIndex](trimmed);
}

export async function fetchAITimeCapsule(recipientName: string, praises: string[]): Promise<{ letter: string; analysis: string; keywords: string[] }> {
  const defaultKeywords = ['협업', '배려', '책임감', '전문성', '긍정에너지'];
  const defaultAnalysis = `동료들은 ${recipientName}님을 항상 먼저 도와주는 동료, 팀 분위기를 밝고 화기애애하게 만드는 든든한 조력자로 기억하고 있습니다.`;
  const defaultLetter = `지난 두 달 동안 동료들이 보내준 응원과 칭찬을 분석했습니다. 많은 사람들이 ${recipientName}님의 따뜻한 배려와 강한 책임감을 이야기했습니다. 앞으로도 우리 본부에 좋은 에너지를 전해주세요.\n\n- AI Vitamin -`;

  if (praises.length === 0) {
    return {
      keywords: defaultKeywords,
      analysis: defaultAnalysis,
      letter: defaultLetter
    };
  }

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `너는 HT사업본부 AI Vitamin Program의 Time Capsule 분석관이야.
2개월 동안 ${recipientName}님이 받은 칭찬 메시지들을 분석해서 3가지를 생성해줘:
1. "keywords": 칭찬들에서 가장 두드러진 단어 5개 (예: ["협업", "배려", "책임감", "전문성", "긍정에너지"])
2. "analysis": "동료들은 ${recipientName}님을 ~한 사람으로 기억했습니다." 형태의 1-2문장 짧은 AI 동료 분석 요약.
3. "letter": 지난 두 달간의 응원과 칭찬을 바탕으로 한 따뜻한 AI 감사 편지 3-4문장. 끝에 "\n\n- AI Vitamin -"을 포함할 것.

JSON 포맷으로만 반환해줘:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "analysis": "동료들은 ... 기억했습니다.",
  "letter": "편지 내용...\n\n- AI Vitamin -"
}`
          },
          {
            role: 'user',
            content: `칭찬 메시지 목록:\n${praises.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          keywords: Array.isArray(parsed.keywords) && parsed.keywords.length >= 3 ? parsed.keywords : defaultKeywords,
          analysis: parsed.analysis || defaultAnalysis,
          letter: parsed.letter || defaultLetter
        };
      }
    } catch (e) {
      console.warn('OpenAI API call failed for time capsule, using fallback:', e);
    }
  }

  // High quality fallback letter generation
  return {
    keywords: defaultKeywords,
    analysis: defaultAnalysis,
    letter: defaultLetter
  };
}
