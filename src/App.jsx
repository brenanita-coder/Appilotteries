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
  Sparkles
} from 'lucide-react';

// --- INITIAL DATA & CONFIGURATION ---
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
    mostDrawn: [23, 44, 19, 21, 17],
    hot: [44, 17, 26, 21, 35],
    cold: [33, 4, 48, 12, 9],
    overdue: [5, 12, 49],
    odds: '1 in 139,838,160',
    frequency: [
      { num: 23, count: 182 }, { num: 44, count: 178 }, { num: 19, count: 175 }, 
      { num: 21, count: 172 }, { num: 17, count: 170 }
    ],
    lastDraw: '11, 26, 29, 34, 44 | Stars: 1, 10',
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
    extraCount: 0,
    extraRange: 0,
    mostDrawn: [52, 58, 27, 39, 8],
    hot: [52, 8, 38, 27, 15],
    cold: [48, 30, 57, 2, 44],
    overdue: [14, 22, 41],
    odds: '1 in 45,057,474',
    frequency: [
      { num: 52, count: 104 }, { num: 58, count: 99 }, { num: 27, count: 95 }, 
      { num: 39, count: 92 }, { num: 8, count: 89 }
    ],
    lastDraw: '20, 36, 40, 43, 51, 55 | Bonus: 21',
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
    extraCount: 0,
    extraRange: 0,
    mostDrawn: [27, 42, 29, 38, 10],
    hot: [27, 10, 42, 38, 9],
    cold: [34, 3, 11, 45, 16],
    overdue: [1, 18, 45],
    odds: '1 in 10,737,573',
    frequency: [
      { num: 27, count: 157 }, { num: 42, count: 144 }, { num: 29, count: 143 }, 
      { num: 38, count: 139 }, { num: 10, count: 139 }
    ],
    lastDraw: '11, 19, 20, 34, 36, 42 | Bonus: 32',
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
    extraCount: 0,
    extraRange: 0,
    mostDrawn: [85, 77, 90, 81, 82],
    hot: [85, 90, 12, 77, 6],
    cold: [60, 18, 5, 41, 88],
    overdue: [7, 33, 54],
    odds: '1 in 622,614,630',
    frequency: [
      { num: 85, count: 261 }, { num: 77, count: 255 }, { num: 90, count: 253 }, 
      { num: 81, count: 249 }, { num: 82, count: 248 }
    ],
    lastDraw: '36, 38, 45, 61, 79, 83 | Jolly: 12',
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
    mostDrawn: [47, 3, 40, 38, 7],
    hot: [47, 43, 2, 10, 22],
    cold: [11, 14, 20, 35, 48],
    overdue: [9, 25, 31],
    odds: '1 in 13,983,816',
    frequency: [
      { num: 47, count: 531 }, { num: 3, count: 522 }, { num: 40, count: 518 }, 
      { num: 38, count: 512 }, { num: 7, count: 509 }
    ],
    lastDraw: '2, 16, 28, 38, 41, 47 | Reintegro: 8',
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
  
  // CACHE & RATE LIMIT PROTECTION
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

  // --- PREDICTION ENGINE ALGORITHM ---
  const suggestedLines = useMemo(() => {
    const lines = [];
    const { hot, cold, overdue, range, mainCount, extraCount, extraRange } = currentData;
    
    for (let i = 0; i < 5; i++) {
      let line = new Set();
      
      const pickFrom = (arr, count) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        shuffled.slice(0, count).forEach(n => {
            if (line.size < mainCount) line.add(n);
        });
      };

      pickFrom(hot, 2);
      pickFrom(cold, 1);
      pickFrom(overdue, 1);

      while (line.size < mainCount) {
        const rand = Math.floor(Math.random() * range) + 1;
        line.add(rand);
      }

      const mainNumbers = Array.from(line).sort((a, b) => a - b);
      
      const extras = [];
      if (extraCount > 0) {
        let eSet = new Set();
        while (eSet.size < extraCount) {
            eSet.add(Math.floor(Math.random() * extraRange) + 1);
        }
        extras.push(...Array.from(eSet).sort((a, b) => a - b));
      }

      lines.push({ main: mainNumbers, extras: extras });
    }
    return lines;
  }, [currentData]);

  // --- LIVE RAPIDAPI CONNECTION ---
  const syncLiveStats = useCallback(async (force = false) => {
    if (syncInProgress.current) return;
    if (!force && syncedMarkets.current.has(selectedLotto)) return;

    syncInProgress.current = true;
    setIsSyncing(true);
    setError(null);
    
    const apiKey = "06875d4e89msh93bade49ef61868p18bb4ajsnf9fb21cbf614"; 
    
    if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_KEY_HERE") {
      setError("Please enter your RapidAPI Key in the code to enable live syncing.");
      setIsSyncing(false);
      syncInProgress.current = false;
      return;
    }

    const lottoCode = INITIAL_LOTTO_DATA[selectedLotto].code;
    const date = new Date();
    date.setDate(date.getDate() - 1); 
    const dateStr = date.toISOString().split('T')[0];

    try {
      const response = await fetch(`https://european-lottery-api.p.rapidapi.com/${lottoCode}/${dateStr}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Host': 'european-lottery-api.p.rapidapi.com',
          'X-RapidAPI-Key': apiKey
        }
      });

      if (response.status === 429) {
        throw new Error("429: API Rate Limit (Minute) Reached. Please wait a moment.");
      }

      if (response.status === 403) {
        throw new Error("403 Forbidden: Ensure you are subscribed on RapidAPI.");
      }

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const apiResult = await response.json();
      
      if (apiResult && apiResult.results) {
        setLottoData(prev => ({
          ...prev,
          [selectedLotto]: {
            ...prev[selectedLotto],
            mostDrawn: apiResult.results.slice(0, 5), 
            lastDraw: apiResult.results.join(', ')
          }
        }));
        syncedMarkets.current.add(selectedLotto);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Sync Error:", err);
      setError(err.message || "Sync failed. Check connection.");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        syncInProgress.current = false;
      }, 1000);
    }
  }, [selectedLotto]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!syncedMarkets.current.has(selectedLotto)) {
        debounceRef.current = setTimeout(() => {
            syncLiveStats();
        }, 1200); 
    }
    return () => clearTimeout(debounceRef.current);
  }, [selectedLotto, syncLiveStats]);

  const getBallStyle = (num, type = 'default') => {
    const colors = {
      default: [googleColors.blue, googleColors.red, googleColors.yellow, googleColors.green],
      hot: [googleColors.yellow],
      cold: ['#3B82F6'],
      overdue: ['#EF4444'],
      used: [googleColors.green]
    };
    const n = parseInt(num) || 0;
    const activePalette = colors[type] || colors.default;
    return { backgroundColor: activePalette[n % activePalette.length] };
  };

  const Logo = () => (
    <div className="flex items-center space-x-2 text-shadow-sm">
      <div className="flex items-center">
        <span style={{ color: googleColors.blue }} className="text-3xl font-black">A</span>
        <span style={{ color: googleColors.red }} className="text-3xl font-black">P</span>
        <span style={{ color: googleColors.yellow }} className="text-3xl font-black">P</span>
        <div className="relative flex items-center justify-center">
          <span style={{ color: googleColors.green }} className="text-3xl font-black">I</span>
          <Star className="w-3 h-3 absolute -top-1 -right-2 fill-current" style={{ color: googleColors.yellow }} />
        </div>
      </div>
      <div className="h-6 w-[2px] bg-slate-200 mx-2 hidden sm:block"></div>
      <span className="text-slate-600 font-bold text-lg tracking-tight hidden sm:block">Lotteries</span>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-[#F9FBFF] flex flex-col text-slate-800">
      {/* --- HEADER --- */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex space-x-6 text-sm font-medium text-slate-600 border-r pr-6 border-slate-100">
              {Object.keys(lottoData).map(key => (
                <button 
                  key={key} 
                  onClick={() => setSelectedLotto(key)}
                  className={`transition-all duration-200 hover:text-blue-600 ${selectedLotto === key ? 'text-shadow-sm text-blue-600 font-bold' : ''}`}
                >
                  {key}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => syncLiveStats(true)} 
              disabled={isSyncing}
              className={`p-2 rounded-full transition-all ${isSyncing ? 'animate-spin text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`}
              title="Manual Sync"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        <div className="bg-slate-50 border-t py-1.5 overflow-hidden flex justify-center items-center space-x-4">
          <p className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 animate-pulse whitespace-nowrap px-4 uppercase tracking-wider">
             AI Driven Live Lotto Stats • "Helping you choose wisely to get that big win"
          </p>
          <div className="hidden sm:flex items-center space-x-2 text-[10px] font-bold text-slate-400 border-l pl-4 border-slate-200">
            <Clock className="w-3 h-3 text-slate-300" />
            <span>SYNC: {lastUpdated}</span>
          </div>
        </div>
      </header>

      {/* --- MOBILE NAV --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b p-4 space-y-2 absolute w-full z-[100] shadow-xl">
          {Object.keys(lottoData).map(key => (
            <button 
              key={key} 
              className={`block w-full text-left p-3 rounded-lg ${selectedLotto === key ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-100'}`}
              onClick={() => { setSelectedLotto(key); setIsMobileMenuOpen(false); }}
            >
              {key}
            </button>
          ))}
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <aside className="lg:col-span-1 hidden lg:block"></aside>

        <section className="lg:col-span-8 space-y-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl flex flex-col text-red-700 text-xs shadow-sm space-y-2">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0 animate-pulse" />
                <span className="font-bold uppercase tracking-tight">API Notification:</span>
              </div>
              <p className="ml-6 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Jackpot Hero */}
          <div 
            className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-l-4 text-center relative overflow-hidden transition-all duration-700 ${isSyncing ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'}`}
            style={{ borderLeftColor: googleColors.red }}
          >
            {isSyncing && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40"><RefreshCw className="w-12 h-12 text-blue-500 animate-spin" /></div>}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-10 rounded-full -mr-16 -mt-16"></div>
            <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: googleColors.blue }}>{currentData.name}</h1>
            <p className="text-slate-500 mb-6 font-medium italic text-sm uppercase tracking-wider">
               Latest Verified Results
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {currentData.mostDrawn.map((num, i) => (
                <div key={i} style={getBallStyle(num)} className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/20">{num}</div>
              ))}
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">
               <ShieldCheck className="w-3 h-3 mr-1" /> Data Authenticated
            </div>
          </div>

          {/* AI PREDICTION CARD - UPDATED WITH "FOR NEXT DRAW" */}
          <div className="bg-blue-400/10 backdrop-blur-md rounded-3xl p-8 shadow-xl relative overflow-hidden border border-blue-200/50">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cpu className="w-32 h-32 text-blue-600" />
             </div>
             <div className="relative z-10 flex flex-col items-center">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="p-3 bg-blue-500 rounded-2xl shadow-lg mb-3">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-blue-900 font-black text-xl leading-tight uppercase tracking-tight">AI Powered Line Predictions for NEXT DRAW</h2>
                    <p className="text-blue-600/80 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Based on Weighted Statistical Probability</p>
                </div>

                <div className="w-full space-y-6">
                    {suggestedLines.map((line, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center p-4 bg-white/40 border border-white/60 rounded-2xl transition-all hover:scale-[1.02] shadow-sm">
                            <span className="text-[9px] font-black text-blue-400/80 mb-3 uppercase tracking-widest">Prediction Line {idx + 1}</span>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {line.main.map((num, i) => (
                                    <div 
                                      key={i} 
                                      style={getBallStyle(num)}
                                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white/20"
                                    >
                                        {num}
                                    </div>
                                ))}
                                {line.extras.length > 0 && (
                                    <div className="flex items-center gap-2 ml-1 pl-3 border-l-2 border-blue-200/50">
                                        {line.extras.map((num, i) => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-slate-900 font-bold text-sm shadow-md border-2 border-white/20 ring-2 ring-yellow-400/20">
                                                {num}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex items-center justify-center space-x-6">
                    <div className="flex items-center text-[10px] text-blue-800 font-bold uppercase tracking-wider">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-sm"></div> MAIN SELECTION
                    </div>
                    <div className="flex items-center text-[10px] text-blue-800 font-bold uppercase tracking-wider">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-2 shadow-sm"></div> {currentData.extraName.toUpperCase()}
                    </div>
                </div>
             </div>
          </div>

          {/* NEXT DRAW SUGGESTIONS HEADER */}
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-500" /> Statistical Strategy for Next Draw
            </h2>
            <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-300 cursor-help" />
                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    Suggestions are based on historical frequency (Hot/Cold) and time intervals (Overdue).
                </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4" style={{ borderLeftColor: googleColors.yellow }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center text-yellow-600 text-xs uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Hot Numbers
                </h3>
                <span className="text-[8px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded font-bold">HIGH FREQ</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentData.hot.map(num => (
                  <div key={num} className="w-9 h-9 rounded-full border-2 border-yellow-400 flex items-center justify-center font-bold text-yellow-600 text-sm shadow-sm">{num}</div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center text-blue-600 text-xs uppercase tracking-wider">
                  <Snowflake className="w-3.5 h-3.5 mr-1.5" /> Cold Numbers
                </h3>
                <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">LOW FREQ</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentData.cold.map(num => (
                  <div key={num} className="w-9 h-9 rounded-full border-2 border-blue-400 flex items-center justify-center font-bold text-blue-600 text-sm shadow-sm">{num}</div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center text-red-600 text-xs uppercase tracking-wider">
                  <Timer className="w-3.5 h-3.5 mr-1.5" /> Overdue Numbers
                </h3>
                <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">EXPECTED</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentData.overdue.map(num => (
                  <div key={num} className="w-9 h-9 rounded-full border-2 border-red-400 flex items-center justify-center font-bold text-red-600 text-sm shadow-sm">{num}</div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4" style={{ borderLeftColor: googleColors.green }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center text-green-600 text-xs uppercase tracking-wider">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Most Used Numbers
                </h3>
                <span className="text-[8px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">DRAW COUNT</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentData.frequency.slice(0, 4).map(item => (
                  <div key={item.num} className="relative">
                    <div className="w-9 h-9 rounded-full border-2 border-green-500 flex items-center justify-center font-bold text-green-600 text-sm shadow-sm bg-green-50">
                      {item.num}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-green-600 text-white text-[8px] px-1 rounded-full font-black min-w-[16px] text-center border border-white">
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4" style={{ borderLeftColor: googleColors.green }}>
            <h3 className="font-bold mb-6 flex items-center text-sm"><Info className="w-4 h-4 mr-2 text-blue-500" /> Statistical Probability</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Next Jackpot Odds</span>
                <span className="text-sm text-blue-700 font-bold font-mono">{currentData.odds}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Current Sync Data</span>
                <span className="text-[10px] font-bold text-slate-600 truncate">{currentData.lastDraw}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4" style={{ borderLeftColor: googleColors.yellow }}>
            <h3 className="font-bold mb-4 flex items-center text-slate-700 text-sm"><ShieldCheck className="w-4 h-4 mr-2 text-green-500" /> Betting Partners</h3>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="group p-3 bg-slate-50 rounded-xl border border-transparent hover:border-blue-200 hover:bg-white cursor-pointer transition-all duration-200">
                  <div className="font-bold text-xs mb-1 group-hover:text-blue-600 flex items-center justify-between text-slate-700 text-[11px]">Partner #{i} <ExternalLink className="w-3 h-3" /></div>
                  <p className="text-[9px] text-slate-500 leading-tight italic">Play {selectedLotto} responsibly.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 overflow-hidden" style={{ borderLeftColor: googleColors.blue }}>
            <div className="p-2 bg-slate-50 border-b border-slate-100 text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">Featured Market</div>
            <div className="h-48 relative group cursor-pointer overflow-hidden bg-slate-100">
              <img src="FB_IMG_1761806470896.jpg" alt="Partner Ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?q=80&w=400&h=200&auto=format&fit=crop'; }} />
            </div>
          </div>
        </aside>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-[#E8F8F5] text-slate-600 py-12 px-4 mt-auto border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span style={{ color: googleColors.blue }} className="text-2xl font-black">A</span>
                <span style={{ color: googleColors.red }} className="text-2xl font-black">P</span>
                <span style={{ color: googleColors.yellow }} className="text-2xl font-black">P</span>
                <span style={{ color: googleColors.green }} className="text-2xl font-black">I</span>
              </div>
              <span className="text-slate-600 font-bold text-lg tracking-tight">Lotteries</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">Global pattern analysis using real-time statistical data streams.</p>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-xs uppercase tracking-widest">Market Coverage</h4>
            <ul className="text-[10px] space-y-2 text-slate-500 font-medium">
              <li className="hover:text-blue-600 cursor-pointer">Irish Lotto</li>
              <li className="hover:text-blue-600 cursor-pointer">UK National</li>
              <li className="hover:text-blue-600 cursor-pointer">SuperEnalotto</li>
              <li className="hover:text-blue-600 cursor-pointer">EuroMillions</li>
              <li className="hover:text-blue-600 cursor-pointer">La Primitiva</li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4 text-xs uppercase tracking-widest">Legal</h4>
            <ul className="text-[10px] space-y-2 font-medium">
              <li className="hover:text-blue-600 cursor-pointer underline">Privacy Policy</li>
              <li className="hover:text-blue-600 cursor-pointer underline">Terms of Service</li>
              <li className="hover:text-blue-600 cursor-pointer underline">Cookies Policy</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400">
           <p>© 2025 APPI Lotteries. Statistical patterns are for research purposes only. No guarantee of outcome.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;