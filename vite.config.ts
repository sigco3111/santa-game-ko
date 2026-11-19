import { defineConfig } from 'vite'

// 한국어판: src/main.ts 의 화면 문구를 빌드 시 치환한다(원본 소스는 그대로 둔다).
const KO: Array<[string, string]> = [
  ["'Mute sound'", "'소리 끄기'"],
  ["'Enable sound'", "'소리 켜기'"],
  ["'Flight started. Aim for the glowing chimney rings.'", "'비행을 시작했어요. 빛나는 굴뚝 링을 노리세요.'"],
  ["`Route complete. ${score} points. ${deliveries} gifts delivered.`", "`경로 완료. ${score}점. 선물 ${deliveries}개를 배달했어요.`"],
  ["'Graphics settings'", "'그래픽 설정'"],
  ["'Flight guide'", "'비행 안내'"],
  ["'Flight paused'", "'비행 일시정지'"],
  ["'Resume flight'", "'비행 계속하기'"],
  ["'Resume intro'", "'오프닝 계속하기'"],
  ["'Done'", "'완료'"],
  ["'Got it'", "'알겠어요'"],
  ["'Baked lighting and fewer snowflakes give older graphics chips more headroom.'", "'미리 구운 조명과 적은 눈송이로 오래된 그래픽 칩에도 여유를 줘요.'"],
  ["'Soft shadows and moderate snowfall balance detail and frame rate.'", "'부드러운 그림자와 적당한 눈으로 디테일과 프레임을 맞춰요.'"],
  ["'Sharper shadows, denser snowfall and more celebration effects.'", "'또렷한 그림자, 더 많은 눈, 더 화려한 축하 효과를 보여 줘요.'"],
  ["'Copy score'", "'점수 복사'"],
  ["'Copied!'", "'복사했어요!'"],
  ["'Select & copy'", "'선택 후 복사'"],
  ["'Score copied to clipboard.'", "'점수를 클립보드에 복사했어요.'"],
  ["'Select the score text and copy it.'", "'점수 글자를 선택해서 복사하세요.'"],
  ["'TAP'", "'탭'"],
  ["'MISSED'", "'놓침'"],
  ["'Match the rings, then tap Drop'", "'링을 맞춘 뒤 투하를 누르세요'"],
  ["'Steer with the left and right buttons, or use A/D and the arrow keys.'", "'왼쪽·오른쪽 버튼이나 A/D, 방향키로 조향하세요.'"],
  ["'Tap Drop or press SPACE when the chimney ring turns mint and says DROP!'", "'굴뚝 링이 민트색으로 바뀌고 투하!가 뜨면 투하 버튼이나 SPACE를 누르세요!'"],
  ["`Gift delivered. ${score} points, streak of ${streak}.`", "`선물 배달 완료. ${score}점, ${streak}연속.`"],
  ["'The village needs WebGL 2. Turn on hardware acceleration in your browser, then reload to play.'", "'마을을 보려면 WebGL 2가 필요해요. 브라우저의 하드웨어 가속을 켠 뒤 새로고침해 주세요.'"],
  ["`I delivered ${deliveries} ${deliveries === 1 ? 'gift' : 'gifts'} for ${score.toLocaleString('en-US')} points in Santa Express: Chimney Panic! Can you beat my score? ${url}`", "`산타 익스프레스에서 선물 ${deliveries}개를 배달하고 ${score.toLocaleString('en-US')}점을 얻었어요! 제 점수를 넘어설 수 있나요? ${url}`"],
]

function koStrings() {
  return {
    name: 'ko-strings',
    enforce: 'pre' as const,
    transform(this: any, code: string, id: string) {
      if (!id.replace(/\\/g, '/').endsWith('src/main.ts')) return null
      let out = code
      for (const [from, to] of KO) {
        if (!out.includes(from)) this.warn('ko-strings: not found: ' + from)
        out = out.split(from).join(to)
      }
      return { code: out, map: null }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [koStrings()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-core', test: /three\/build\/three\.core\.js$/ },
            { name: 'three-renderer', test: /three\/build\/three\.module\.js$/ },
          ],
        },
      },
    },
  },
})
