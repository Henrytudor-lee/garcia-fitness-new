/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bolt, 
  Languages, 
  Moon, 
  Search, 
  PlayCircle, 
  Info, 
  ChevronRight, 
  Lock, 
  Settings, 
  LogOut, 
  User, 
  Dumbbell, 
  Library, 
  BarChart3, 
  Plus,
  Flame,
  Trophy,
  History,
  TrendingUp,
  LayoutGrid,
  Mail,
  Eye,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from './lib/utils';
import { EXERCISES, WEIGHT_HISTORY } from './constants';

type Tab = 'training' | 'library' | 'stats' | 'profile' | 'login';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('training');
  const [isLogged, setIsLogged] = useState(false);

  if (!isLogged && activeTab !== 'login') {
    return <Login onLogin={() => setIsLogged(true)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-32">
      <TopAppBar />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {activeTab === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 pt-20"
            >
              <TrainingScreen />
            </motion.div>
          )}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 pt-20"
            >
              <LibraryScreen />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 pt-20"
            >
              <StatsScreen />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-5 pt-20"
            >
              <ProfileScreen onLogout={() => setIsLogged(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-24 right-5 z-40">
        <button className="w-14 h-14 bg-primary-fixed rounded-full shadow-[0_0_20px_rgba(204,242,0,0.4)] flex items-center justify-center text-black active:scale-90 transition-transform">
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function TopAppBar() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-black/70 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center gap-2">
        <Bolt className="text-primary-fixed fill-primary-fixed" size={24} />
        <h1 className="text-xl font-black text-primary-fixed tracking-widest font-lexend uppercase">PULSE_FIT</h1>
      </div>
      <div className="flex items-center gap-4 text-neutral-400">
        <Moon size={20} />
        <div className="flex items-center gap-1">
          <Languages size={20} />
          <span className="text-xs font-bold font-lexend">CN</span>
        </div>
      </div>
    </header>
  );
}

function BottomNavBar({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (tab: Tab) => void }) {
  const tabs = [
    { id: 'training', label: 'Training', icon: Dumbbell },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as Tab)}
          className={cn(
            "flex flex-col items-center justify-center transition-all duration-200",
            activeTab === tab.id ? "text-primary-fixed scale-110" : "text-neutral-500"
          )}
        >
          <tab.icon size={24} fill={activeTab === tab.id ? "currentColor" : "none"} />
          <span className="font-lexend text-[10px] font-bold uppercase mt-1">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function TrainingScreen() {
  return (
    <div className="space-y-6">
      {/* Hero Timer Card */}
      <section className="relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center glass-card">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSTYRd8zffthlzFFsvInIavn1I4dcIYO8WQC8zrBQ5mrInTC3vuQLf1XmrmNa4Q-qajtqG23EdNjtP0lnp890t9_5B-Xx0IzNBC_l0jsqkl9x7U2ZKF_RwnVsShcYv7a6ifJM9JP1Cwwowmn_Yq4vWB_MJERMr3JjBYqMb36SebE-oQU9WIGIcraCcati1pyW4u4HkS5sKLlJGWoiAI9F4HGJ6Cc8XgMr3NVVbcKwnJeT_GGWLChktZ9HZ5JWh_uxSnGvVXsulqA" 
            alt="Gym" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 text-center">
          <p className="text-xs font-bold text-primary-fixed-dim tracking-[0.2em] uppercase mb-1">Duration / 持续时间</p>
          <h2 className="text-5xl font-black text-primary-fixed font-lexend drop-shadow-[0_0_12px_rgba(204,242,0,0.4)]">00:42:15</h2>
          <div className="flex gap-8 mt-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">485</span>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Kcal</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">138</span>
              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Avg BPM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Current Workout */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-bold font-lexend">Current Workout / 当前训练</h3>
          <span className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-wider">Strength Training B</span>
        </div>
        <div className="space-y-3">
          <div className="glass-card rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed/10 flex items-center justify-center">
                  <Dumbbell className="text-primary-fixed" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Bench Press / 卧推</h4>
                  <p className="text-[10px] text-neutral-500 uppercase font-semibold">Chest, Triceps</p>
                </div>
              </div>
              <ChevronRight className="text-neutral-500 -rotate-90" size={20} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-white/10">
              <span className="text-[10px] text-neutral-500 font-bold uppercase">Set</span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase">Prev</span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase">KG</span>
              <span className="text-[10px] text-neutral-500 font-bold uppercase">Reps</span>
              <span className="text-sm font-bold text-primary-fixed">1</span>
              <span className="text-sm font-bold text-neutral-400">80 x 8</span>
              <div className="bg-white/10 rounded-lg py-1 text-sm font-bold">85</div>
              <div className="bg-white/10 rounded-lg py-1 text-sm font-bold">8</div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex justify-between items-center opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <LayoutGrid className="text-neutral-500" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Barbell Squats / 杠铃深蹲</h4>
                <p className="text-[10px] text-neutral-500 uppercase font-semibold">Legs, Core</p>
              </div>
            </div>
            <ChevronRight className="text-neutral-500 rotate-90" size={20} />
          </div>
        </div>
      </section>

      {/* History Bento */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold font-lexend">History / 历史记录</h3>
        <div className="grid grid-cols-2 gap-3 pb-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col justify-between aspect-square">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Monday</span>
            <div className="flex flex-col">
              <span className="text-4xl font-lexend font-bold">24</span>
              <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest">Oct</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary-fixed w-[70%]" />
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col justify-between aspect-square">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Sunday</span>
            <div className="flex flex-col">
              <span className="text-4xl font-lexend font-bold">23</span>
              <span className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest">Oct</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary-fixed w-[45%]" />
            </div>
          </div>
          <div className="col-span-2 glass-card rounded-2xl p-5 flex flex-col gap-4 overflow-hidden relative min-h-[160px]">
             <BarChart3 className="absolute right-[-20px] bottom-[-20px] text-white/5" size={140} />
             <div className="relative z-10">
               <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Monthly Volume</h4>
               <p className="text-4xl font-black text-primary-fixed font-lexend mt-1">12,450 KG</p>
               <p className="text-[10px] text-lime-400/70 font-bold mt-1 uppercase">+12% from last month</p>
             </div>
             <div className="flex items-end gap-1.5 h-16 relative z-10 w-full">
                {[0.4, 0.6, 0.3, 0.8, 0.5, 0.7, 0.9].map((h, i) => (
                  <div key={i} className={cn("flex-grow rounded-t-sm", i === 3 ? "bg-primary-fixed" : "bg-white/10")} style={{ height: `${h * 100}%` }} />
                ))}
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LibraryScreen() {
  const [filter, setFilter] = useState('ALL');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black font-lexend tracking-tighter uppercase">Exercise_Library</h1>
        <p className="text-xs text-neutral-500 mt-2 max-w-xs leading-relaxed uppercase font-semibold">Access over 500+ professional movements with form guidance and performance data.</p>
        <div className="mt-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary-fixed transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="SEARCH EXERCISES..." 
            className="w-full bg-white/5 border-none rounded-xl py-4 pl-12 pr-4 text-sm font-bold placeholder:text-neutral-600 focus:ring-2 focus:ring-primary-fixed transition-all"
          />
        </div>
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em] px-1">Select Equipment</span>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {['ALL', 'DUMBBELL', 'BARBELL', 'MACHINE', 'BODYWEIGHT'].map(item => (
              <button 
                key={item}
                onClick={() => setFilter(item)}
                className={cn(
                  "flex-none px-6 py-2.5 rounded-full font-bold text-xs transition-all active:scale-95",
                  filter === item ? "bg-primary-fixed text-black" : "bg-white/5 text-neutral-500 border border-white/5"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em] px-1">Muscle Focus</span>
          <div className="flex flex-wrap gap-2">
            {['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE'].map((muscle, i) => (
              <button 
                key={muscle}
                className={cn(
                   "px-4 py-2 rounded-lg text-xs font-bold border transition-all active:scale-95",
                   i === 0 ? "bg-blue-600/20 text-blue-400 border-blue-500/50" : "bg-white/5 text-neutral-400 border-white/5 hover:border-primary-fixed/50"
                )}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6">
        {EXERCISES.map(ex => (
          <div key={ex.id} className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/5 hover:border-primary-fixed/50 transition-all cursor-pointer">
            <div className="aspect-[16/10] relative overflow-hidden">
              <img src={ex.image} alt={ex.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              {ex.premium && (
                <div className="absolute top-4 right-4 bg-primary-fixed text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-lg">PREMIUM</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="text-primary-fixed fill-primary-fixed/20" size={56} />
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-lexend font-bold text-lg leading-tight uppercase tracking-tight">{ex.name}</h3>
                <Info className="text-neutral-500" size={20} />
              </div>
              <div className="flex gap-2">
                {ex.muscles.map(m => (
                  <span key={m} className="bg-white/10 text-neutral-400 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">{m}</span>
                ))}
                <span className="bg-white/10 text-neutral-400 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">{ex.equipment}</span>
              </div>
              {ex.difficulty && (
                <div className="mt-4">
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-fixed w-[75%]" />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Difficulty</span>
                    <span className="text-[8px] font-bold text-primary-fixed uppercase tracking-widest">{ex.difficulty}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function StatsScreen() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-black font-lexend tracking-tighter uppercase">Performance Insights</h1>
          <p className="text-xs text-neutral-500 mt-1 uppercase font-bold tracking-widest">Track your progression over time</p>
        </div>
        <select className="w-full bg-white/5 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-fixed appearance-none">
          <option>Bench Press</option>
          <option>Deadlift</option>
          <option>Squat</option>
        </select>
      </header>

      <section className="glass-card rounded-2xl p-5 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-fixed" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Weight progression (kg)</span>
          </div>
          <div className="flex gap-1.5">
            {['1M', '3M', 'ALL'].map((p, i) => (
              <button key={p} className={cn("px-3 py-1 rounded text-[10px] font-bold", i === 0 ? "bg-primary-fixed text-black" : "bg-white/5 text-neutral-500")}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <AreaChart data={WEIGHT_HISTORY}>
               <defs>
                 <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="5%" stopColor="#ccf200" stopOpacity={0.3}/>
                   <stop offset="95%" stopColor="#ccf200" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
               <XAxis 
                dataKey="week" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }}
              />
               <Tooltip 
                contentStyle={{ backgroundColor: '#1c1b1b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                itemStyle={{ color: '#ccf200', fontWeight: 800, fontSize: 14 }}
               />
               <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#ccf200" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
             </AreaChart>
           </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <div className="glass-card rounded-2xl p-5 border-l-4 border-primary-fixed flex flex-col gap-2">
          <Trophy className="text-primary-fixed" size={24} />
          <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Personal Best</h4>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-lexend font-black">125</span>
            <span className="text-lg font-bold text-neutral-500 uppercase">KG</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-lime-400 font-bold uppercase mt-1">
            <TrendingUp size={14} />
            +5kg this month
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-5 border-l-4 border-blue-500 flex flex-col gap-2">
             <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Average Weight</h4>
             <div className="flex items-baseline gap-1 mt-auto">
               <span className="text-3xl font-lexend font-black">92.5</span>
               <span className="text-xs font-bold text-neutral-500 uppercase">KG</span>
             </div>
             <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">Past 10 workouts</p>
          </div>
          <div className="glass-card rounded-2xl p-5 border-l-4 border-neutral-600 flex flex-col gap-2">
             <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Total Sets</h4>
             <div className="flex items-baseline gap-1 mt-auto">
               <span className="text-3xl font-lexend font-black">48</span>
               <span className="text-xs font-bold text-neutral-500 uppercase">Sets</span>
             </div>
             <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">Completed in block</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden relative group cursor-pointer aspect-[16/6] mt-2">
           <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ25olH2nROsXPJjKYl1zVVAAMIqbI9Xkm6SEvnp11PStuXewbOIOl-3ibjTK6a3TgZnwj8kCWyNVbaoeAP3kBvrO0BxLgfUFuypBzc1lgNl_ZwZsuolbK7z55CncCW-JyKTDRqWV9Oq2me88mLbeBxO3BiILqsGt1WPFl0eeckf-I5UOSw79pkrCaL2LLSpfhhbTOce73dBaeczG4balt9prX0mDPYBvlGtl0jnC3tdChEVSxXMqpq8U-WB9sLsGyDv9uo5U9YA" className="absolute inset-0 w-full h-full object-cover opacity-20" />
           <div className="relative z-10 p-5 h-full flex flex-col justify-end">
              <h4 className="text-xl font-lexend font-black uppercase tracking-tight">History</h4>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">View detailed logs</p>
              <ArrowRight className="text-primary-fixed mt-2" size={24} />
           </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="glass-card rounded-2xl p-5 space-y-5">
           <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <BarChart3 className="text-primary-fixed" size={18} />
            Volume Intensity
           </h3>
           <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  <span>Power Phase</span>
                  <span>85%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-fixed w-[85%]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  <span>Hypertrophy</span>
                  <span>60%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-[60%]" />
                </div>
              </div>
           </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center gap-6">
           <div className="flex-none w-20 h-20 rounded-full border-[6px] border-primary-fixed border-t-transparent flex items-center justify-center">
             <span className="text-2xl font-lexend font-black">72</span>
           </div>
           <div className="space-y-1">
             <h3 className="text-xs font-bold uppercase tracking-widest">Rest Efficiency</h3>
             <p className="text-xs text-neutral-500 leading-relaxed font-semibold">Your recovery time between sets is optimizing your peak power output.</p>
           </div>
        </div>
      </section>
    </div>
  );
}

function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="space-y-8 pb-10 max-w-[440px] mx-auto">
      <div className="flex flex-col items-center">
        <div className="relative group p-1">
          <div className="absolute inset-0 bg-primary-fixed blur-3xl opacity-10" />
          <div className="relative w-28 h-28 rounded-full border-2 border-primary-fixed p-1">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBol-XJh9i0KlRtP2wm0j--vVdi6mziB74850b-xh9JHAtmp53lz_eMLPmHKbg03Y6fP2NSa7_6yBa_3T9wYMTL75vl5HSUlW6i7vSvx3nfZyPCs7dlSQVq6g3h8RMVySP6q1GkIqAPahUMcuKIflX_NdgauDeXeYSMvBeo5F33ICqrgWCRbjfQ76-bG0Sz3oDHZZxIPGXt4eJpj1uVpbqbXyvEzB3MsT4dM4sR5Aso_WxadMISG-liWPr0vIsX0v4G2AriMwkSIA" 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>
          <button className="absolute bottom-1 right-1 bg-primary-fixed text-black p-1.5 rounded-full shadow-xl">
             <Plus size={16} strokeWidth={4} />
          </button>
        </div>
        <div className="mt-5 text-center">
           <h2 className="text-2xl font-lexend font-black uppercase tracking-tight">Fitness User</h2>
           <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-1">Premium Member</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <Flame className="absolute top-2 right-2 text-white/5 group-hover:text-amber-500/10 transition-colors" size={48} />
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Active Streak</p>
            <p className="text-3xl font-lexend font-bold mt-2">12 <span className="text-xs text-neutral-600">DAYS</span></p>
         </div>
         <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
            <Trophy className="absolute top-2 right-2 text-white/5 group-hover:text-primary-fixed/10 transition-colors" size={48} />
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Level</p>
            <p className="text-3xl font-lexend font-bold mt-2">Elite <span className="text-xs text-neutral-600">LV. 4</span></p>
         </div>
      </div>

      <div className="space-y-3">
         <div className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <Languages size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold">Language / 语言</p>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase">English (US)</p>
               </div>
            </div>
            <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
              <span className="px-3 py-1 bg-primary-fixed text-black text-[10px] font-black rounded-full">EN</span>
              <span className="px-3 py-1 text-neutral-600 text-[10px] font-black rounded-full">CN</span>
            </div>
         </div>

         <div className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <Mail size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold">Verify Email</p>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Secure your account</p>
               </div>
            </div>
            <ChevronRight className="text-neutral-700" size={20} />
         </div>

         <div className="glass-card rounded-2xl p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-600">
                  <Settings size={20} />
               </div>
               <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-neutral-500 underline decoration-dotted">AI Coach</p>
                    <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Soon</span>
                  </div>
                  <p className="text-[10px] text-neutral-700 font-semibold uppercase tracking-widest pt-0.5">Personalized insights</p>
               </div>
            </div>
            <Lock className="text-neutral-800" size={18} />
         </div>

         <div className="glass-card rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                  <Settings size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold">Settings</p>
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest">Preferences & Privacy</p>
               </div>
            </div>
            <ChevronRight className="text-neutral-700" size={20} />
         </div>

         <button 
          onClick={onLogout}
          className="w-full glass-card rounded-2xl p-4 flex items-center justify-between group active:bg-red-500/10 transition-all border-red-500/5 hover:border-red-500/20"
        >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <LogOut size={20} />
               </div>
               <div className="text-left">
                  <p className="text-sm font-bold text-red-500">Logout</p>
                  <p className="text-[10px] text-red-500/40 font-semibold uppercase tracking-widest">Switch account or exit</p>
               </div>
            </div>
         </button>
      </div>
      
      <p className="text-center text-[10px] font-black text-neutral-800 uppercase tracking-[0.4em] pt-4">Pulse_Fit v2.4.0-stable</p>
    </div>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZZWvmbz_YlF1dw1UBQiMWZVqvmMhVRwC5KwBI1Z7vd2FirIO1P_UPH0iAj9wkClRa9O1ewHBktLbfswupB8uYz_5BOJL1IlIlUfwMbnHbEReprWDhde5_N6U4atbaeHE-Hs5zJsGe7Wyi4db0V59q-_EDGOBZDF4OTIHPqI-NnM27EwxcK8b9nyS6ZMRb85wTPZEzCMVtjbYhEZ9wGs-mdeMMwRAHivJk9MJJtIdjNFLqNZFPIseZz8fsojAOPIuL8tq47F3G_g" 
          className="w-full h-full object-cover opacity-20 grayscale brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <header className="fixed top-0 left-0 w-full z-10 flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-2">
            <ArrowLeft className="text-white" size={24} />
            <span className="font-lexend font-black text-2xl text-primary-fixed tracking-[0.2em] uppercase">Pulse_Fit</span>
        </div>
        <button className="text-neutral-400 font-bold text-sm hover:text-primary-fixed transition-colors">Skip</button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-card rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-lexend font-black uppercase tracking-tighter leading-none">Welcome Back</h1>
          <p className="text-neutral-400 text-sm font-semibold mt-3 uppercase tracking-widest">Unleash your peak potential today.</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Email address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-primary-fixed transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="name@domain.com"
                className="w-full bg-black/40 border-0 border-b-2 border-white/10 focus:border-primary-fixed focus:ring-0 text-sm font-bold py-4 pl-12 pr-4 transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Password</label>
              <a href="#" className="text-[10px] font-bold text-primary-fixed hover:underline">Forgot?</a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-primary-fixed transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-black/40 border-0 border-b-2 border-white/10 focus:border-primary-fixed focus:ring-0 text-sm font-bold py-4 pl-12 pr-20 transition-all"
              />
              <Eye className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
            </div>
          </div>

          <div className="pt-4 space-y-6">
            <button className="w-full bg-primary-fixed text-black font-lexend font-black text-xl py-4 rounded-xl shadow-[0_0_25px_rgba(204,242,0,0.3)] active:scale-95 transition-all uppercase tracking-widest">
                Login
            </button>
            <div className="flex items-center gap-4">
              <div className="h-px flex-grow bg-white/5" />
              <span className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.3em]">Or continue with</span>
              <div className="h-px flex-grow bg-white/5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 border border-white/5 py-3.5 rounded-xl hover:bg-white/5 transition-all active:scale-95">
                 <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuB2x1VGeiF3b20u0iRTm2l69Yy0rHmW8Gm4NtEhG_yeWh3kUHEjrGW0Wl-zGUzQZS5kUzkRWdirfGRh5py9PSOulKQ0VFjcWS0J9ZNziL4GKVswith6G40I881IX1yZ_nC4QfVK4I3tM_bpSoC2nGqzPK5cB0rdCXDuSq3dMhvI9qg_qvg-EO245nmesmDvY7vZVJh4tMgQjkhs40rvJpSi0h28BnZQ1SKDeNHLRfZLb2PY-ILbZyycxppaCUoONT_SmBdlMxaw" className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase">Google</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 border border-white/5 py-3.5 rounded-xl hover:bg-white/5 transition-all active:scale-95">
                 <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <div className="w-2 h-2 bg-black rounded-full" />
                 </div>
                 <span className="text-[10px] font-black uppercase">Apple</span>
              </button>
            </div>
          </div>
        </form>

        <p className="text-center mt-12 text-sm font-semibold text-neutral-500">
           New to the grit? <a href="#" className="text-primary-fixed ml-1 font-bold">Create account</a>
        </p>
      </motion.div>

      <div className="mt-12 w-full max-w-sm grid grid-cols-2 gap-3 relative z-10">
         <div className="glass-card p-4 rounded-2xl">
            <Bolt className="text-primary-fixed mb-2" size={16} />
            <p className="text-2xl font-lexend font-black">50k+</p>
            <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Active Athletes</p>
         </div>
         <div className="glass-card p-4 rounded-2xl">
            <BarChart3 className="text-primary-fixed mb-2" size={16} />
            <p className="text-2xl font-lexend font-black">99%</p>
            <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Accuracy Rate</p>
         </div>
      </div>

      <footer className="mt-12 text-center relative z-10">
         <p className="text-[8px] font-black text-neutral-800 uppercase tracking-[0.5em]">Pulse_Fit Ecosystem © 2026</p>
      </footer>
    </div>
  );
}
