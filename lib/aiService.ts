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
            content: '너는 직장 동료 간의 칭찬 문장을 더욱 따뜻하고 예의바르며 긍정적인 메시지로 다듬어주는 AI 코치야. 원문의 진심과 의미는 살리면서 더 자연스럽고 감동적인 문장 1~2개로 다듬어줘. 칭찬 대상이 읽었을 때 기분 좋아지도록 만들어줘.'
          },
          {
            role: 'user',
            content: `다음 칭찬 문장을 따뜻하게 다듬어줘:\n"${originalText}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      });
      const result = response.choices[0]?.message?.content?.trim();
      if (result) return result.replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn('OpenAI API call failed for praise refinement, using fallback:', e);
    }
  }

  // Rule-based high quality fallback refinement
  const trimmed = originalText.trim();
  if (trimmed.endsWith('고맙습니다.') || trimmed.endsWith('감사합니다!')) {
    return `${trimmed} 언제나 당신의 노고가 우리 팀에 큰 힘이 됩니다! 🌟`;
  }
  return `${trimmed} 항상 묵묵히 밝은 에너지를 전달해 주셔서 진심으로 고맙습니다! 💖`;
}

export async function fetchAITimeCapsule(recipientName: string, praises: string[]): Promise<{ letter: string; keywords: string[] }> {
  const defaultKeywords = ['협업', '배려', '책임감', '전문성', '긍정에너지'];
  
  if (praises.length === 0) {
    return {
      letter: `${recipientName}님, 지난 2개월 동안 HT사업본부에서 보여주신 성실함과 따뜻한 동료애에 감사드립니다. 앞으로도 밝은 에너지를 기대합니다!`,
      keywords: defaultKeywords
    };
  }

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `너는 HT사업본부 AI Vitamin Program의 Time Capsule 담당자야.
2개월 동안 ${recipientName}님이 받은 칭찬 메시지들을 바탕으로:
1. 칭찬들에서 가장 두드러진 키워드 5개 (예: ["협업", "배려", "책임감", "전문성", "긍정에너지"])
2. 3~4문장 분량의 감동적인 2개월 요약 감사 편지를 작성해줘.

JSON 포맷으로 반환해줘:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "letter": "편지 내용..."
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
          letter: parsed.letter || `${recipientName}님, 수많은 동료들이 전달한 깊은 감사와 칭찬 메시지처럼, 늘 팀에 밝고 주도적인 긍정 선긍향을 전해주셨습니다.`,
          keywords: Array.isArray(parsed.keywords) && parsed.keywords.length >= 3 ? parsed.keywords : defaultKeywords
        };
      }
    } catch (e) {
      console.warn('OpenAI API call failed for time capsule, using fallback:', e);
    }
  }

  // High quality fallback letter generation
  return {
    letter: `${recipientName}님, 지난 2개월간 동료들이 보내온 수많은 칭찬에는 ${recipientName}님의 뛰어난 협업 능력과 따뜻한 배려심이 듬뿍 담겨 있습니다. 회의 정리부터 묵묵히 팀원들을 돕는 모습까지, HT사업본부를 더 행복한 일터로 만들어 주셔서 감사합니다! 💌`,
    keywords: defaultKeywords
  };
}
