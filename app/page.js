"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, Target, Brain, Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, Circle, Hexagon } from 'lucide-react';

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
    birthdate: '',
    lifeExpectancy: 73.4,
    timezone: 5.5,
    focusTime: 25, // User customizable Focus timer
    restTime: 5    // User customizable Rest timer
  });
  
  const [timerData, setTimerData] = useState({
    timeString: '00:000:00:00:00', livedPercent: 0, currentAge: 0, daysLeft: 0, hoursLeft: 0
  });

  // --- NEW TASK LOGIC (URGENT / IMPORTANT / HISTORY) ---
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [queueTab, setQueueTab] = useState('urgent'); // 'urgent', 'important', 'history'

  const [dwTimeLeft, setDwTimeLeft] = useState(25 * 60); 
  const [dwIsActive, setDwIsActive] = useState(false);
  const [dwMode, setDwMode] = useState('work'); 

  useEffect(() => {
    setIsMounted(true);
    setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    const savedBD = localStorage.getItem('lifeTimer_birthdate');
    const savedLE = localStorage.getItem('lifeTimer_lifeExpectancy');
    const savedTZ = localStorage.getItem('lifeTimer_timezone');
    const savedFT = localStorage.getItem('lifeTimer_focusTime');
    const savedRT = localStorage.getItem('lifeTimer_restTime');
    
    if (savedBD && savedLE) {
      const parsedFT = savedFT ? parseInt(savedFT) : 25;
      setSettings({
        birthdate: savedBD,
        lifeExpectancy: parseFloat(savedLE),
        timezone: parseFloat(savedTZ) || 5.5,
        focusTime: parsedFT,
        restTime: savedRT ? parseInt(savedRT) : 5
      });
      setDwTimeLeft(parsedFT * 60); // Initialize timer with saved setting
      setActiveTab('overview');
    } else {
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
    if (!settings.birthdate) return alert('Please select your birthdate');
    localStorage.setItem('lifeTimer_birthdate', settings.birthdate);
    localStorage.setItem('lifeTimer_lifeExpectancy', settings.lifeExpectancy);
    localStorage.setItem('lifeTimer_timezone', settings.timezone);
    localStorage.setItem('lifeTimer_focusTime', settings.focusTime);
    localStorage.setItem('lifeTimer_restTime', settings.restTime);
    setDwTimeLeft(settings.focusTime * 60); // Apply new timer settings immediately
    setActiveTab('overview');
  };

  const handleAddTask = () => {
    if (newTask.trim() === '') return;
    const taskType = queueTab === 'history' ? 'urgent' : queueTab; // Prevent adding directly to history
    const updatedTasks = [...tasks, { id: Date.now(), text: newTask, type: taskType, done: false }];
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_tasks', JSON.stringify(updatedTasks));
    setNewTask('');
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_tasks', JSON.stringify(updatedTasks));
  };

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_tasks', JSON.stringify(updatedTasks));
  };

  // Filter tasks based on the active sub-tab
  const displayedTasks = tasks.filter(t => {
    if (queueTab === 'history') return t.done;
    return !t.done && t.type === queueTab;
  });

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
          <div className="brand-logo" onClick={() => setActiveTab('settings')}>
            <Hexagon size={24} color="#06b6d4" strokeWidth={2.5} />
            <span className="brand-name">KALA</span>
          </div>
        </motion.header>
      )}

      <div className="container">
        <AnimatePresence mode="wait">
          
          {/* --- SETTINGS SCREEN --- */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="setup">
              <h1>System Configuration</h1>
              <p className="subtitle">Initialize your temporal and focus parameters.</p>
              
              <div className="form-group" style={{ marginTop: '30px' }}>
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

              {/* NEW: DYNAMIC TIMER SETTINGS */}
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Focus Time (Min)</label>
                  <input type="number" value={settings.focusTime} onChange={(e) => setSettings({...settings, focusTime: parseInt(e.target.value) || 25})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Rest Time (Min)</label>
                  <input type="number" value={settings.restTime} onChange={(e) => setSettings({...settings, restTime: parseInt(e.target.value) || 5})} />
                </div>
              </div>
              
              <button onClick={saveSettings} style={{ marginTop: '10px' }}>{settings.birthdate ? 'UPDATE SYSTEM' : 'INITIALIZE'}</button>
            </motion.div>
          )}

          {/* --- OVERVIEW SCREEN --- */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="timer">
              
              <motion.div className="quote-container" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2, duration: 0.8}}>
                <p className="quote-text">"{currentQuote}"</p>
              </motion.div>

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

          {/* --- TASKS SCREEN (WITH URGENT/IMPORTANT/HISTORY) --- */}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="tasks">
              <div className="header-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2>Execution Queue</h2>
              </div>

              {/* SUB-NAVIGATION TABS */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', justifyContent: 'center' }}>
                <button onClick={() => setQueueTab('urgent')} style={{ padding: '8px 16px', borderRadius: '20px', background: queueTab === 'urgent' ? 'rgba(6, 182, 212, 0.15)' : 'transparent', border: queueTab === 'urgent' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)', color: queueTab === 'urgent' ? '#06b6d4' : '#64748b', fontSize: '0.8rem', boxShadow: 'none' }}>Urgent</button>
                <button onClick={() => setQueueTab('important')} style={{ padding: '8px 16px', borderRadius: '20px', background: queueTab === 'important' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', border: queueTab === 'important' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', color: queueTab === 'important' ? '#8b5cf6' : '#64748b', fontSize: '0.8rem', boxShadow: 'none' }}>Important</button>
                <button onClick={() => setQueueTab('history')} style={{ padding: '8px 16px', borderRadius: '20px', background: queueTab === 'history' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', border: queueTab === 'history' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.1)', color: queueTab === 'history' ? '#ffffff' : '#64748b', fontSize: '0.8rem', boxShadow: 'none' }}>History</button>
              </div>

              {queueTab !== 'history' && (
                <div className="task-input-container" style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                  <input 
                    type="text" 
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={`Enter ${queueTab} directive...`}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <button onClick={handleAddTask} style={{ width: '60px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Plus size={24} />
                  </button>
                </div>
              )}

              <ul className="task-list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <AnimatePresence>
                  {displayedTasks.length === 0 && (
                    <motion.p initial={{opacity: 0}} animate={{opacity: 1}} style={{textAlign: 'center', color: '#64748b', marginTop: '20px'}}>
                      No directives found in this sector.
                    </motion.p>
                  )}
                  {displayedTasks.map(task => (
                    <motion.li 
                      key={task.id} 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, x: 20 }}
                      style={{ 
                        background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', 
                        borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => toggleTask(task.id)}>
                        {task.done ? <CheckCircle2 color="#64748b" /> : <Circle color={task.type === 'urgent' ? "#06b6d4" : "#8b5cf6"} />}
                        <span style={{ 
                          fontSize: '1.05rem', 
                          color: task.done ? '#64748b' : '#ffffff', 
                          textDecoration: task.done ? 'line-through' : 'none',
                          transition: 'all 0.3s'
                        }}>
                          {task.text}
                        </span>
                      </div>
                      <Trash2 color="#64748b" size={20} style={{ cursor: 'pointer' }} onClick={() => deleteTask(task.id)} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
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
