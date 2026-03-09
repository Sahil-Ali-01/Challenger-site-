import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  Brain, 
  Database, 
  BarChart3,
  Settings,
  MoreVertical,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MOCK_QUESTIONS, Question } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('questions');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuestions = MOCK_QUESTIONS.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 space-y-10">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
            <p className="text-muted-foreground">Manage platform content, users, and global settings.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="glass-button h-11 px-5 font-bold">
               <Database className="mr-2 w-4 h-4" /> Export DB
             </Button>
             <Button className="h-11 px-6 font-bold shadow-lg shadow-primary/20">
               <Plus className="mr-2 w-4 h-4" /> Add Question
             </Button>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Questions', value: '1,245', icon: Brain, color: 'text-primary' },
            { label: 'Total Users', value: '12,840', icon: Users, color: 'text-blue-400' },
            { label: 'Active Today', value: '842', icon: BarChart3, color: 'text-green-400' },
            { label: 'Pending Reports', value: '12', icon: AlertCircle, color: 'text-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-6 rounded-2xl border-white/5 flex items-center gap-5">
              <div className="p-3 bg-white/5 rounded-xl">
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3 space-y-4">
             <div className="flex flex-col gap-1">
               {[
                 { id: 'questions', label: 'Questions', icon: Brain },
                 { id: 'categories', label: 'Categories', icon: Filter },
                 { id: 'users', label: 'User Management', icon: Users },
                 { id: 'leaderboard', label: 'Leaderboard Control', icon: BarChart3 },
                 { id: 'settings', label: 'Global Settings', icon: Settings },
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={cn(
                     "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all text-left",
                     activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                   )}
                 >
                   <tab.icon className="w-4 h-4" />
                   {tab.label}
                 </button>
               ))}
             </div>
          </div>

          {/* Main Table/List */}
          <div className="lg:col-span-9 space-y-6">
             {/* Content Filter/Search */}
             <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <input 
                     type="text" 
                     placeholder="Search questions or categories..." 
                     className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 focus:border-primary/50 outline-none text-sm font-medium"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
                <Button variant="outline" className="glass-button h-11 px-5 text-sm font-bold">
                   <Filter className="mr-2 w-4 h-4" /> Filter
                </Button>
             </div>

             {/* Questions List (Example) */}
             <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                   <div className="col-span-7">Question Details</div>
                   <div className="col-span-2 text-center">Category</div>
                   <div className="col-span-1 text-center">Stats</div>
                   <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-white/5">
                   {filteredQuestions.map((q) => (
                     <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors group">
                        <div className="col-span-7 space-y-2">
                           <h4 className="font-bold text-sm leading-relaxed group-hover:text-primary transition-colors line-clamp-2">
                             {q.question}
                           </h4>
                           <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3 text-green-500" /> Correct: {q.options[q.correctAnswer]}
                           </p>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                           <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
                             {q.category}
                           </Badge>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                           <div className="text-center">
                              <p className="text-xs font-bold tabular-nums">85%</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Pass</p>
                           </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                           <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                             <Edit3 className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg">
                             <MoreVertical className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-4 border-t border-white/5 flex justify-between items-center bg-white/5">
                   <p className="text-xs text-muted-foreground font-medium">Showing 10 of {MOCK_QUESTIONS.length} entries</p>
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled className="h-8 text-[10px] font-bold uppercase tracking-widest px-3 border-white/10 glass-button">Prev</Button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest px-3 border-white/10 glass-button">Next</Button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
