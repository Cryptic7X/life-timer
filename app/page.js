"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, Target, Brain, Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, Circle, Hexagon, History, X } from 'lucide-react';

const QUOTES = [
  "The consistent and persistent man of average intelligence is more likely to succeed than an erratic and lazy genius.",
  "You may delay, but time will not.",
  "Dost thou love life? Then do not squander time, for that is the stuff life is made of.",
  "The two most powerful warriors are patience and time.",
  "We are always getting ready to live but never living.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work."
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentQuote, setCurrentQuote] = useState('');
  
  // --- ADVANCED SETTINGS STATE ---
  const [settings, setSettings] = useState({
    name: '',
    birthdate: '',
    lifeExpectancy: 73.4,
    timezone: 5.5,
    focusTime: 25,
    restTime: 5
  });
  
  // Controls whether we show the read-only Profile or the Input Form
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  
  const [timerData, setTimerData] = useState({
    timeString: '00:000:00:00:00', livedPercent: 0, currentAge: 0, daysLeft: 0, hoursLeft: 0
  });

  // --- TASKS STATE (Urgent / Important / History) ---
  const [tasks, setTasks] = useState([]);
  const [newUrgentTask, setNewUrgentTask] = useState('');
  const [newImportantTask, setNewImportantTask] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [queueTab, setQueueTab] = useState('urgent');

  const [dwTimeLeft, setDwTimeLeft] = useState(25 * 60); 
  const [dwIsActive, setDwIsActive] = useState(false);
  const [dwMode, setDwMode] = useState('work'); 

  useEffect(() => {
    setIsMounted(true);
    setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    const savedName = localStorage.getItem('lifeTimer_name');
    const savedBD = localStorage.getItem('lifeTimer_birthdate');
    const savedLE = localStorage.getItem('lifeTimer_lifeExpectancy');
    const savedTZ = localStorage.getItem('lifeTimer_timezone');
    const savedFT = localStorage.getItem('lifeTimer_focusTime');
    const savedRT = localStorage.getItem('lifeTimer_restTime');
    
    if (savedBD && savedLE) {
      const parsedFT = savedFT ? parseInt(savedFT) : 25;
      setSettings({
        name: savedName || '',
        birthdate: savedBD,
        lifeExpectancy: parseFloat(savedLE),
        timezone: parseFloat(savedTZ) || 5.5,
        focusTime: parsedFT,
        restTime: savedRT ? parseInt(savedRT) : 5
      });
      setDwTimeLeft(parsedFT * 60);
      setIsEditingSettings(false); // Valid user, default to read-only profile
      setActiveTab('overview');
    } else {
      setIsEditingSettings(true); // New user, force edit mode
      setActiveTab('settings');
    }

    const savedTasks = JSON.parse(localStorage.getItem('lifeTimer_tasks') || '[]');
    setTasks(savedTasks);
  }, []);

  useEffect(() => {
    if (!settings.birthdate || activeTab === 'settings') return;
    const interval = setInterval(() => {
      const now = new Date();
      const tzOffsetHours = settings.timezone;
      const [year, month, day] = settings.birthdate.split('-');
      const midnightUTC = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
      const birthDate = new Date(midnightUTC - (tzOffsetHours * 3600000));
      const totalDaysInLife = Math.round(settings.lifeExpectancy * 365.25);
      const endOfLife = new Date(birthDate.getTime() + (totalDaysInLife * 24 * 3600000));
      const remaining = endOfLife - now;
      const lived = now - birthDate;

      if (remaining > 0) {
        const daysRemaining = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remaining / 1000 / 60) % 60);
        const seconds = Math.floor((remaining / 1000) % 60);
        const years = Math.floor(daysRemaining / 365);
        const days = daysRemaining % 365;

        setTimerData({
          timeString: `${String(years).padStart(2, '0')}:${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
          livedPercent: ((lived / (endOfLife - birthDate)) * 100).toFixed(4),
          currentAge: Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000)),
          daysLeft: daysRemaining,
          hoursLeft: (daysRemaining * 24) + hours
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [settings, activeTab]);

  useEffect(() => {
    let interval = null;
    if (dwIsActive && dwTimeLeft > 0) {
      interval = setInterval(() => setDwTimeLeft(time => time - 1), 1000);
    } else if (dwTimeLeft === 0) {
      setDwIsActive(false);
      if (dwMode === 'work') {
        setDwMode('break');
        setDwTimeLeft(settings.restTime * 60);
      } else {
        setDwMode('work');
        setDwTimeLeft(settings.focusTime * 60);
      }
    }
    return () => clearInterval(interval);
  }, [dwIsActive, dwTimeLeft, dwMode, settings]);

  const toggleDwTimer = () => setDwIsActive(!dwIsActive);
  const resetDwTimer = () => {
    setDwIsActive(false);
    setDwTimeLeft(dwMode === 'work' ? settings.focusTime * 60 : settings.restTime * 60);
  };
  const switchDwMode = (mode) => {
    setDwIsActive(false);
    setDwMode(mode);
    setDwTimeLeft(mode === 'work' ? settings.focusTime * 60 : settings.restTime * 60);
  };
  const formatDwTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const saveSettings = () => {
    if (!settings.name.trim()) return alert('Please enter your designation/name.');
    if (!settings.birthdate) return alert('Please select your birthdate.');
    
    localStorage.setItem('lifeTimer_name', settings.name);
    localStorage.setItem('lifeTimer_birthdate', settings.birthdate);
    localStorage.setItem('lifeTimer_lifeExpectancy', settings.lifeExpectancy);
    localStorage.setItem('lifeTimer_timezone', settings.timezone);
    localStorage.setItem('lifeTimer_focusTime', settings.focusTime);
    localStorage.setItem('lifeTimer_restTime', settings.restTime);
    
    setDwTimeLeft(settings.focusTime * 60);
    setIsEditingSettings(false);
    setActiveTab('overview');
  };

  const handleAddTask = (type) => {
    const text = type === 'urgent' ? newUrgentTask : newImportantTask;
    if (text.trim() === '') return;
    
    const updatedTasks = [{ id: Date.now(), text, type, done: false, completedAt: null }, ...tasks];
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_tasks', JSON.stringify(updatedTasks));
    
    if (type === 'urgent') setNewUrgentTask('');
    else setNewImportantTask('');
  };

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        return { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null };
      }
      return t;
    });
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_tasks', JSON.stringify(updatedTasks));
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_tasks', JSON.stringify(updatedTasks));
  };

  const activeUrgent = tasks.filter(t => t.type === 'urgent' && !t.done);
  const activeImportant = tasks.filter(t => t.type === 'important' && !t.done);
  const historyTasks = tasks.filter(t => t.done).sort((a, b) => b.completedAt - a.completedAt);

  const pageVariants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -15, scale: 0.98 }
  };

  if (!isMounted) return null;

  return (
    <>
      {settings.birthdate && (
        <motion.header className="top-header" initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{duration: 0.5}}>
          <div className="brand-logo" onClick={() => { setActiveTab('settings'); setIsEditingSettings(false); }}>
            <Hexagon size={24} color="#06b6d4" strokeWidth={2.5} />
            <span className="brand-name">KALA</span>
          </div>
        </motion.header>
      )}

      <div className="container">
        
        {/* --- GLOBAL QUOTE --- */}
        {/* Displayed on all operational tabs, hidden during setup/profile */}
        {settings.birthdate && activeTab !== 'settings' && (
          <motion.div className="quote-container" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2, duration: 0.8}}>
            <p className="quote-text">"{currentQuote}"</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          
          {/* --- SETTINGS / PROFILE SCREEN --- */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="setup">
              
              {!isEditingSettings ? (
                /* --- READ-ONLY PROFILE VIEW --- */
                <div style={{ textAlign: 'center' }}>
                  <Hexagon size={56} color="#06b6d4" strokeWidth={1.5} style={{ margin: '0 auto 15px auto' }} />
                  <h1 style={{ fontSize: '2.4rem', marginBottom: '5px' }}>Hello, {settings.name}.</h1>
                  <p className="subtitle" style={{ marginBottom: '35px' }}>Temporal synchronization active.</p>
                  
                  <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>ORIGIN DATE</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{settings.birthdate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>LIFE MODEL</span>
                      <span style={{ color: '#06b6d4', fontWeight: 600 }}>{settings.lifeExpectancy} YRS</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px' }}>FOCUS PROTOCOL</span>
                      <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{settings.focusTime}M / {settings.restTime}M</span>
                    </div>
                  </div>
                  
                  <button onClick={() => setIsEditingSettings(true)}>CONFIGURE SYSTEM</button>
                </div>
              ) : (
                /* --- EDITABLE CONFIGURATION FORM --- */
                <div style={{ textAlign: 'center' }}>
                  <h1>System Configuration</h1>
                  <p className="subtitle">Initialize your temporal parameters.</p>
                  
                  <div className="form-group" style={{ marginTop: '30px' }}>
                    <label>Designation (Your Name)</label>
                    <input type="text" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})} placeholder="Enter your name..." />
                  </div>

                  <div className="form-group">
                    <label>Birth Date</label>
                    <input type="date" value={settings.birthdate} onChange={(e) => setSettings({...settings, birthdate: e.target.value})} />
                  </div>
                  
                  <div className="form-group">
                    <label>Life Expectancy Model</label>
                    <select value={settings.lifeExpectancy} onChange={(e) => setSettings({...settings, lifeExpectancy: parseFloat(e.target.value)})}>
                      <option value="73.4">Global Average (~73.4 yrs)</option>
                      <option value="70.8">India (~70.8 yrs)</option>
                      <option value="78.9">USA (~78.9 yrs)</option>
                      <option value="84.0">Japan (~84.0 yrs)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Focus (Min)</label>
                      <input type="number" value={settings.focusTime} onChange={(e) => setSettings({...settings, focusTime: parseInt(e.target.value) || 25})} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Rest (Min)</label>
                      <input type="number" value={settings.restTime} onChange={(e) => setSettings({...settings, restTime: parseInt(e.target.value) || 5})} />
                    </div>
                  </div>
                  
                  <button onClick={saveSettings} style={{ marginTop: '10px' }}>{localStorage.getItem('lifeTimer_birthdate') ? 'SAVE PARAMETERS' : 'INITIALIZE SYSTEM'}</button>
                  
                  {/* Allow canceling edit if a valid profile exists */}
                  {localStorage.getItem('lifeTimer_birthdate') && (
                     <button className="secondary" onClick={() => setIsEditingSettings(false)}>CANCEL</button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* --- OVERVIEW SCREEN --- */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="timer">

              <div className="clock-display">
                <div className="clock-flex-container">
                  {timerData.timeString.split(':').map((part, index) => {
                    const labels = ['YRS', 'DYS', 'HRS', 'MIN', 'SEC'];
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <div className="time-unit">
                          <span className="unit-value">{part}</span>
                          <span className="unit-label">{labels[index]}</span>
                        </div>
                        {index < 4 && <div className="unit-separator">:</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="progress-section">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${timerData.livedPercent}%` }}></div>
                </div>
                <div className="subtitle" style={{ marginTop: '12px', letterSpacing: '1px' }}>SYSTEM DECAY: {timerData.livedPercent}%</div>
              </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{timerData.currentAge}</div>
                  <div className="stat-label">Current Age</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{timerData.daysLeft.toLocaleString()}</div>
                  <div className="stat-label">Days Left</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{timerData.hoursLeft.toLocaleString()}</div>
                  <div className="stat-label">Hours Left</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- TASKS SCREEN (MATRIX LAYOUT) --- */}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="tasks">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: '1.8rem', background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Execution Queue</h2>
                  <p className="subtitle" style={{ marginTop: '2px' }}>Matrix Priorities</p>
                </div>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ width: 'auto', padding: '10px 16px', background: showHistory ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.4)', border: showHistory ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.05)', boxShadow: 'none', color: showHistory ? '#06b6d4' : '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '12px' }}
                >
                  <History size={18} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Log</span>
                </button>
              </div>

              {showHistory ? (
                /* HISTORY LOG */
                <div className="task-section">
                  <h3 style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'left' }}>Completed Directives</h3>
                  {historyTasks.length === 0 ? <p style={{ color: '#475569', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>No log data found.</p> : null}
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence>
                      {historyTasks.map(task => (
                        <motion.li key={task.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.3)', padding: '14px 16px', borderRadius: '12px', borderLeft: task.type === 'urgent' ? '3px solid rgba(6, 182, 212, 0.5)' : '3px solid rgba(139, 92, 246, 0.5)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CheckCircle2 color="#475569" size={18} />
                            <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '0.95rem' }}>{task.text}</span>
                          </div>
                          <X color="#475569" size={18} style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => deleteTask(task.id)} onMouseOver={(e) => e.target.style.color = '#ef4444'} onMouseOut={(e) => e.target.style.color = '#475569'} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              ) : (
                /* ACTIVE MATRIX */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  
                  {/* URGENT SECTION */}
                  <div className="task-section" style={{ borderLeft: '3px solid #06b6d4', paddingLeft: '15px', textAlign: 'left' }}>
                    <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }}></div>
                      Urgent (Do First)
                    </h3>
                    <div className="task-input-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <input type="text" value={newUrgentTask} onChange={(e) => setNewUrgentTask(e.target.value)} placeholder="High priority directive..." onKeyDown={(e) => e.key === 'Enter' && handleAddTask('urgent')} style={{ padding: '14px 16px', background: 'rgba(30, 41, 59, 0.4)' }}/>
                      <button onClick={() => handleAddTask('urgent')} style={{ width: '55px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
                        <Plus size={22} />
                      </button>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <AnimatePresence>
                        {activeUrgent.map(task => (
                          <motion.li key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => toggleTask(task.id)}>
                              <Circle color="#06b6d4" size={20} />
                              <span style={{ fontSize: '1rem', color: '#ffffff' }}>{task.text}</span>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>

                  {/* IMPORTANT SECTION */}
                  <div className="task-section" style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '15px', textAlign: 'left' }}>
                    <h3 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 10px #8b5cf6' }}></div>
                      Important (Schedule)
                    </h3>
                    <div className="task-input-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <input type="text" value={newImportantTask} onChange={(e) => setNewImportantTask(e.target.value)} placeholder="Long-term directive..." onKeyDown={(e) => e.key === 'Enter' && handleAddTask('important')} style={{ padding: '14px 16px', background: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(139, 92, 246, 0.3)' }}/>
                      <button onClick={() => handleAddTask('important')} style={{ width: '55px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)' }}>
                        <Plus size={22} />
                      </button>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <AnimatePresence>
                        {activeImportant.map(task => (
                          <motion.li key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => toggleTask(task.id)}>
                              <Circle color="#8b5cf6" size={20} />
                              <span style={{ fontSize: '1rem', color: '#ffffff' }}>{task.text}</span>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* --- DEEP WORK SCREEN --- */}
          {activeTab === 'deepwork' && (
            <motion.div key="deepwork" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
               <div className="header-container" style={{ marginBottom: '30px' }}>
                <h2>Deep Work Protocol</h2>
                <p className="subtitle">Isolate focus. Execute.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
                <button 
                  onClick={() => switchDwMode('work')}
                  style={{ 
                    padding: '10px 20px', fontSize: '0.8rem', 
                    background: dwMode === 'work' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: dwMode === 'work' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'none', color: dwMode === 'work' ? '#06b6d4' : '#64748b'
                  }}>
                  FOCUS ({settings.focusTime}m)
                </button>
                <button 
                  onClick={() => switchDwMode('break')}
                  style={{ 
                    padding: '10px 20px', fontSize: '0.8rem', 
                    background: dwMode === 'break' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    border: dwMode === 'break' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'none', color: dwMode === 'break' ? '#8b5cf6' : '#64748b'
                  }}>
                  REST ({settings.restTime}m)
                </button>
              </div>

              <div className="clock-display" style={{ 
                borderColor: dwMode === 'work' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(139, 92, 246, 0.3)',
                boxShadow: dwMode === 'work' 
                  ? '0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(6, 182, 212, 0.05)' 
                  : '0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(139, 92, 246, 0.05)'
              }}>
                <div className="clock-time" style={{ 
                  color: dwMode === 'work' ? '#06b6d4' : '#8b5cf6',
                  fontSize: 'clamp(4rem, 15vw, 6rem)',
                  textShadow: dwMode === 'work' ? '0 0 20px rgba(6, 182, 212, 0.4)' : '0 0 20px rgba(139, 92, 246, 0.4)'
                }}>
                  {formatDwTime(dwTimeLeft)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                <button onClick={toggleDwTimer} style={{ width: '80px', height: '80px', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>
                  {dwIsActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" style={{ marginLeft: '6px' }} />}
                </button>
                <button onClick={resetDwTimer} style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, boxShadow: 'none' }}>
                  <RotateCcw size={28} color="#64748b" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* --- NAVIGATION BAR --- */}
        {settings.birthdate && (
          <nav className="bottom-nav">
            <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <Hourglass size={22} />
              <span className="nav-text">MACRO</span>
            </button>
            <button className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
              <Target size={22} />
              <span className="nav-text">QUEUE</span>
            </button>
            <button className={`nav-item ${activeTab === 'deepwork' ? 'active' : ''}`} onClick={() => setActiveTab('deepwork')}>
              <Brain size={22} />
              <span className="nav-text">FOCUS</span>
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
