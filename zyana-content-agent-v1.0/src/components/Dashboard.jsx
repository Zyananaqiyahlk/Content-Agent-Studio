import React, { useEffect, useState } from 'react'
import { Users, TrendingUp, FileText, Briefcase, MessageCircle, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useStore, GROWTH_DATA, CONTENT_PLAN } from '../store'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-dm">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { metrics, tasks, toggleTask, brandProspects } = useStore()
  const [barWidth, setBarWidth] = useState(0)
  const followers = metrics.followers
  const pct = Math.min((followers / 10000) * 100, 100)
  const daysLeft = 90 - 7
  const followersNeeded = Math.ceil((10000 - followers) / daysLeft)
  const doneTasks = tasks.filter(t => t.done).length

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  const getStatusColor = (day) => {
    if (day < 7) return 'text-emerald-400 bg-emerald-400/10'
    if (day === 7) return 'text-gold-500 bg-gold-500/10'
    return 'text-zinc-500 bg-white/5'
  }
  const getStatusLabel = (day) => {
    if (day < 7) return 'Done'
    if (day === 7) return 'Today'
    return 'Upcoming'
  }

  return (
    <div className="space-y-5 fade-in-up">
      {/* Greeting */}
      <div>
        <h2 className="font-syne font-bold text-2xl text-white">Good morning, Naqiyah ✦</h2>
        <p className="text-zinc-500 font-dm text-sm mt-0.5">Phase 1 — Foundation (Days 1–30) · Keep building.</p>
      </div>

      {/* Mission Progress */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-syne font-bold text-white">10K Follower Mission</p>
            <p className="text-xs text-zinc-500 font-dm mt-0.5">{followers.toLocaleString()} / 10,000 · ~{followersNeeded}/day needed</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-syne font-bold bg-gold-500/15 text-gold-500">
            Day 7 of 90
          </span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-1000"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-600 font-dm mt-1.5">
          <span>{pct.toFixed(1)}% complete</span>
          <span>{(10000 - followers).toLocaleString()} to go</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'FOLLOWERS', value: followers.toLocaleString(), change: '+23 today', icon: Users, color: 'text-emerald-400' },
          { label: 'ENGAGEMENT', value: `${metrics.engagement}%`, change: '+0.3%', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'SCRIPTS', value: metrics.scriptsGenerated, change: 'Generated', icon: FileText, color: 'text-zinc-500' },
          { label: 'PROSPECTS', value: brandProspects.length, change: 'In pipeline', icon: Briefcase, color: 'text-zinc-500' },
          { label: 'DM INQUIRIES', value: metrics.dmInquiries, change: 'This week', icon: MessageCircle, color: 'text-zinc-500' },
        ].map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-gold-500/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-syne font-semibold">{label}</p>
              <Icon size={14} className="text-zinc-600" />
            </div>
            <p className="text-2xl font-syne font-bold text-white leading-none">{value}</p>
            <p className={`text-xs mt-1.5 font-dm ${color}`}>{change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Growth chart */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <p className="font-syne font-semibold text-white mb-4">Growth Trajectory</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={GROWTH_DATA} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" stroke="#D4A843" strokeWidth={2} fill="url(#goldGrad)" name="Actual" />
              <Area type="monotone" dataKey="target" stroke="#D4A843" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-syne font-semibold text-white">Today's Tasks — Day 7</p>
            <span className="text-xs font-dm text-zinc-500">{doneTasks}/{tasks.length} complete</span>
          </div>
          <div className="space-y-2">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-start gap-3 text-left hover:bg-white/[0.02] rounded-xl p-2 -mx-2 transition-colors group"
              >
                {task.done
                  ? <CheckCircle2 size={16} className="text-gold-500 flex-shrink-0 mt-0.5" />
                  : <Circle size={16} className="text-zinc-600 flex-shrink-0 mt-0.5 group-hover:text-zinc-400 transition-colors" />
                }
                <span className={`text-xs font-dm flex-1 ${task.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                  {task.text}
                </span>
                {task.urgent && !task.done && (
                  <span className="text-[9px] font-syne font-bold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full flex-shrink-0">URGENT</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Calendar */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
        <p className="font-syne font-semibold text-white mb-4">Content Calendar — Days 5–11</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-dm">
            <thead>
              <tr className="text-zinc-600 text-left">
                <th className="pb-3 pr-4 font-semibold uppercase tracking-wider">Day</th>
                <th className="pb-3 pr-4 font-semibold uppercase tracking-wider">Format</th>
                <th className="pb-3 pr-4 font-semibold uppercase tracking-wider">Platform</th>
                <th className="pb-3 pr-4 font-semibold uppercase tracking-wider">Topic</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {CONTENT_PLAN.filter(d => d.day >= 5 && d.day <= 11).map(item => (
                <tr key={item.day} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 font-bold text-white">{item.day}</td>
                  <td className="py-2.5 pr-4 text-zinc-400">{item.format}</td>
                  <td className="py-2.5 pr-4 text-zinc-500">{item.platform[0]}</td>
                  <td className="py-2.5 pr-4 text-zinc-300 max-w-xs truncate">{item.topic}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold ${getStatusColor(item.day)}`}>
                      {getStatusLabel(item.day)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
