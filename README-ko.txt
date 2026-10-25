SHORTFLIX — 자동 여백/세로 오버레이 전체 배포본

이 ZIP 하나를 업로드하세요. 이전 ZIP/코드와 섞거나 코드를 직접 넣을 필요 없습니다.
index.html부터 워커와 헤더 설정까지 포함되어 있습니다.

배포
1. Cloudflare Pages에서 기존 프로젝트를 엽니다.
2. 새 배포 / Upload assets를 선택합니다.
3. 이 ZIP 전체를 업로드하고 배포합니다.
   폴더 업로드 화면이면 압축을 풀고 index.html, _headers, assets가 있는 폴더를 올립니다.
4. 완료 후 사이트를 새로고침합니다. 예전 UI가 보이면 강력 새로고침을 하세요.

구조
index.html
_headers
assets/ffmpeg-worker.js
assets/ai-worker.js
README-ko.txt
VALIDATION.txt

index.html은 최상위에, 두 워커는 assets 폴더에 유지하세요.
Node / npm / Vite / Wrangler / API 키 / 환경변수 / 서버 코드는 필요 없습니다.
파일을 더블클릭한 file:// 실행은 지원하지 않습니다. 배포된 HTTPS에서 사용하세요.

이번 화면 배치
- 가로 및 정사각형 (너비 >= 높이): 원본 전체를 중앙에 최대 크기로 표시.
  위쪽 여백에 고정 제목, 아래쪽 여백에 자동 음성 자막.
- 세로 (높이 > 너비): 자막용 추가 축소 없음. 제목/자막을 실제 영상 위에 표시.
  정확한 9:16 영상은 전체 1080x1920을 채웁니다.
- 9:16과 다른 세로 영상은 원본 보존을 위해 필요한 최소 여백만 남습니다.
  화면을 자르거나 늘이지 않으며 자막 공간 확보를 위해 더 축소하지 않습니다.
- 모든 출력: 1080x1920, 9:16, 30fps, H.264/AAC MP4.
- 배경 선택: 검정 + 흰 글자 / 흰색 + 검정 글자.
- 세로 영상 위 글자는 배경 선택과 무관하게 흰색 + 검정 외곽선/반투명 박스.
- 입력 파일 선택 후 가로/세로 자동 배치 결과를 표시합니다.

사용
1. 데스크톱 Chrome/Edge에서 MP4 선택
2. 여백 배경색 선택
3. 언어와 자동 자막 표시 여부 선택
4. 필요하면 제목/고정 문구 입력 (최대 100자, 자동 줄바꿈 후 4줄 이내)
5. Generate My Short
6. 완료 후 MP4 다운로드. 인식된 자막은 SRT로 별도 다운로드 가능

기존 기능
Whisper WebGPU -> CPU/WASM -> 음량 기반 대체 분석.
선택적 WebLLM 후보 평가 -> 실패 시 기본 휴리스틱 유지.
최대 30초 하이라이트, 취소, 진행률, 로그 복사, 안전한 광고 시뮬레이션.
모델은 차례로 실행하고 사용 후 워커를 종료합니다.
광고 패널은 즉시 닫을 수 있으며 닫아도 변환이 계속됩니다.
카운트다운은 가상 쇼케이스 애니메이션이지 처리 예상시간이 아닙니다.

자막 구현
FFmpeg 0.12.10 core 직접 워커 브리지로 통일했습니다. 0.11 API를 섞지 않습니다.
libass ASS를 사용하여 제목과 음성 자막의 좌표/색상/정렬을 명시했습니다.
코어에 drawtext가 없어도 해당 필터에 의존하지 않습니다.
한글 지원 폰트를 브라우저에서 내려받습니다. 요청된 자막 렌더링이 실패하면 오류를 표시하며
문구가 포함된 것처럼 몰래 성공 처리하지 않습니다.
STT 자체 실패/인식 결과 없음은 자동 자막이 없음을 표시하고 음량 기반 변환으로 진행합니다.
SRT는 시간/문장 파일만 포함하므로 별도 플레이어에서는 ASS의 위치/색상을 유지하지 않습니다.

범위와 제한
영상/오디오는 로컬에서 처리합니다. 엔진/모델/폰트는 실행 중 CDN에서 다운로드하므로
첫 실행은 인터넷이 필요합니다. ZIP에 큰 엔진 바이너리나 모델 가중치는 포함하지 않습니다.
CDN 요청에는 일반 접속 정보가 전달됩니다. 실제 광고/분석 SDK는 없습니다.
MP4 최대 512MiB / 30분 / 4K 상당 픽셀 수. WORKERFS 불가 시 192MiB 이하 메모리 대체.
오디오 트랙 없는 MP4는 추출 단계에서 실패할 수 있습니다.
1080x1920 Wasm 렌더링은 느리고 RAM 사용량이 클 수 있습니다.
기하 계산에는 브라우저가 보고한 표시 크기를 사용합니다. 비정상 SAR/회전 메타데이터는
브라우저와 FFmpeg 해석 차이가 있을 수 있으므로 결과를 확인하세요.
자막 타이밍은 Whisper 구간 기반 근사이며 자동 줄 분할도 사용합니다.
특정 GPU/코덱 호환성, 완벽한 음성 인식 또는 바이럴 성과를 보장하지 않습니다.
플랫폼 UI는 달라질 수 있으므로 자막 위치는 실제 게시 앱에서도 검토하세요.

검증
- JS 구문 검사 3종 / 필수 DOM 연결 및 중복 ID 검사 통과
- 순수 함수 테스트 18개 통과
- 네이티브 FFmpeg 입력 비율 5종 x 배경색 2종 = 10건 필터/픽셀 검사 통과
- 가로/정사각형 4건에서 제목/자막이 여백에 실제 그려지고 원본 위에 겹치지 않음을 확인
- 정확한 9:16의 원본 영역이 1080x1920 전체를 유지함을 확인
네이티브 검증은 ASCII 테스트 글꼴을 사용했습니다. 브라우저 Wasm/WebGPU/한글 모델/폰트
다운로드/Cloudflare 배포/실제 영상 전체 변환은 이 환경에서 실행하지 않았습니다.
짧은 영상으로 먼저 확인하고 공개 전 실제 브라우저 회귀 테스트를 진행하세요.

외부 의존성
https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/
https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd/
https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js
https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.79/+esm
https://huggingface.co/onnx-community/whisper-tiny
https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf
Font license: https://github.com/notofonts/noto-cjk/blob/main/Sans/LICENSE
공개 배포 전 각 라이브러리/모델/코덱/폰트 라이선스 및 CDN 정책을 확인하세요.
