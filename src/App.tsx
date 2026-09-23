import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Droplets,
  Flame,
  HeartPulse,
  Info,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Utensils,
  X,
} from 'lucide-react'

type Food = { name: string; sodium: number; category: string; aliases?: string[] }
type Meal = Food & { servings: number; fallback?: boolean }
type Result = {
  score: number
  level: 'safe' | 'caution' | 'moderate' | 'warning' | 'high'
  label: string
  totalSodium: number
  sodiumRatio: number
  bodyWater: number
  nightTime: number
  hours: number
  fallback: boolean
  height: number
  weight: number
}

const foods: Food[] = [
  { name: '김치찌개', sodium: 1250, category: '찌개류', aliases: ['김치찌게'] },
  { name: '된장찌개', sodium: 1100, category: '찌개류' },
  { name: '라면', sodium: 1790, category: '면류', aliases: ['라멘'] },
  { name: '떡볶이', sodium: 950, category: '분식류' },
  { name: '치킨', sodium: 820, category: '가공식품' },
  { name: '삼겹살', sodium: 670, category: '구이류' },
  { name: '샐러드', sodium: 390, category: '채소류' },
  { name: '초밥', sodium: 760, category: '일식류' },
  { name: '국물류 평균', sodium: 1050, category: '국물류' },
  { name: '면류 평균', sodium: 1350, category: '면류' },
]

const morningSteps = [
  ['00:00', '쇄골과 목 주변 호흡·이완', '손끝으로 쇄골 라인을 가볍게 쓸며 깊게 호흡해요.'],
  ['01:00', '귀 앞에서 턱선까지', '귀 앞에서 턱선을 따라 목 방향으로 부드럽게 내려요.'],
  ['02:00', '볼 중앙에서 귀 방향', '볼 중앙부터 귀 앞까지 피부를 밀지 않도록 가볍게 터치해요.'],
  ['03:00', '눈 밑과 관자놀이', '눈 밑은 약한 압력으로, 관자놀이는 작은 원을 그려요.'],
  ['04:00', '목에서 쇄골로 마무리', '목 옆을 따라 쇄골까지 천천히 쓸어내리며 마무리해요.'],
]

const workoutSteps = [
  { title: '제자리 걷기', duration: 180, detail: '팔을 자연스럽게 흔들며 호흡을 길게 유지해요.' },
  { title: '발목 펌핑', duration: 120, detail: '발끝을 당겼다 밀며 종아리 순환을 깨워요.' },
  { title: '종아리 올리기', duration: 120, detail: '벽을 짚고 천천히 올라갔다 내려와요.' },
  { title: '목·어깨 이완', duration: 180, detail: '어깨를 내리고 목을 좌우로 부드럽게 풀어요.' },
]

function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max) }

function getHours(mealTime: string, bedtime: string) {
  if (!mealTime || !bedtime) return null
  const [mealH, mealM] = mealTime.split(':').map(Number)
  const [bedH, bedM] = bedtime.split(':').map(Number)
  let meal = mealH * 60 + mealM
  let bed = bedH * 60 + bedM
  if (bed <= meal) bed += 1440
  if (meal < 0 || bed < 0) return null
  return (bed - meal) / 60
}

function calculate(meals: Meal[], heightInput: string, weightInput: string, mealTime: string, bedtime: string): Result {
  const height = Number(heightInput) >= 120 && Number(heightInput) <= 220 ? Number(heightInput) : 165
  const weight = Number(weightInput) >= 30 && Number(weightInput) <= 180 ? Number(weightInput) : 60
  const totalSodium = meals.reduce((sum, meal) => sum + meal.sodium * meal.servings, 0)
  const sodiumRatio = clamp(totalSodium / 2000, 0, 1) * 100
  const bmi = weight / ((height / 100) ** 2)
  const bodyWater = clamp(30 + Math.abs(bmi - 21.8) * 4.4, 15, 82)
  const hours = getHours(mealTime, bedtime) ?? 4
  const nightTime = hours < 3 ? 100 : hours < 5 ? 70 : hours < 7 ? 40 : 15
  const score = Math.round(clamp(sodiumRatio * 0.5 + bodyWater * 0.25 + nightTime * 0.25, 0, 100))
  const level = score <= 20 ? 'safe' : score <= 40 ? 'caution' : score <= 60 ? 'moderate' : score <= 80 ? 'warning' : 'high'
  const labels = { safe: '안전', caution: '주의', moderate: '보통', warning: '경고', high: '강력 권고' }
  return { score, level, label: labels[level], totalSodium, sodiumRatio, bodyWater: Math.round(bodyWater), nightTime, hours, fallback: height === 165 && weight === 60 && (heightInput !== '165' || weightInput !== '60'), height, weight }
}

function App() {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'routine' | 'guide'>('diagnosis')
  const [query, setQuery] = useState('')
  const [meals, setMeals] = useState<Meal[]>([{ ...foods[0], servings: 1 }])
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [mealTime, setMealTime] = useState('19:30')
  const [bedtime, setBedtime] = useState('23:30')
  const [result, setResult] = useState<Result | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([{ from: 'assistant', text: '지금 가장 궁금한 걸 물어보세요. 점수의 이유, 물 섭취량, 아침 루틴을 설명해드릴게요.' }])
  const [workoutIndex, setWorkoutIndex] = useState(0)
  const [seconds, setSeconds] = useState(workoutSteps[0].duration)
  const [isPlaying, setIsPlaying] = useState(false)

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return foods.slice(0, 5)
    return foods.filter(food => food.name.toLowerCase().includes(normalized) || food.aliases?.some(alias => alias.includes(normalized))).slice(0, 5)
  }, [query])

  function addMeal(food: Food) {
    setMeals(current => [...current, { ...food, servings: 1, fallback: food.name.includes('평균') }])
    setQuery('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setResult(calculate(meals, height, weight, mealTime, bedtime))
    setActiveTab('diagnosis')
  }

  function askGuide(event: FormEvent) {
    event.preventDefault()
    if (!chatInput.trim()) return
    const question = chatInput.trim()
    const answer = result
      ? question.includes('물') ? `${result.score >= 61 ? '400~500ml' : result.score >= 21 ? '250~300ml' : '갈증에 맞춘 적정량'}의 미온수를 한 번에 다 마시기보다 나누어 섭취하세요.`
        : question.includes('아침') ? '아침 5분 카드에서 쇄골·목을 먼저 열고, 볼에서 귀 방향으로 가볍게 쓸어내리면 됩니다.'
          : `현재 점수는 ${result.score}점입니다. 나트륨 ${Math.round(result.totalSodium)}mg, 식사 후 취침까지 ${result.hours.toFixed(1)}시간이 반영됐어요.`
      : '먼저 저녁 식단을 입력하고 분석을 실행하면 현재 점수에 맞춰 답할 수 있어요.'
    setChatMessages(current => [...current, { from: 'user', text: question }, { from: 'assistant', text: answer }])
    setChatInput('')
  }

  function toggleWorkout() {
    setIsPlaying(current => !current)
  }

  function nextWorkout() {
    const next = (workoutIndex + 1) % workoutSteps.length
    setWorkoutIndex(next)
    setSeconds(workoutSteps[next].duration)
    setIsPlaying(false)
  }

  const levelClass = result?.level ?? 'safe'
  const waterText = result && result.score >= 61 ? '400–500ml' : result && result.score >= 21 ? '250–300ml' : '적정량'

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <nav className="topbar">
        <button className="brand" onClick={() => setActiveTab('diagnosis')}><span className="brand-mark"><Sparkles size={16} /></span><span>FACEFIT <em>ASSISTANT</em></span></button>
        <div className="topbar-meta"><span className="status-dot" /> 오늘 저녁을 위한 컨디션 체크</div>
        <button className="icon-button" title="안전 안내"><ShieldCheck size={18} /></button>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span>01</span> NIGHT RESET PROTOCOL</div>
        <h1>내일 아침,<br /><i>가벼운 얼굴</i>로 시작해요.</h1>
        <p>오늘 저녁의 염도와 생활 리듬을 읽고<br />내일 아침 붓기 가능성을 미리 준비합니다.</p>
        <div className="hero-orbit"><div className="orbit-ring" /><div className="orbit-core"><Droplets size={30} /><span>water<br />balance</span></div></div>
      </section>

      <div className="workspace">
        <div className="tabbar" role="tablist">
          <button className={activeTab === 'diagnosis' ? 'active' : ''} onClick={() => setActiveTab('diagnosis')}><Utensils size={16} /> 오늘의 진단</button>
          <button className={activeTab === 'routine' ? 'active' : ''} onClick={() => setActiveTab('routine')}><TimerReset size={16} /> 루틴 타이머</button>
          <button className={activeTab === 'guide' ? 'active' : ''} onClick={() => setActiveTab('guide')}><MessageCircle size={16} /> 가이드 챗</button>
        </div>

        {activeTab === 'diagnosis' && <div className="content-grid">
          <form className="panel form-panel" onSubmit={submit}>
            <div className="panel-heading"><div><span className="section-index">A / 01</span><h2>저녁 식단 스캔</h2></div><span className="required">필수 입력</span></div>
            <p className="panel-intro">오늘 먹은 메뉴를 검색해 주세요. 음식 DB의 평균값을 바탕으로 계산합니다.</p>
            <div className="search-wrap"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="메뉴를 검색해 보세요 (예: 라면)" /><kbd>⌘ K</kbd></div>
            {query && <div className="suggestions">{suggestions.length ? suggestions.map(food => <button type="button" key={food.name} onClick={() => addMeal(food)}><span>{food.name}</span><small>{food.category} · {food.sodium.toLocaleString()}mg</small><Plus size={16} /></button>) : <button type="button" onClick={() => addMeal({ name: query, category: '유사 카테고리', sodium: 1050, aliases: [] })}><span>{query}</span><small>국물류 평균값으로 대체</small><Plus size={16} /></button>}</div>}
            <div className="meal-list">{meals.map((meal, index) => <div className="meal-row" key={`${meal.name}-${index}`}><div className="meal-icon"><Utensils size={16} /></div><div className="meal-info"><strong>{meal.name}</strong><span>{meal.fallback ? '유사 카테고리 평균' : meal.category} · 1회 {meal.sodium.toLocaleString()}mg</span></div><div className="stepper"><button type="button" onClick={() => setMeals(current => current.map((item, i) => i === index ? { ...item, servings: Math.max(.5, item.servings - .5) } : item))}>−</button><b>{meal.servings}</b><button type="button" onClick={() => setMeals(current => current.map((item, i) => i === index ? { ...item, servings: item.servings + .5 } : item))}>+</button></div><button className="remove-button" type="button" onClick={() => setMeals(current => current.filter((_, i) => i !== index))}><X size={15} /></button></div>)}</div>
            <div className="subsection"><div className="subsection-title"><span className="section-index">B / 02</span><h2>오늘의 리듬</h2></div><div className="field-grid"><label><span><Clock3 size={14} /> 식사한 시각</span><input type="time" value={mealTime} onChange={event => setMealTime(event.target.value)} /></label><label><span><MoonIcon /> 취침 예정</span><input type="time" value={bedtime} onChange={event => setBedtime(event.target.value)} /></label></div></div>
            <div className="subsection"><div className="subsection-title"><span className="section-index">C / 03</span><h2>바디 프로필 <small>선택 사항</small></h2></div><div className="field-grid"><label><span>키 <small>cm</small></span><input type="number" min="120" max="220" placeholder="165" value={height} onChange={event => setHeight(event.target.value)} /></label><label><span>몸무게 <small>kg</small></span><input type="number" min="30" max="180" placeholder="60" value={weight} onChange={event => setWeight(event.target.value)} /></label></div></div>
            <button className="primary-button" type="submit">붓기 가능성 분석하기 <ArrowRight size={18} /></button>
            <p className="form-note"><Info size={14} /> 기본값 165cm / 60kg · 생활 습관 참고용 분석</p>
          </form>

          <aside className={`panel result-panel ${result ? 'has-result' : 'empty-result'}`}>
            {!result ? <><div className="empty-visual"><div className="empty-circle"><Sparkles size={27} /></div></div><span className="section-index">YOUR MORNING FORECAST</span><h2>아직 오늘의<br /><i>신호를 읽지 않았어요.</i></h2><p>식단과 리듬을 입력하면<br />내일 아침을 위한 작은 플랜이 열립니다.</p><div className="empty-points"><span><Check size={14} /> 나트륨 밸런스</span><span><Check size={14} /> 수분 리듬</span><span><Check size={14} /> 맞춤 루틴</span></div></> : <><div className="result-top"><span className={`level-pill ${levelClass}`}><span /> {result.label}</span><span className="result-date"><CalendarDays size={14} /> 내일 아침 예상</span></div><div className="score-wrap"><div className="score-number">{result.score}<small>/100</small></div><div className="score-copy"><strong>{result.score >= 61 ? '오늘 밤, 순환에<br />조금 더 힘을 실어주세요.' : result.score >= 21 ? '내일 아침을 위한<br />가벼운 준비가 필요해요.' : '내일 아침도<br />가볍게 시작할 수 있어요.'}</strong><span>얼굴 붓기 가능성 {result.label}</span></div></div><div className="score-meter"><span style={{ width: `${result.score}%` }} /></div><div className="factor-list"><div><span><Droplets size={15} /> 나트륨 영향</span><b>{Math.round(result.sodiumRatio)}%</b></div><div><span><HeartPulse size={15} /> 바디 밸런스</span><b>{result.bodyWater}점</b></div><div><span><Clock3 size={15} /> 식사 후 취침</span><b>{result.hours.toFixed(1)}시간</b></div></div><div className="result-actions"><button onClick={() => setActiveTab('routine')}><Flame size={16} /> 저녁 루틴 시작</button><button onClick={() => setActiveTab('guide')}><MessageCircle size={16} /> 가이드에게 묻기</button></div><div className="safety-line"><ShieldCheck size={14} /> 진단이 아닌 생활 습관 기반 참고 지표입니다.</div></>}
          </aside>
        </div>}

        {activeTab === 'routine' && <div className="routine-layout"><section className="panel timer-panel"><div className="panel-heading"><div><span className="section-index">TONIGHT / ROUTINE</span><h2>{result && result.score >= 61 ? '순환을 깨우는 15분' : '가볍게 푸는 10분'}</h2></div><span className="level-pill warning"><span /> {result?.label ?? '추천 루틴'}</span></div><div className="timer-stage"><div className="timer-ring"><div><span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span><small>남은 시간</small></div></div><div className="timer-step"><span>STEP {workoutIndex + 1} / {workoutSteps.length}</span><h3>{workoutSteps[workoutIndex].title}</h3><p>{workoutSteps[workoutIndex].detail}</p></div></div><div className="timer-controls"><button className="secondary-button" onClick={() => { setWorkoutIndex(0); setSeconds(workoutSteps[0].duration); setIsPlaying(false) }}><RotateCcw size={17} /> 처음부터</button><button className="play-button" onClick={toggleWorkout}>{isPlaying ? <Pause size={20} /> : <Play size={20} />}{isPlaying ? '일시정지' : '시작하기'}</button><button className="secondary-button" onClick={nextWorkout}>다음 <ArrowRight size={17} /></button></div></section><section className="panel routine-list"><span className="section-index">THE FLOW</span><h2>오늘 밤의 흐름</h2>{workoutSteps.map((step, index) => <button className={index === workoutIndex ? 'routine-item current' : 'routine-item'} key={step.title} onClick={() => { setWorkoutIndex(index); setSeconds(step.duration); setIsPlaying(false) }}><span className="routine-number">0{index + 1}</span><span><strong>{step.title}</strong><small>{Math.floor(step.duration / 60)} min · {step.detail}</small></span>{index < workoutIndex ? <Check size={16} /> : <ChevronDown size={16} />}</button>)}<div className="warning-note"><Info size={16} /><span>통증·어지러움·호흡 곤란이 느껴지면 즉시 멈추고 쉬어주세요.</span></div></section></div>}

        {activeTab === 'guide' && <div className="guide-layout"><section className="panel chat-panel"><div className="panel-heading"><div><span className="section-index">PERSONAL GUIDE</span><h2>오늘의 가이드</h2></div><span className="online"><span /> LIVE</span></div><div className="chat-window">{chatMessages.map((message, index) => <div className={`chat-bubble ${message.from}`} key={`${message.text}-${index}`}>{message.from === 'assistant' && <div className="avatar"><Sparkles size={14} /></div>}<p>{message.text}</p></div>)}</div><form className="chat-input" onSubmit={askGuide}><input value={chatInput} onChange={event => setChatInput(event.target.value)} placeholder="예: 지금 물을 얼마나 마셔요?" /><button title="질문 보내기"><ArrowRight size={18} /></button></form></section><aside className="panel guide-aside"><div className="guide-symbol"><Droplets size={25} /></div><span className="section-index">QUICK ACTIONS</span><h2>바로 실행하는<br /><i>작은 습관들</i></h2><div className="quick-list"><button onClick={() => setActiveTab('routine')}><span><Flame size={16} /></span><b>저녁 순환 루틴<small>지금 10분 시작하기</small></b><ArrowRight size={16} /></button><button onClick={() => setChatInput('아침 루틴 알려줘')}><span><Sparkles size={16} /></span><b>아침 5분 마사지<small>내일 아침 준비하기</small></b><ArrowRight size={16} /></button><button onClick={() => setChatInput('물 섭취량 알려줘')}><span><Droplets size={16} /></span><b>수분 밸런스<small>{waterText} 권장</small></b><ArrowRight size={16} /></button></div></aside></div>}
      </div>
      <footer><span>FACEFIT ASSISTANT <em>v1.0 / wellness preview</em></span><span>모든 결과는 생활 습관 참고용이며 의료 진단이 아닙니다.</span></footer>
    </main>
  )
}

function MoonIcon() { return <span className="moon-icon">☾</span> }

export default App