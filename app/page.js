"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, Target, Brain, Settings, Play, Pause, RotateCcw, Plus, CheckCircle2, Circle, History, X, Edit2 } from 'lucide-react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState({
    birthdate: '',
    lifeExpectancy: 73.4,
    timezone: 5.5
  });
  
  // --- LIFE TIMER STATE ---
  const [timerData, setTimerData] = useState({
    years: '00', days: '000', hours: '00', minutes: '00', seconds: '00',
    livedPercent: 0, currentAge: 0, daysLeft: 0, hoursLeft: 0
  });

  // --- TASKS STATE ---
  const [tasks, setTasks] = useState([]);
  const [newUrgentTask, setNewUrgentTask] = useState('');
  const [newImportantTask, setNewImportantTask] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // --- DEEP WORK STATE (DYNAMIC) ---
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [dwTimeLeft, setDwTimeLeft] = useState(25 * 60);
  const [dwIsActive, setDwIsActive] = useState(false);
  const [dwMode, setDwMode] = useState('work');
  
  // Editing State
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editInputValue, setEditInputValue] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsMounted(true);
    const savedBD = localStorage.getItem('lifeTimer_birthdate');
    const savedLE = localStorage.getItem('lifeTimer_lifeExpectancy');
    const savedTZ = localStorage.getItem('lifeTimer_timezone');
    
    if (savedBD && savedLE) {
      setSettings({
        birthdate: savedBD,
        lifeExpectancy: parseFloat(savedLE),
        timezone: parseFloat(savedTZ) || 5.5
      });
      setActiveTab('overview');
    } else {
      setActiveTab('settings');
    }

    const savedTasks = JSON.parse(localStorage.getItem('lifeTimer_pro_tasks') || '[]');
    setTasks(savedTasks);

    // Load custom timer settings
    const savedWork = localStorage.getItem('lifeTimer_workDur');
    const savedBreak = localStorage.getItem('lifeTimer_breakDur');
    if (savedWork) {
      setWorkDuration(parseInt(savedWork));
      setDwTimeLeft(parseInt(savedWork) * 60);
    }
    if (savedBreak) setBreakDuration(parseInt(savedBreak));

  }, []);

  // --- LIFE TIMER LOGIC ---
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
          years: String(years).padStart(2, '0'),
          days: String(days).padStart(3, '0'),
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
          livedPercent: ((lived / (endOfLife - birthDate)) * 100).toFixed(4),
          currentAge: Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000)),
          daysLeft: daysRemaining,
          hoursLeft: (daysRemaining * 24) + hours
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [settings, activeTab]);

  // --- DEEP WORK LOGIC ---
  useEffect(() => {
    let interval = null;
    if (dwIsActive && dwTimeLeft > 0) {
      interval = setInterval(() => {
        setDwTimeLeft(time => time - 1);
      }, 1000);
    } else if (dwTimeLeft === 0 && dwIsActive) {
      setDwIsActive(false);
      // Auto-switch modes when time is up
      if (dwMode === 'work') {
        setDwMode('break');
        setDwTimeLeft(breakDuration * 60);
      } else {
        setDwMode('work');
        setDwTimeLeft(workDuration * 60);
      }
    }
    return () => clearInterval(interval);
  }, [dwIsActive, dwTimeLeft, dwMode, workDuration, breakDuration]);

  // --- TIMER HANDLERS ---
  const toggleDwTimer = () => setDwIsActive(!dwIsActive);
  
  const resetDwTimer = () => {
    setDwIsActive(false);
    setDwTimeLeft(dwMode === 'work' ? workDuration * 60 : breakDuration * 60);
  };
  
  const switchDwMode = (mode) => {
    setDwIsActive(false);
    setDwMode(mode);
    setDwTimeLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
    setIsEditingTime(false);
  };

  const handleTimeClick = () => {
    if (!dwIsActive) {
      setIsEditingTime(true);
      setEditInputValue(dwMode === 'work' ? workDuration.toString() : breakDuration.toString());
    }
  };

  const handleTimeSubmit = (e) => {
    if (e) e.preventDefault();
    const newMinutes = parseInt(editInputValue);
    
    if (!isNaN(newMinutes) && newMinutes > 0 && newMinutes <= 120) {
      if (dwMode === 'work') {
        setWorkDuration(newMinutes);
        setDwTimeLeft(newMinutes * 60);
        localStorage.setItem('lifeTimer_workDur', newMinutes.toString());
      } else {
        setBreakDuration(newMinutes);
        setDwTimeLeft(newMinutes * 60);
        localStorage.setItem('lifeTimer_breakDur', newMinutes.toString());
      }
    }
    setIsEditingTime(false);
  };

  const formatDwTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- GENERAL HANDLERS ---
  const saveSettings = () => {
    if (!settings.birthdate) return alert('Please select your birthdate');
    localStorage.setItem('lifeTimer_birthdate', settings.birthdate);
    localStorage.setItem('lifeTimer_lifeExpectancy', settings.lifeExpectancy);
    localStorage.setItem('lifeTimer_timezone', settings.timezone);
    setActiveTab('overview');
  };

  const addTask = (type) => {
    const text = type === 'urgent' ? newUrgentTask : newImportantTask;
    if (text.trim() === '') return;
    const updatedTasks = [{ id: Date.now(), text, type, done: false, completedAt: null }, ...tasks];
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_pro_tasks', JSON.stringify(updatedTasks));
    if (type === 'urgent') setNewUrgentTask('');
    else setNewImportantTask('');
  };

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) return { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null };
      return t;
    });
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_pro_tasks', JSON.stringify(updatedTasks));
  };

  const permanentlyDeleteTask = (id) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('lifeTimer_pro_tasks', JSON.stringify(updatedTasks));
  };

  const activeUrgent = tasks.filter(t => t.type === 'urgent' && !t.done);
  const activeImportant = tasks.filter(t => t.type === 'important' && !t.done);
  const historyTasks = tasks.filter(t => t.done).sort((a, b) => b.completedAt - a.completedAt);

  const pageVariants = { initial: { opacity: 0, y: 15, scale: 0.98 }, in: { opacity: 1, y: 0, scale: 1 }, out: { opacity: 0, y: -15, scale: 0.98 } };

  if (!isMounted) return null;

  return (
    <div className="container">
      <AnimatePresence mode="wait">
        
        {/* --- SETTINGS SCREEN --- */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="setup">
            <Settings size={48} color="#475569" style={{ margin: '0 auto 15px auto' }} />
            <h1>System Configuration</h1>
            <p className="subtitle">Initialize your temporal parameters.</p>
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
            <button onClick={saveSettings} style={{ marginTop: '20px' }}>INITIALIZE</button>
          </motion.div>
        )}

        {/* --- OVERVIEW SCREEN --- */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="timer">
            <div className="clock-display">
              <div className="time-block"><span className="time-value">{timerData.years}</span><span className="time-label">YRS</span></div><span className="time-separator">:</span>
              <div className="time-block"><span className="time-value">{timerData.days}</span><span className="time-label">DYS</span></div><span className="time-separator">:</span>
              <div className="time-block"><span className="time-value">{timerData.hours}</span><span className="time-label">HRS</span></div><span className="time-separator">:</span>
              <div className="time-block"><span className="time-value">{timerData.minutes}</span><span className="time-label">MIN</span></div><span className="time-separator">:</span>
              <div className="time-block"><span className="time-value">{timerData.seconds}</span><span className="time-label">SEC</span></div>
            </div>
            <div className="progress-section">
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${timerData.livedPercent}%` }}></div></div>
              <div className="subtitle" style={{ marginTop: '12px', letterSpacing: '1px' }}>SYSTEM DECAY: {timerData.livedPercent}%</div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{timerData.currentAge}</div><div className="stat-label">Current Age</div></div>
              <div className="stat-card"><div className="stat-value">{timerData.daysLeft.toLocaleString()}</div><div className="stat-label">Days Left</div></div>
              <div className="stat-card"><div className="stat-value">{timerData.hoursLeft.toLocaleString()}</div><div className="stat-label">Hours Left</div></div>
            </div>
          </motion.div>
        )}

        {/* --- TASKS SCREEN --- */}
        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} className="tasks">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div><h2>Execution Queue</h2><p className="subtitle">Matrix Priorities</p></div>
              <button onClick={() => setShowHistory(!showHistory)} style={{ width: 'auto', padding: '10px 16px', background: showHistory ? 'rgba(34, 211, 238, 0.15)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none', color: showHistory ? '#22d3ee' : '#64748b', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '10px' }}>
                <History size={18} /><span style={{ fontSize: '0.8rem' }}>Log</span>
              </button>
            </div>

            {showHistory ? (
              <div className="task-section">
                <h3 style={{ color: '#64748b', marginBottom: '15px' }}>Completed Directives</h3>
                {historyTasks.length === 0 ? <p style={{ color: '#475569', fontSize: '0.9rem', textAlign: 'center' }}>No log data found.</p> : null}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <AnimatePresence>
                    {historyTasks.map(task => (
                      <motion.li key={task.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 23, 0.5)', padding: '12px 16px', borderRadius: '8px', borderLeft: task.type === 'urgent' ? '3px solid #ef4444' : '3px solid #3b82f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle2 color="#475569" size={18} /><span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: '0.95rem' }}>{task.text}</span></div>
                        <X color="#475569" size={16} style={{ cursor: 'pointer' }} onClick={() => permanentlyDeleteTask(task.id)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ) : (
              <>
                <div className="task-section" style={{ borderLeft: '3px solid #ef4444' }}>
                  <h3>Urgent (Do First)</h3>
                  <div className="task-input-container">
                    <input type="text" value={newUrgentTask} onChange={(e) => setNewUrgentTask(e.target.value)} placeholder="High priority directive..." onKeyDown={(e) => e.key === 'Enter' && addTask('urgent')} style={{ padding: '12px 16px' }}/>
                    <button onClick={() => addTask('urgent')} style={{ width: '50px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Plus size={20} /></button>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence>
                      {activeUrgent.map(task => (
                        <motion.li key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 23, 0.5)', padding: '14px 16px', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => toggleTask(task.id)}><Circle color="#ef4444" size={20} /><span style={{ fontSize: '1rem', color: '#ffffff' }}>{task.text}</span></div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                <div className="task-section" style={{ borderLeft: '3px solid #3b82f6' }}>
                  <h3>Important (Schedule)</h3>
                  <div className="task-input-container">
                    <input type="text" value={newImportantTask} onChange={(e) => setNewImportantTask(e.target.value)} placeholder="Long-term directive..." onKeyDown={(e) => e.key === 'Enter' && addTask('important')} style={{ padding: '12px 16px' }}/>
                    <button onClick={() => addTask('important')} style={{ width: '50px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderTopColor: '#60a5fa' }}><Plus size={20} /></button>
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence>
                      {activeImportant.map(task => (
                        <motion.li key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 23, 0.5)', padding: '14px 16px', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => toggleTask(task.id)}><Circle color="#3b82f6" size={20} /><span style={{ fontSize: '1rem', color: '#ffffff' }}>{task.text}</span></div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* --- DEEP WORK SCREEN (DYNAMIC) --- */}
        {activeTab === 'deepwork' && (
          <motion.div key="deepwork" initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
             <div className="header-container" style={{ marginBottom: '30px' }}>
              <h2>Deep Work Protocol</h2>
              <p className="subtitle">Isolate focus. Execute.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
              <button onClick={() => switchDwMode('work')} style={{ padding: '10px 20px', fontSize: '0.8rem', background: dwMode === 'work' ? 'rgba(6, 182, 212, 0.15)' : 'transparent', border: dwMode === 'work' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)', boxShadow: 'none', color: dwMode === 'work' ? '#22d3ee' : '#64748b', transition: 'all 0.3s' }}>
                FOCUS ({workDuration}m)
              </button>
              <button onClick={() => switchDwMode('break')} style={{ padding: '10px 20px', fontSize: '0.8rem', background: dwMode === 'break' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', border: dwMode === 'break' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', boxShadow: 'none', color: dwMode === 'break' ? '#a78bfa' : '#64748b', transition: 'all 0.3s' }}>
                REST ({breakDuration}m)
              </button>
            </div>

            <div 
              className="clock-display" 
              onClick={handleTimeClick}
              style={{ 
                borderColor: dwMode === 'work' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(139, 92, 246, 0.3)',
                boxShadow: dwMode === 'work' 
                  ? '0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(6, 182, 212, 0.05)' 
                  : '0 20px 40px rgba(0,0,0,0.5), inset 0 0 40px rgba(139, 92, 246, 0.05)',
                cursor: dwIsActive ? 'default' : 'pointer',
                position: 'relative'
              }}
            >
              {!dwIsActive && !isEditingTime && (
                <div style={{ position: 'absolute', top: '15px', right: '15px', opacity: 0.5 }}>
                  <Edit2 size={16} color={dwMode === 'work' ? '#22d3ee' : '#a78bfa'} />
                </div>
              )}

              {isEditingTime ? (
                <form onSubmit={handleTimeSubmit} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="number" 
                    autoFocus
                    min="1"
                    max="120"
                    value={editInputValue} 
                    onChange={(e) => setEditInputValue(e.target.value)}
                    onBlur={handleTimeSubmit}
                    style={{ 
                      width: '120px', textAlign: 'center', fontSize: '3rem', padding: '10px',
                      background: 'transparent', border: 'none', boxShadow: 'none',
                      color: '#ffffff', borderBottom: `2px solid ${dwMode === 'work' ? '#22d3ee' : '#a78bfa'}`,
                      borderRadius: '0'
                    }} 
                  />
                </form>
              ) : (
                <motion.div 
                  key={dwTimeLeft} // This key swap makes the number softly "tick" on change
                  initial={{ opacity: 0.8, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="clock-time" 
                  style={{ 
                    color: dwMode === 'work' ? '#22d3ee' : '#a78bfa',
                    fontSize: 'clamp(4rem, 15vw, 6rem)',
                    textShadow: dwMode === 'work' ? '0 0 20px rgba(34, 211, 238, 0.4)' : '0 0 20px rgba(167, 139, 250, 0.4)',
                    fontFamily: "'SF Mono', 'Courier New', monospace",
                    fontWeight: 800,
                    letterSpacing: '2px'
                  }}
                >
                  {formatDwTime(dwTimeLeft)}
                </motion.div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
              <button onClick={toggleDwTimer} disabled={isEditingTime} style={{ width: '80px', height: '80px', borderRadius: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, opacity: isEditingTime ? 0.5 : 1 }}>
                {dwIsActive ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" style={{ marginLeft: '6px' }} />}
              </button>
              <button onClick={resetDwTimer} disabled={isEditingTime} style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, boxShadow: 'none', opacity: isEditingTime ? 0.5 : 1 }}>
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
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={22} />
            <span className="nav-text">SYS</span>
          </button>
        </nav>
      )}
    </div>
  );
}
