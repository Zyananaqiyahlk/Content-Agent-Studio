import { createContext, useContext, useState, useCallback, useRef } from 'react'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [notifs, setNotifs] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setNotifs(n => n.map(x => x.id === id ? { ...x, exiting: true } : x))
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 280)
    clearTimeout(timers.current[id])
  }, [])

  const notify = useCallback(({ title, message, type = 'info', duration = 5000, actions, onAction, persistent = false }) => {
    const id = Date.now() + Math.random()
    setNotifs(n => [...n, { id, title, message, type, actions, onAction, exiting: false }])
    if (!persistent) {
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  // Specialised helpers
  const ask = useCallback((title, message, actions) => {
    return new Promise(resolve => {
      notify({ title, message, type: 'golden', persistent: true, actions, onAction: resolve })
    })
  }, [notify])

  return (
    <NotifContext.Provider value={{ notify, dismiss, ask }}>
      {children}
      <div className="notif-container">
        {notifs.map(n => (
          <div key={n.id} className={`notif ${n.type} ${n.exiting ? 'exiting' : ''}`}>
            <span className="notif-icon">
              {n.type === 'sage'   ? '✅' :
               n.type === 'golden' ? '✨' :
               n.type === 'coral'  ? '⚠️' : 'ℹ️'}
            </span>
            <div className="notif-body">
              {n.title && <div className="notif-title">{n.title}</div>}
              <div className="notif-msg">{n.message}</div>
              {n.actions && (
                <div className="notif-actions">
                  {n.actions.map((a, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm ${i === 0 ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => { n.onAction?.(a.value); dismiss(n.id) }}
                    >{a.label}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="notif-close" onClick={() => dismiss(n.id)}>×</button>
          </div>
        ))}
      </div>
    </NotifContext.Provider>
  )
}

export function useNotif() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotif must be within NotifProvider')
  return ctx
}
