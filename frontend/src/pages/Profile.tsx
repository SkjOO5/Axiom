import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Camera, Check, Shield, Trash2, Mail, Bell, Key, FileText, BarChart2, Calendar, FileCheck, X, AlertTriangle, Eye, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  // All hooks must be declared unconditionally (Rules of Hooks)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    organization: user?.user_metadata?.organization || '',
    role: user?.user_metadata?.role || '',
    location: user?.user_metadata?.location || '',
    bio: user?.user_metadata?.bio || '',
  });

  const [savedToast, setSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [history, setHistory] = useState<any[]>([]);
  const [sortParam, setSortParam] = useState('newest');
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  useEffect(() => {
    const historyStr = localStorage.getItem('axiom_analysis_history');
    if (historyStr) {
      try {
        setHistory(JSON.parse(historyStr));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  // Guard after all hooks
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSort = (param: string) => {
    setSortParam(param);
    let sorted = [...history];
    if (param === 'newest') sorted.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (param === 'oldest') sorted.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (param === 'lowest_score') sorted.sort((a,b) => a.overallFairnessScore - b.overallFairnessScore);
    if (param === 'highest_risk') {
      const riskWeight: any = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
      sorted.sort((a,b) => riskWeight[b.riskLevel] - riskWeight[a.riskLevel]);
    }
    setHistory(sorted);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    const newHistory = history.filter(h => h.id !== deleteCandidate);
    setHistory(newHistory);
    localStorage.setItem('axiom_analysis_history', JSON.stringify(newHistory));
    setDeleteCandidate(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser(formData);
      setIsEditing(false);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch {
      // updateUser is local-only; errors are unlikely but guard anyway
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Navbar />

      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 pointer-events-none" />
      <div className="absolute top-3/4 -right-64 w-[600px] h-[600px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[128px] opacity-30 pointer-events-none" />

      {savedToast && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-3 rounded-full flex items-center gap-3 backdrop-blur-md shadow-2xl"
        >
          <Check size={18} />
          <span className="text-sm font-medium tracking-wide">Profile updated successfully</span>
        </motion.div>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-32 z-10 flex flex-col gap-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-muted/10 border border-border/50 p-8 rounded-2xl glass-card relative overflow-hidden"
        >
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div 
              className="w-32 h-32 rounded-full flex items-center justify-center font-bold text-4xl uppercase overflow-hidden border-4 border-background shadow-xl relative z-10"
              style={{ background: user.user_metadata?.avatar_url ? 'none' : 'var(--gradient-primary)' }}
            >
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white drop-shadow-md">{user.email.substring(0, 2)}</span>
              )}
            </div>
            <div className="absolute inset-0 z-20 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300">
              <Camera size={24} className="mb-1" />
              <span className="text-xs font-medium">Change Photo</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/jpeg, image/png, image/webp" 
              className="hidden" 
            />
          </div>

          <div className="flex-1 text-center md:text-left pt-2">
            <h1 className="text-3xl font-display font-medium text-foreground tracking-tight">
              {user.user_metadata?.full_name || 'Anonymous User'}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mt-2">
              <Mail size={16} />
              <span>{user.email}</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs flex items-center gap-1 border border-green-500/20 ml-2">
                <Shield size={12} /> Verified
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="pt-2">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-primary-foreground transition-transform duration-200 active:scale-[0.97] shadow-lg shadow-primary/20"
                style={{ background: 'var(--gradient-primary)' }}
              >
                Edit Profile
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 flex flex-col gap-8"
          >
            {/* Personal Information Card */}
            <div className="p-8 rounded-2xl bg-muted/10 border border-border glass-card relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500 rounded-t-2xl opacity-50" />
              <h2 className="text-xl font-display font-medium text-foreground mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm">01</span>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Not provided"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Organization</label>
                  <input 
                    type="text" 
                    value={formData.organization}
                    onChange={e => setFormData({...formData, organization: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Company or Institution"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Role / Job Title</label>
                  <input 
                    type="text" 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. Data Scientist"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Location</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="City, Country"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">Bio</label>
                  <textarea 
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border/50">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user?.user_metadata?.full_name || '',
                        phone: user?.user_metadata?.phone || '',
                        organization: user?.user_metadata?.organization || '',
                        role: user?.user_metadata?.role || '',
                        location: user?.user_metadata?.location || '',
                        bio: user?.user_metadata?.bio || '',
                      });
                    }}
                    className="px-6 py-2.5 rounded-full border border-border hover:bg-muted font-medium text-sm transition-colors text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-2.5 rounded-full font-semibold text-sm text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Analysis History */}
            <div className="p-8 rounded-2xl bg-muted/10 border border-border glass-card relative">
              <h2 className="text-xl font-display font-medium text-foreground mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">02</span>
                  Analysis History
                </div>
                {history.length > 0 && (
                  <div className="flex items-center gap-4 text-sm font-normal">
                    <span className="text-muted-foreground mr-2">Showing {history.length} analysis records</span>
                    <div className="relative group">
                      <select 
                        value={sortParam} 
                        onChange={(e) => handleSort(e.target.value)}
                        className="appearance-none bg-background border border-border rounded-md pl-3 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest_risk">Highest Risk First</option>
                        <option value="lowest_score">Lowest Score First</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-2 pointer-events-none text-muted-foreground" />
                    </div>
                  </div>
                )}
              </h2>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-background/50">
                  <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-4 text-muted-foreground">
                    <Shield size={20} />
                  </div>
                  <h3 className="text-foreground font-medium mb-2">No analyses yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    You haven't run any fairness audits or document checks yet. Head to the dashboard to get started.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/dashboard'}
                    className="px-6 py-2 rounded-full border border-primary/50 text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <div key={record.id} className="p-5 bg-background border border-border/80 hover:border-primary/50 transition-colors rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group">
                      
                      {/* Left section info */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl shrink-0">
                          {record.analysisType === 'Document Analysis' ? '📄' : '📊'}
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1">{record.fileName}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-muted/50 border border-border">{record.analysisType === 'Document Analysis' ? 'Document' : 'Dataset'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar size={12}/> {formatRelativeTime(record.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="flex items-center gap-1">
                              {record.status === 'Completed' ? <span className="text-green-400">✅ Completed</span> : <span className="text-red-400">❌ Failed</span>}
                            </span>
                            <span className="text-muted-foreground">
                              {record.totalIssuesFound} issues ({record.criticalIssues} critical)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right section badges & actions */}
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full md:w-auto">
                        
                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 pl-0 md:pl-4 w-full md:w-auto">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                               record.overallFairnessScore >= 80 ? 'bg-green-500/20 text-green-400' :
                               record.overallFairnessScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                               record.overallFairnessScore >= 40 ? 'bg-orange-500/20 text-orange-400' :
                               'bg-red-500/20 text-red-400'
                            }`}>
                              {record.overallFairnessScore?.toFixed(0)}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
                          </div>
                          
                          <div className="flex flex-col items-center min-w-[70px]">
                            <span className={`text-xs font-bold mb-1 ${
                               record.riskLevel === 'Low' ? 'text-green-400' :
                               record.riskLevel === 'Medium' ? 'text-yellow-400' :
                               record.riskLevel === 'High' ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              {record.riskLevel}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk</span>
                          </div>
                        </div>

                        <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                          <button 
                            onClick={() => navigate('/dashboard', { state: { viewRecordId: record.id } })}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md text-xs font-medium transition"
                          >
                            <Eye size={14}/> View Results
                          </button>
                          <button 
                            onClick={() => setDeleteCandidate(record.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/10 hover:border-red-500/20 rounded-md text-xs font-medium transition"
                          >
                            <Trash2 size={14}/> Delete
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                  
                  {history.length > 10 && (
                     <div className="text-center pt-2">
                       <button className="text-xs text-muted-foreground hover:text-foreground">Load More...</button>
                     </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            {/* Account Settings */}
            <div className="p-6 rounded-2xl bg-muted/10 border border-border glass-card">
              <h2 className="text-lg font-display font-medium text-foreground mb-6">Account Settings</h2>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Key size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    Change Password
                  </div>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Bell size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    Email Notifications
                  </div>
                  <div className="w-10 h-5 rounded-full bg-primary relative flex items-center border border-primary/50">
                    <div className="w-4 h-4 rounded-full bg-white absolute right-0.5 shadow-sm" />
                  </div>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
              <h2 className="text-lg font-display font-medium text-red-500 mb-2 flex items-center gap-2">
                <Trash2 size={18} /> Danger Zone
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button className="w-full px-4 py-3 rounded-xl border border-red-500/30 text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-all">
                Delete Account
              </button>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border/80 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden glass-card"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-center text-white mb-2">Delete Analysis Record?</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Are you sure you want to delete this analysis record? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteCandidate(null)}
                    className="flex-1 px-4 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
