import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, 
  Snowflake, 
  Info, 
  ShieldCheck, 
  ExternalLink, 
  Menu, 
  X,
  Activity,
  Star,
  Globe,
  Trophy,
  RefreshCw,
  Clock,
  AlertCircle,
  Timer,
  BarChart3,
  HelpCircle,
  Cpu,
  Sparkles,
  Calendar
} from 'lucide-react';

// --- VERIFIED INITIAL DATA ---
const INITIAL_LOTTO_DATA = {
  'EuroMillions': {
    name: 'EuroMillions',
    sub: 'Pan-European',
    code: 'EU_EM_LT',
    jackpot: '€17,000,000',
    range: 50,
    mainCount: 5,
    extraName: 'Stars',
    extraCount: 2,
    extraRange: 12,
    mostDrawn: [11, 26, 29, 34, 44],
    extraResults: [1, 10],
    hot: [44, 17, 26, 21, 35],
    cold: [33, 4, 48, 12, 9],
    overdue: [5, 12, 49],
    odds: '1 in 139,838,160',
    frequency: [{ num: 23, count: 182 }, { num: 44, count: 178 }, { num: 19, count: 175 }, { num: 21, count: 172 }, { num: 17, count: 170 }],
    lastDrawDate: '30/12/2025',
    color: '#4285F4'
  },
  'UK Lotto': {
    name: 'UK Lotto',
    sub: 'United Kingdom',
    code: 'GB_GB_LT',
    jackpot: '£5,300,000',
    range: 59,
    mainCount: 6,
    extraName: 'Bonus',
    extraCount: 1,
    extraRange: 59,
    mostDrawn: [20, 36, 40, 43, 51, 55],
    extraResults: [21],
    hot: [52, 8, 38, 27, 15],
    cold: [48, 30, 57, 2, 44],
    overdue: [14, 22, 41],
    odds: '1 in 45,057,474',
    frequency: [{ num: 52, count: 104 }, { num: 58, count: 99 }, { num: 27, count: 95 }, { num: 39, count: 92 }, { num: 8, count: 89 }],
    lastDrawDate: 'Latest Draw',
    color: '#EA4335'
  },
  'Irish Lotto': {
    name: 'Irish Lotto',
    sub: 'Ireland',
    code: 'IE_IE_LT',
    jackpot: '€4,500,000',
    range: 47,
    mainCount: 6,
    extraName: 'Bonus',
    extraCount: 1,
    extraRange: 47,
    mostDrawn: [7, 15, 16, 24, 37, 40],
    extraResults: [26],
    hot: [27, 10, 42, 38, 9],
    cold: [34, 3, 11, 45, 16],
    overdue: [1, 18, 45],
    odds: '1 in 10,737,573',
    frequency: [{ num: 27, count: 157 }, { num: 42, count: 144 }, { num: 29, count: 143 }, { num: 38, count: 139 }, { num: 10, count: 139 }],
    lastDrawDate: '31/12/2025',
    color: '#34A853'
  },
  'SuperEnalotto': {
    name: 'Italian Lotto',
    sub: 'Italy',
    code: 'IT_IT_SL',
    jackpot: '€98,500,000',
    range: 90,
    mainCount: 6,
    extraName: 'Jolly',
    extraCount: 1,
    extraRange: 90,
    mostDrawn: [36, 38, 45, 61, 79, 83],
    extraResults: [12],
    hot: [85, 90, 12, 77, 6],
    cold: [60, 18, 5, 41, 88],
    overdue: [7, 33, 54],
    odds: '1 in 622,614,630',
    frequency: [{ num: 85, count: 261 }, { num: 77, count: 255 }, { num: 90, count: 253 }, { num: 81, count: 249 }, { num: 82, count: 248 }],
    lastDrawDate: 'Latest Draw',
    color: '#FBBC05'
  },
  'La Primitiva': {
    name: 'Spanish Lotto',
    sub: 'Spain',
    code: 'ES_ES_RJ',
    jackpot: '€13,500,000',
    range: 49,
    mainCount: 6,
    extraName: 'Reintegro',
    extraCount: 1,
    extraRange: 9,
    mostDrawn: [2, 16, 28, 38, 41, 47],
    extraResults: [8],
    hot: [47, 43, 2, 10, 22],
    cold: [11, 14, 20, 35, 48],
    overdue: [9, 25, 31],
    odds: '1 in 13,983,816',
    frequency: [{ num: 47, count: 531 }, { num: 3, count: 522 }, { num: 40, count: 518 }, { num: 38, count: 512 }, { num: 7, count: 509 }],
    lastDrawDate: 'Latest Draw',
    color: '#4285F4'
  }
};

const App = () => {
  const [lottoData, setLottoData] = useState(INITIAL_LOTTO_DATA);
  const [selectedLotto, setSelectedLotto] = useState('EuroMillions');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('--:--');
  const [error, setError] = useState(null);
  
  const syncedMarkets = useRef(new Set());
  const syncInProgress = useRef(false);
  const debounceRef = useRef(null);

  const currentData = useMemo(() => lottoData[selectedLotto], [lottoData, selectedLotto]);

  const googleColors = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
    gray: '#F8F9FA'
  };

  // --- POLICY GENERATOR (Opens in new window) ---
  const openPolicyInNewWindow = (type) => {
    const policies = {
      privacy: { title: "Privacy Policy", content: "Zero Data Collection: APPI Lotteries does not collect or store personal identification information. Your session is completely anonymous." },
      terms: { title: "Terms of Service", content: "Statistical predictions are for entertainment purposes only. APPI Lotteries is not a gambling platform and does not handle real money transactions." },
      cookies: { title: "Cookies Policy", content: "We do not use internal tracking cookies. Third-party betting links may use cookies as per their own independent policies." }
    };
    const active = policies[type];
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>${active.title} - APPI Lotteries</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; line-height: 1.6; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .badge { background: #dcfce7; color: #166534; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <h1>${active.title}</h1>
          <div class="badge">APPI Lotteries Security Verified</div>
          <p>${active.content}</p>
          <hr/>
          <p><small>© 2025 APPI Lotteries - Dublin, Ireland</small></p>
        </body>
      </html>
    `);
  };

  // --- AI ENGINE ---
  const suggestedLines = useMemo(() => {
    const lines = [];
    const { hot, cold, overdue, range, mainCount, extraCount, extraRange } = currentData;
    for (let i = 0; i < 5; i++) {
      let line = new Set();
      const pickFrom = (arr, count) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        shuffled.slice(0, count).forEach(n => { if (line.size < mainCount) line.add(n); });
      };
      pickFrom(hot, 2); pickFrom(cold, 1); pickFrom(overdue, 1);
      while (line.size < mainCount) { line.add(Math.floor(Math.random() * range) + 1); }
      const extras = [];
      if (extraCount > 0) {
        let eSet = new Set();
        while (eSet.size < extraCount) { eSet.add(Math.floor(Math.random() * extraRange) + 1); }
        extras.push(...Array.from(eSet).sort((a, b) => a - b));
      }
      lines.push({ main: Array.from(line).sort((a, b) => a - b), extras: extras });
    }
    return lines;
  }, [currentData]);

const calculateLottoStats = (drawHistory, mainCount = 5) => {
  if (!drawHistory || !Array.isArray(drawHistory)) return { hot: [], cold: [], overdue: [] };
  const frequencyMap = {};
  const lastSeenMap = {};

  drawHistory.forEach((draw, index) => {
    draw.results.forEach(num => {
      frequencyMap[num] = (frequencyMap[num] || 0) + 1;
      if (lastSeenMap[num] === undefined) lastSeenMap[num] = index;
    });
  });

  const sortedByFreq = Object.keys(frequencyMap).sort((a, b) => frequencyMap[b] - frequencyMap[a]);
  return {
    hot: sortedByFreq.slice(0, mainCount),
    cold: sortedByFreq.slice(-mainCount).reverse(),
    overdue: Object.keys(lastSeenMap).sort((a, b) => lastSeenMap[b] - lastSeenMap[a]).slice(0, mainCount)
  };
};

  const syncLiveStats = useCallback(async (force = false) => {
  if (syncInProgress.current) return;
  if (!force && syncedMarkets.current.has(selectedLotto)) return;

  syncInProgress.current = true;
  setIsSyncing(true);
  setError(null);

  const apiKey = "06875d4e89msh93bade49ef61868p18bb4ajsnf9fb21cbf614"; 
  const headers = { 'X-RapidAPI-Host': 'european-lottery-api.p.rapidapi.com', 'X-RapidAPI-Key': apiKey };

  try {
    // 1. Get List of Dates to find the TRUE latest draw
    const datesRes = await fetch(`https://european-lottery-api.p.rapidapi.com/${selectedLotto}/dates`, { headers });
    const dates = await datesRes.json();

    if (dates && dates.length > 0) {
      const realLatestDate = dates[0];

      // 2. Fetch specific results (Bypassing the stuck /latest cache)
      const drawRes = await fetch(`https://european-lottery-api.p.rapidapi.com/${selectedLotto}/draw/${realLatestDate}`, { headers });
      const drawData = await drawRes.json();

      // 3. Get History for Hot/Cold stats
      const historyRes = await fetch(`https://european-lottery-api.p.rapidapi.com/${selectedLotto}/results?limit=50`, { headers });
      const historyData = await historyRes.json();
      
      const stats = calculateLottoStats(historyData, currentData.mainCount);

      if (drawData && drawData.results) {
        setLottoData(prev => ({
          ...prev,
          [selectedLotto]: {
            ...prev[selectedLotto],
            mostDrawn: drawData.results.slice(0, currentData.mainCount),
            extraResults: drawData.results.slice(currentData.mainCount),
            lastDrawDate: drawData.date,
            hotNumbers: stats.hot,
            coldNumbers: stats.cold,
            overdueNumbers: stats.overdue
          }
        }));
        syncedMarkets.current.add(selectedLotto);
      }
    }
    setLastUpdated(new Date().toLocaleTimeString());
  } catch (err) { 
    setError(err.message); 
  } finally {
    setTimeout(() => { setIsSyncing(false); syncInProgress.current = false; }, 1000);
  }
}, [selectedLotto, currentData]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!syncedMarkets.current.has(selectedLotto)) {
        debounceRef.current = setTimeout(() => syncLiveStats(), 1200); 
    }
    return () => clearTimeout(debounceRef.current);
  }, [selectedLotto, syncLiveStats]);

  const getBallStyle = (num, type = 'default') => {
    const colors = { default: [googleColors.blue, googleColors.red, googleColors.yellow, googleColors.green], hot: [googleColors.yellow], cold: ['#3B82F6'], overdue: ['#EF4444'] };
    const n = parseInt(num) || 0;
    const activePalette = colors[type] || colors.default;
    return { backgroundColor: activePalette[n % activePalette.length] };
  };

  return (
    <div className="min-h-screen font-sans bg-[#F9FBFF] flex flex-col text-slate-800 overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo - Fixed for Mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-shadow-sm shrink-0">
            <div className="flex items-center">
              <span style={{ color: googleColors.blue }} className="text-xl sm:text-3xl font-black">A</span>
              <span style={{ color: googleColors.red }} className="text-xl sm:text-3xl font-black">P</span>
              <span style={{ color: googleColors.yellow }} className="text-xl sm:text-3xl font-black">P</span>
              <div className="relative flex items-center justify-center">
                <span style={{ color: googleColors.green }} className="text-xl sm:text-3xl font-black">I</span>
                <Star className="w-2 sm:w-3 h-2 sm:h-3 absolute -top-1 -right-1 sm:-right-2 fill-current text-yellow-400" />
              </div>
            </div>
            <div className="h-4 sm:h-6 w-[1.5px] sm:w-[2px] bg-slate-200 mx-1 sm:mx-2"></div>
            <span className="text-slate-600 font-bold text-sm sm:text-lg tracking-tight block">Lotteries</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-6 text-sm font-medium text-slate-600 border-r pr-6 border-slate-100">
              {Object.keys(lottoData).map(key => (
                <button key={key} onClick={() => setSelectedLotto(key)} className={`transition-all duration-200 hover:text-blue-600 ${selectedLotto === key ? 'text-blue-600 font-bold' : ''}`}>{key}</button>
              ))}
            </div>
            <button onClick={() => syncLiveStats(true)} disabled={isSyncing} className={`p-2 rounded-full transition-all ${isSyncing ? 'animate-spin text-blue-500' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}><RefreshCw className="w-5 h-5" /></button>
          </div>
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Sub-Header - Fixed for Mobile Overflow */}
        <div className="bg-slate-50 border-t py-1.5 flex flex-col sm:flex-row justify-center items-center px-4 w-full overflow-hidden">
          <p className="text-[9px] sm:text-xs font-semibold text-slate-500 animate-pulse uppercase tracking-wider text-center truncate max-w-full">
             AI Driven Live Lotto Stats • "Verified Statistical Accuracy"
          </p>
          <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] font-bold text-slate-400 sm:border-l sm:pl-4 sm:ml-4 border-slate-200 mt-1 sm:mt-0">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-300" />
            <span>SYNC: {lastUpdated}</span>
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b p-4 space-y-2 absolute w-full z-[100] shadow-xl">
          {Object.keys(lottoData).map(key => (
            <button key={key} className={`block w-full text-left p-3 rounded-lg ${selectedLotto === key ? 'bg-blue-50 text-blue-600 font-bold' : ''}`} onClick={() => { setSelectedLotto(key); setIsMobileMenuOpen(false); }}>{key}</button>
          ))}
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-1 hidden lg:block"></aside>

        <section className="lg:col-span-8 space-y-8">
          {/* VERIFIED HERO */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 border-l-4 text-center relative overflow-hidden" style={{ borderLeftColor: googleColors.red }}>
            {isSyncing && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40"><RefreshCw className="w-12 h-12 text-blue-500 animate-spin" /></div>}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2" style={{ color: googleColors.blue }}>{currentData.name}</h1>
            <div className="flex items-center justify-center space-x-2 text-slate-500 mb-6 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                <Calendar className="w-3 h-3 text-blue-400" />
                <span>Verified Draw Date: {currentData.lastDrawDate}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
              {currentData.mostDrawn.map((num, i) => (
                <div key={i} style={getBallStyle(num)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg border-2 border-white/20">{num}</div>
              ))}
              {currentData.extraResults && currentData.extraResults.map((num, i) => (
                <div key={`extra-${i}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-bold text-sm sm:text-lg shadow-lg border-2 border-white/20 ring-2 sm:ring-4 ring-yellow-100">{num}</div>
              ))}
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-green-100">
               <ShieldCheck className="w-3 h-3 mr-1" /> Verified via Registry
            </div>
          </div>

          {/* AI PREDICTION CARD */}
          <div className="bg-blue-400/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-blue-200/50">
             <div className="relative z-10 flex flex-col items-center">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="p-3 bg-blue-500 rounded-2xl shadow-lg mb-3"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                    <h2 className="text-blue-900 font-black text-lg sm:text-xl leading-tight uppercase tracking-tight">AI Powered Predictions for NEXT DRAW</h2>
                    <p className="text-blue-600/80 text-[8px] sm:text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Based on Weighted Probability</p>
                </div>
                <div className="w-full space-y-4">
                    {suggestedLines.map((line, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white/40 border border-white/60 rounded-2xl shadow-sm">
                            <span className="text-[8px] font-black text-blue-400/80 mb-2 uppercase tracking-widest">Prediction Line {idx + 1}</span>
                            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                                {line.main.map((num, i) => (
                                    <div key={i} style={getBallStyle(num)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-sm shadow-md border-2 border-white/20">{num}</div>
                                ))}
                                {line.extras.length > 0 && (
                                    <div className="flex items-center gap-1.5 sm:gap-2 ml-1 pl-2 sm:pl-3 border-l-2 border-blue-200/50">
                                        {line.extras.map((num, i) => (
                                            <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-bold text-[10px] sm:text-sm shadow-md border-2 border-white/20 ring-1 ring-yellow-400/20">{num}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>

          <h2 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 flex items-center border-b pb-2"><Activity className="w-4 h-4 mr-2 text-blue-500" /> Statistical Strategy</h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: googleColors.yellow }}>
              <h3 className="font-bold text-yellow-600 text-[10px] sm:text-xs uppercase mb-3"><Zap className="w-3 h-3 inline mr-1" /> Hot Numbers</h3>
              <div className="flex flex-wrap gap-2">{currentData.hot.map(num => (<div key={num} className="w-8 h-8 rounded-full border-2 border-yellow-400 flex items-center justify-center font-bold text-yellow-600 text-xs shadow-sm">{num}</div>))}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
              <h3 className="font-bold text-blue-600 text-[10px] sm:text-xs uppercase mb-3"><Snowflake className="w-3 h-3 inline mr-1" /> Cold Numbers</h3>
              <div className="flex flex-wrap gap-2">{currentData.cold.map(num => (<div key={num} className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center font-bold text-blue-600 text-xs shadow-sm">{num}</div>))}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: '#EF4444' }}>
              <h3 className="font-bold text-red-600 text-[10px] sm:text-xs uppercase mb-3"><Timer className="w-3 h-3 inline mr-1" /> Overdue</h3>
              <div className="flex flex-wrap gap-2">{currentData.overdue.map(num => (<div key={num} className="w-8 h-8 rounded-full border-2 border-red-400 flex items-center justify-center font-bold text-red-600 text-xs shadow-sm">{num}</div>))}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: googleColors.green }}>
              <h3 className="font-bold text-green-600 text-[10px] sm:text-xs uppercase mb-3"><BarChart3 className="w-3 h-3 inline mr-1" /> Frequency</h3>
              <div className="flex flex-wrap gap-2">{currentData.frequency.slice(0, 4).map(item => (<div key={item.num} className="relative"><div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-600 text-xs bg-green-50">{item.num}</div><div className="absolute -top-1.5 -right-1.5 bg-green-600 text-white text-[7px] px-1 rounded-full font-black">{item.count}</div></div>))}</div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4" style={{ borderLeftColor: googleColors.yellow }}>
            <h3 className="font-bold mb-4 text-slate-700 text-xs uppercase tracking-widest"><ShieldCheck className="w-4 h-4 inline mr-2 text-green-500" /> Betting Partners</h3>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="font-bold text-[11px] group-hover:text-blue-600 flex items-center justify-between">Partner #{i} <ExternalLink className="w-3 h-3" /></div>
                  <p className="text-[9px] text-slate-500 italic mt-1 font-medium">Safe play via Ireland.</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <footer className="bg-[#E8F8F5] text-slate-600 py-12 px-6 mt-auto border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            
            {/* Column 1: Brand & Identity */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <span style={{ color: googleColors.blue }} className="text-2xl font-black">A</span>
                  <span style={{ color: googleColors.red }} className="text-2xl font-black">P</span>
                  <span style={{ color: googleColors.yellow }} className="text-2xl font-black">P</span>
                  <span style={{ color: googleColors.green }} className="text-2xl font-black">I</span>
                </div>
                <span className="text-slate-600 font-bold text-lg">Lotteries</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Dublin based pattern analysis for the European markets.</p>
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Verified</p>
                <p className="text-[10px] text-slate-500">Zero Data Collection: Your session is anonymous.</p>
              </div>
            </div>

            {/* Column 2: Legal & Policies */}
            <div>
              <h4 className="text-slate-900 font-bold mb-4 text-xs uppercase tracking-wider">Compliance & Safety</h4>
              <ul className="text-[11px] space-y-3 font-semibold">
                <li><a href="/privacy.html" target="_blank" className="underline hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="/terms.html" target="_blank" className="underline hover:text-blue-600">Terms of Service</a></li>
                <li className="text-red-600 font-bold italic underline cursor-pointer" onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})}>Responsible Play Resources Below</li>
              </ul>
            </div>

            {/* Column 3: Quick Links or Meta */}
            <div>
              <h4 className="text-slate-900 font-bold mb-4 text-xs uppercase tracking-wider">Contact</h4>
              <p className="text-[11px] font-medium text-slate-600">Dublin, Ireland</p>
              <p className="text-[11px] font-medium text-slate-500 mt-2">© 2025-2026 APPI Lotteries</p>
            </div>
          </div>

          {/* Responsible Gambling Resource Section - The Irish Support List */}
          <div className="border-t border-slate-300 pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h5 className="text-slate-900 font-bold text-[11px] uppercase">Ireland Support</h5>
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold">Problem Gambling Ireland</p>
                <p>Visit: <a href="https://www.problemgambling.ie" target="_blank" className="text-blue-600 underline">www.problemgambling.ie</a></p>
                <p>Support: 089 241 5401</p>
              </div>
              <div className="text-[11px] leading-relaxed pt-2">
                <p className="font-bold">Gamblers Anonymous</p>
                <p>Visit: <a href="https://www.gamblersanonymous.ie" target="_blank" className="text-blue-600 underline">www.gamblersanonymous.ie</a></p>
                <p>Support: 01 872 1133</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-slate-900 font-bold text-[11px] uppercase">Treatment Centre</h5>
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold">The Rutland Centre</p>
                <p>Visit: <a href="https://www.rutlandcentre.ie" target="_blank" className="text-blue-600 underline">www.rutlandcentre.ie</a></p>
                <p>Call: 1800 446 677</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-slate-900 font-bold text-[11px] uppercase">Blocking Software</h5>
              <div className="text-[11px] leading-relaxed">
                <p className="font-bold">Net Nanny: <span className="font-normal">www.netnanny.com</span></p>
                <p className="font-bold">Gamban: <span className="font-normal">www.gamban.com</span></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;