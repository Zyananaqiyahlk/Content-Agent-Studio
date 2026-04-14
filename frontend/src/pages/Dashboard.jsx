import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

function getDailyTasks(niche) {
  const tasks = {
    fitness:    ['Film 60-sec morning routine reel', 'Reply to 10 comments', 'Research trending fitness audio', 'Post a poll: "What\'s your goal this week?"'],
    beauty:     ['Post a GRWM (Get Ready With Me) reel', 'Research trending beauty products', 'Reply to DMs from yesterday', 'Create a carousel: "Top 5 skincare tips"'],
    food:       ['Film a recipe reel under 60 seconds', 'Engage with 5 food creators', 'Draft 3 caption ideas', 'Research seasonal trending ingredients'],
    tech:       ['Post a "hot take" tech opinion', 'Research 1 trending tech topic', 'Reply to all comments', 'Draft next week\'s script ideas'],
    finance:    ['Share a money-saving tip reel', 'Reply to DM questions', 'Research viral finance topics', 'Draft an outreach email to a fintech brand'],
    default:    ['Post your daily content piece', 'Engage with 10 accounts in your niche', 'Reply to all comments from yesterday', 'Research 3 trending topics in your space'],
  }
  return (tasks[niche] || tasks.default).map((text, i) => ({ id: i, text, done: false }))
}

const GOAL_KEY = 'follower_goal'
const TASKS_KEY = 'daily_tasks'
const TODAY = new Date().toISOString().split('T')[0]

export default function Dashboard() {
  const { user, credits } = useAuth()
  const location = useLocation()

  const [goal, setGoal] = useState(() => {
    try { return JSON.parse(localStorage.getItem(GOAL_KEY)) || { current: 0, target: 10000, date: '' } } catch { return { current: 0, target: 10000, date: '' } }
  })
  const [editGoal, setEditGoal] = useState(false)
  const [goalForm, setGoalForm] = useState(goal)

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TASKS_KEY))
      if (saved?.date === TODAY) return saved.tasks
    } catch {}
    return getDailyTasks(user?.niche)
  })

  const [scripts, setScripts] = useState([])
  const [welcome, setWelcome] = useState(location.state?.welcome || false)

  useEffect(() => {
    if (welcome) {
      const t = setTimeout(() => setWelcome(false), 5000)
      return () => clearTimeout(t)
    }
  }, [welcome])

  useEffect(() => {
    api.getScripts().then(setScripts).catch(() => {})
  }, [])

  function toggleTask(id) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    localStorage.setItem(TASKS_KEY, JSON.stringify({ date: TODAY, tasks: updated }))
  }

  function saveGoal() {
    setGoal(goalForm)
    localStorage.setItem(GOAL_KEY, JSON.stringify(goalForm))
    setEditGoal(false)
  }

  const progress = Math.min(100, goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0)
  const doneTasks = tasks.filter(t => t.done).length
  const totalScripts = scripts.length

  return (
    <div>
      {welcome && (
        <div className="alert success" style={{ marginBottom: 0 }}>
          🎉 Welcome to Content Agent Studio! You have {location.state?.credits || 25} free credits to get started.
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'Creator'} 👋</p>
        </div>
        <Link to="/scripts" className="btn btn-primary">+ New Script</Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Credits left</div>
          <div className="value" style={{ color: 'var(--accent)' }}>{credits}</div>
          <div className="sub"><Link to="/credits">Buy more</Link></div>
        </div>
        <div className="stat-card">
          <div className="label">Tasks done today</div>
          <div className="value">{doneTasks}/{tasks.length}</div>
          <div className="sub">{doneTasks === tasks.length ? '🎯 All done!' : `${tasks.length - doneTasks} remaining`}</div>
        </div>
        <div className="stat-card">
          <div className="label">Scripts generated</div>
          <div className="value">{totalScripts}</div>
          <div className="sub"><Link to="/scripts">View all</Link></div>
        </div>
        <div className="stat-card">
          <div className="label">Goal progress</div>
          <div className="value">{progress}%</div>
          <div className="sub">{goal.current.toLocaleString()} / {goal.target.toLocaleString()}</div>
        </div>
      </div>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Follower goal tracker */}
        <div className="card">
          <div className="card-header">
            <h3>🎯 Follower goal</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => { setGoalForm(goal); setEditGoal(true) }}>Edit</button>
          </div>
          {editGoal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Current followers</label>
                <input type="number" value={goalForm.current} onChange={e => setGoalForm(f => ({ ...f, current: +e.target.value }))} min="0" />
              </div>
              <div className="form-group">
                <label>Goal followers</label>
                <input type="number" value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: +e.target.value }))} min="1" />
              </div>
              <div className="form-group">
                <label>Target date</label>
                <input type="date" value={goalForm.date} onChange={e => setGoalForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={saveGoal}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditGoal(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="goal-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Followers</span>
                {goal.date && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>by {new Date(goal.date).toLocaleDateString()}</span>}
              </div>
              <div className="goal-bar-wrap">
                <div className="goal-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="goal-numbers">
                <span>{goal.current.toLocaleString()}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{progress}%</span>
                <span>{goal.target.toLocaleString()}</span>
              </div>
              {goal.target === 10000 && goal.current === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Set your follower goal above to track progress.</p>
              )}
            </div>
          )}
        </div>

        {/* Today's tasks */}
        <div className="card">
          <div className="card-header">
            <h3>✅ Today's tasks</h3>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-item${task.done ? ' done' : ''}`} onClick={() => toggleTask(task.id)}>
                <div className={`task-check${task.done ? ' checked' : ''}`}>{task.done ? '✓' : ''}</div>
                <div className="task-text">{task.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent scripts */}
      {scripts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>📄 Recent scripts</h3>
            <Link to="/scripts" style={{ fontSize: 13 }}>View all →</Link>
          </div>
          <div className="script-list">
            {scripts.slice(0, 3).map(s => (
              <div key={s.id} className="script-item">
                <div className="topic">{s.topic}</div>
                <div className="meta">
                  <span>{s.format || 'Talking Head'}</span>
                  <span>{s.platform || 'Instagram Reels'}</span>
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
