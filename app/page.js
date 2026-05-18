"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState({
    birthdate: '',
    lifeExpectancy: 73.4,
    timezone: 5.5
  });
  
  const [timerData, setTimerData] = useState({
    timeString: '00:000:00:00:00',
    livedPercent: 0,
    currentAge: 0,
    daysLeft: 0,
    hoursLeft: 0
  });

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

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
          livedPercent: ((lived / (endOfLife - birthDate)) * 100).toFixed(2),
          currentAge: Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000)),
          daysLeft: daysRemaining,
          hoursLeft: (daysRemaining * 24) + hours
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings, activeTab]);

  const saveSettings = () => {
    if (!settings.birthdate) return alert('Please select your birthdate');
    localStorage.setItem('lifeTimer_birthdate', settings.birthdate);
    localStorage.setItem('lifeTimer_lifeExpectancy', settings.lifeExpectancy);
    localStorage.setItem('lifeTimer_timezone', settings.timezone);
    setActiveTab('overview');
  };

  const handleAddTask = () => {
    if (tasks.length >= 3) return alert("Focus mode: Only 3 primary tasks allowed per day.");
    if (newTask.trim() === '') return;
    
    const updatedTasks = [...tasks, { id: Date.now(), text: newTask, done: false }];
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

  if (!isMounted) return null;

  return (
    <div className="container">
      
      {/* --- SETTINGS SCREEN --- */}
      {activeTab === 'settings' && (
        <div className="setup">
          <h1>⏳ Life Timer Setup</h1>
          <p>Set your birthdate once. Saved permanently on this device.</p>
          
          <div className="form-group">
            <label>Your birthdate</label>
            <input 
              type="date" 
              value={settings.birthdate}
              onChange={(e) => setSettings({...settings, birthdate: e.target.value})} 
            />
          </div>
          
          <div className="form-group">
            <label>Life expectancy</label>
            <select 
              value={settings.lifeExpectancy}
              onChange={(e) => setSettings({...settings, lifeExpectancy: parseFloat(e.target.value)})}
            >
              <option value="73.4">Global Average (~73.4 years)</option>
              <option value="70.8">India (~70.8 years)</option>
              <option value="78.9">USA (~78.9 years)</option>
              <option value="84.0">Japan (~84.0 years)</option>
            </select>
          </div>
          
          <button onClick={saveSettings}>🕐 Start Clock</button>
        </div>
      )}

      {/* --- OVERVIEW SCREEN --- */}
      {activeTab === 'overview' && (
        <div className="timer">
          <div className="clock-display">
            <div className="clock-time">{timerData.timeString}</div>
            <div className="clock-label">YEARS : DAYS : HOURS : MIN : SEC</div>
            <div className="timer-title">⏳ Time Remaining</div>
          </div>
          
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${timerData.livedPercent}%` }}></div>
            </div>
            <div className="progress-text">Life Lived: {timerData.livedPercent}%</div>
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
        </div>
      )}

      {/* --- TASKS SCREEN --- */}
      {activeTab === 'tasks' && (
        <div className="tasks">
          <div className="header-container">
            <h2>Daily Execution</h2>
            <p className="subtitle">Select exactly 3 critical tasks for today.</p>
          </div>

          <div className="task-input-container">
            <input 
              type="text" 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter a high-impact task..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <button onClick={handleAddTask} className="add-task-btn">+</button>
          </div>

          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} className="task-item">
                <div className="task-content">
                  <input 
                    type="checkbox" 
                    className="task-checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="task-text" style={{ textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#6b7280' : '#ffffff' }}>
                    {task.text}
                  </span>
                </div>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- NAVIGATION BAR --- */}
      {settings.birthdate && (
        <nav className="bottom-nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="nav-icon">⏳</span>
            <span className="nav-text">Overview</span>
          </button>
          <button className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <span className="nav-icon">🎯</span>
            <span className="nav-text">Tasks</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}
