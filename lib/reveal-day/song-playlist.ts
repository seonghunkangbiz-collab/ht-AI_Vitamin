export interface LyricSection {
  tag: string;
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'post-chorus' | 'bridge' | 'outro';
  lines: string[];
}

export interface SongTrack {
  id: string;
  title: string;
  subTitle: string;
  badge: string;
  src: string;
  durationSeconds: number;
  durationLabel: string;
  sections: LyricSection[];
}

export const AI_VITAMIN_PLAYLIST: SongTrack[] = [
  {
    id: 'track-1-long',
    title: '〈다 잘하고 있어〉 (Full Ver.)',
    subTitle: 'Hi-Tech 사업본부 AI Vitamin Song',
    badge: '긴 음악 (4분 27초)',
    src: '/audio/ai_vitamin_song_long.mp3',
    durationSeconds: 267,
    durationLabel: '04:27',
    sections: [
      {
        tag: 'Intro',
        type: 'intro',
        lines: [
          '오, 오, 오 — 함께라서',
          '오, 오, 오 — 참 고마워',
          '오늘은 우리 서로 말해 줘',
          '다 잘하고 있어!'
        ]
      },
      {
        tag: 'Verse 1',
        type: 'verse',
        lines: [
          '물어볼 때마다 친절한 대답',
          '복잡했던 일이 조금 풀리던 날',
          '묵묵하게 챙긴 작은 일들이',
          '우리의 하루를 받쳐 주었지',
          '',
          '바쁜 와중에도 건네는 미소',
          '조용한 줄 알았던 동료의 유머',
          '“같이 점심해요” 그 한마디에',
          '조금 멀던 마음 가까워졌네'
        ]
      },
      {
        tag: 'Pre-Chorus',
        type: 'pre-chorus',
        lines: [
          '말하지 못했던 고마운 마음',
          '두 달 동안 차곡차곡 모였어',
          '멀리서 보내던 작은 응원이',
          '이제 너에게 들리게'
        ]
      },
      {
        tag: 'Chorus',
        type: 'chorus',
        lines: [
          '잘하고 있어, 다 잘하고 있어',
          '애쓴 하루하루 우리가 알아',
          '고생했어요, 참 고마워요',
          '그대가 있어서 참 든든해요',
          '',
          '잘하고 있어, 다 잘하고 있어',
          '잠깐 쉬어 가도 괜찮아',
          '하이테크 사업본부, 함께 불러요',
          '서로가 서로의 비타민!'
        ]
      },
      {
        tag: 'Post-Chorus',
        type: 'post-chorus',
        lines: [
          '오, 오, 오 — 참 잘했어요',
          '오, 오, 오 — 참 고마워요',
          '에이아이 비타민, 마음을 채워',
          '우리 모두에게 박수를!'
        ]
      },
      {
        tag: 'Verse 2',
        type: 'verse',
        lines: [
          '“해보겠습니다” 내딛는 한 걸음',
          '처음 맡은 일에 고민하던 마음',
          '계약 한 줄까지 살피는 정성',
          '보이지 않아도 큰 힘이 됐어',
          '',
          '새로운 기술을 나누는 동료',
          '먼 곳에서 제 몫을 다하는 동료',
          '“도울 일 있으면 얘기해 줘요”',
          '그 말이 얼마나 고마웠는지'
        ]
      },
      {
        tag: 'Pre-Chorus',
        type: 'pre-chorus',
        lines: [
          '본부장님도, 팀장님들도',
          '매니저님도, 우리 모두 다',
          '각자의 자리에서 애쓴 만큼',
          '오늘은 칭찬을 받아요'
        ]
      },
      {
        tag: 'Chorus',
        type: 'chorus',
        lines: [
          '잘하고 있어, 다 잘하고 있어',
          '애쓴 하루하루 우리가 알아',
          '고생했어요, 참 고마워요',
          '그대가 있어서 참 든든해요',
          '',
          '잘하고 있어, 다 잘하고 있어',
          '잠깐 쉬어 가도 괜찮아',
          '하이테크 사업본부, 함께 불러요',
          '서로가 서로의 비타민!'
        ]
      },
      {
        tag: 'Bridge',
        type: 'bridge',
        lines: [
          '늘 밝게 웃지 않아도 괜찮아',
          '힘든 날엔 먼저 기대도 좋아',
          '커피 한 잔, 잠깐의 산책',
          '오늘은 내가 그 얘길 들어 줄게',
          '',
          '미처 다 못 했던 일보다',
          '오늘 함께해 준 네가 고마워',
          '이 말은 꼭 전하고 싶어',
          '지금도 충분히 잘하고 있어'
        ]
      },
      {
        tag: 'Final Chorus',
        type: 'chorus',
        lines: [
          '잘하고 있어, 다 잘하고 있어',
          '서로의 진심이 여기 모였어',
          '고생했어요, 참 고마워요',
          '함께한 우리가 참 자랑스러워',
          '',
          '잘하고 있어, 다 잘하고 있어',
          '우리의 속도로 걸어가',
          '하이테크 사업본부, 함께 불러요',
          '서로가 서로의 비타민!'
        ]
      },
      {
        tag: 'Outro',
        type: 'outro',
        lines: [
          '오, 오, 오 — 참 잘했어요',
          '오, 오, 오 — 참 고마워요',
          '내 곁의 동료가 바로 비타민',
          '우리 모두, 다 잘하고 있어!'
        ]
      }
    ]
  },
  {
    id: 'track-2-short',
    title: '〈다 잘하고 있어〉 (Special Ver.)',
    subTitle: 'Hi-Tech AI Vitamin Song',
    badge: '스페셜 (2분 46초)',
    src: '/audio/ai_vitamin_song_short.mp3',
    durationSeconds: 166,
    durationLabel: '02:46',
    sections: [
      {
        tag: 'Verse 1',
        type: 'verse',
        lines: [
          '물어볼 때마다 친절한 대답',
          '복잡했던 일이 풀리던 순간',
          '묵묵하게 챙긴 작은 일들이',
          '우리의 하루를 받쳐 주었지',
          '',
          '바쁜 와중에도 건네는 미소',
          '생각지도 못한 동료의 유머',
          '“같이 점심해요” 그 한마디에',
          '조금 멀던 마음 가까워졌네'
        ]
      },
      {
        tag: 'Pre-Chorus',
        type: 'pre-chorus',
        lines: [
          '두 달 동안 모아 온 마음',
          '이제는 들려줄게',
          '보이지 않던 그 수고까지',
          '우리는 알고 있어'
        ]
      },
      {
        tag: 'Chorus',
        type: 'chorus',
        lines: [
          '잘하고 있어, 다 잘하고 있어',
          '애쓴 하루하루 우리가 알아',
          '고생했어요, 참 고마워요',
          '그대가 있어서 참 든든해요',
          '',
          '잘하고 있어, 다 잘하고 있어',
          '잠깐 쉬어 가도 괜찮아',
          '하이테크 사업본부, 함께 불러요',
          '서로가 서로의 비타민!'
        ]
      },
      {
        tag: 'Verse 2',
        type: 'verse',
        lines: [
          '“해보겠습니다” 내딛는 걸음',
          '처음 맡은 일에 고민한 마음',
          '계약 한 줄까지 살피는 정성',
          '멀리서 보내 준 따뜻한 응원',
          '',
          '본부장님도 팀장님들도',
          '매니저님도 우리 모두 다',
          '“도울 일 있으면 얘기해 줘요”',
          '그 말에 오늘도 힘을 얻어요'
        ]
      },
      {
        tag: 'Bridge',
        type: 'bridge',
        lines: [
          '늘 밝게 웃지 않아도 괜찮아',
          '힘든 날엔 먼저 기대도 좋아',
          '커피 한 잔에 숨을 돌려요',
          '오늘은 내가 얘길 들어 줄게'
        ]
      },
      {
        tag: 'Final Chorus',
        type: 'chorus',
        lines: [
          '잘하고 있어, 다 잘하고 있어',
          '애쓴 하루하루 우리가 알아',
          '고생했어요, 참 고마워요',
          '함께한 우리가 참 자랑스러워',
          '',
          '잘하고 있어, 다 잘하고 있어',
          '우리의 속도로 걸어가',
          '하이테크 사업본부, 함께 불러요',
          '서로가 서로의 비타민!'
        ]
      },
      {
        tag: 'Outro',
        type: 'outro',
        lines: [
          '참 잘했어요, 참 고마워요',
          '우리 모두 다 잘하고 있어!'
        ]
      }
    ]
  }
];

export interface ParsedVideoInfo {
  type: 'youtube' | 'direct' | 'vimeo' | 'local' | 'unknown';
  embedUrl: string;
  originalUrl: string;
  fileName?: string;
  isValid: boolean;
}

export function parseVideoUrl(inputUrl?: string): ParsedVideoInfo {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { type: 'unknown', embedUrl: '', originalUrl: '', isValid: false };
  }
  let trimmed = inputUrl.trim();
  if (!trimmed) {
    return { type: 'unknown', embedUrl: '', originalUrl: '', isValid: false };
  }

  // Remove surrounding quotes if user copied path with quotes
  trimmed = trimmed.replace(/^["']|["']$/g, '');

  // 1. YouTube Matcher
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = trimmed.match(youtubeRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1&rel=0&playsinline=1&modestbranding=1`,
      originalUrl: trimmed,
      isValid: true
    };
  }

  // 2. Vimeo Matcher
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[1])) {
    const vimeoId = vimeoMatch[3] || vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=0`,
      originalUrl: trimmed,
      isValid: true
    };
  }

  // 3. Blob / Data URL (from in-memory file selection)
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:video')) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      originalUrl: trimmed,
      isValid: true
    };
  }

  // 4. Already an API route stream URL
  if (trimmed.startsWith('/api/reveal-day/video-file')) {
    let name = 'local_video.mp4';
    try {
      const match = trimmed.match(/[?&]path=([^&]+)/);
      if (match && match[1]) {
        name = decodeURIComponent(match[1]).split(/[\/\\]/).pop() || name;
      }
    } catch {}
    return {
      type: 'local',
      embedUrl: trimmed,
      originalUrl: trimmed,
      fileName: name,
      isValid: true
    };
  }

  // 5. External HTTP / HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      originalUrl: trimmed,
      isValid: true
    };
  }

  // 6. Local PC File Path or File Name (e.g. /Users/.../song.mp4, C:\...song.mp4, /video/song.mp4, song.mp4)
  const isVideoExt = /\.(mp4|mov|webm|m4v|mkv|avi)$/i.test(trimmed);
  const isLocalPathPattern =
    trimmed.startsWith('file://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('~') ||
    /^[a-zA-Z]:[\\/]/.test(trimmed) ||
    trimmed.includes('/') ||
    trimmed.includes('\\');

  if (isVideoExt || isLocalPathPattern) {
    let cleanLocal = trimmed;
    if (cleanLocal.startsWith('file://')) {
      cleanLocal = decodeURIComponent(cleanLocal.replace(/^file:\/\//, ''));
    }
    const fileName = cleanLocal.split(/[\/\\]/).pop() || cleanLocal;
    return {
      type: 'local',
      embedUrl: `/api/reveal-day/video-file?path=${encodeURIComponent(cleanLocal)}`,
      originalUrl: trimmed,
      fileName,
      isValid: true
    };
  }

  return { type: 'unknown', embedUrl: '', originalUrl: trimmed, isValid: false };
}
