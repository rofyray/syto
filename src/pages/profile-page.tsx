import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/app-layout";
import { User, Mail, Calendar, GraduationCap, Edit, Save, X, BookOpen, CheckCircle, Target, LogOut, Trophy } from "lucide-react";
import { getUserProgressByUserId } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const { user, profile, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats state
  const [stats, setStats] = useState({
    examsOwned: 0,
    attempts: 0,
    completed: 0,
    avgScore: 0
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    grade_level: 4
  });

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const progress = await getUserProgressByUserId(user.id);
        const completed = progress.filter(p => p.completed).length;
        const attempts = progress.length;
        const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
        const avgScore = attempts > 0 ? Math.round((totalScore / attempts) * 100) / 100 : 0;

        setStats({
          examsOwned: 0, // This would need to be calculated from student_modules table
          attempts,
          completed,
          avgScore
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  // Initialize form when entering edit mode
  const handleEditClick = () => {
    if (profile) {
      setEditForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        grade_level: profile.grade_level
      });
    }
    setIsEditing(true);
    setMessage(null);
  };

  // Cancel editing and reset form
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      first_name: "",
      last_name: "",
      grade_level: 4
    });
    setMessage(null);
  };

  // Save profile changes
  const handleSaveChanges = async () => {
    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required' });
      return;
    }

    if (![4, 5, 6].includes(editForm.grade_level)) {
      setMessage({ type: 'error', text: 'Please select a valid grade level' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      await updateProfile({
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        grade_level: editForm.grade_level
      });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading your profile...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green mx-auto"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppLayout>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-ghana-green/5 via-ghana-gold/5 to-ghana-red/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-ghana-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-ghana-green/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
                      Welcome, {profile?.first_name}
                    </h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-xl bg-error-100 dark:bg-error-900/30 hover:bg-error-200 dark:hover:bg-error-800/40 text-error-700 dark:text-error-400 border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Exams Owned */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-lg transition-all duration-300 animate-scale-in">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-600/20">
                    <GraduationCap className="h-6 w-6 text-primary-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Exams Owned</p>
                  <p className="text-3xl font-bold">{stats.examsOwned}</p>
                </div>
              </div>

              {/* Attempts */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-warning-400/20 to-warning-600/20">
                    <Trophy className="h-6 w-6 text-warning-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Attempts</p>
                  <p className="text-3xl font-bold">{stats.attempts}</p>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-success-400/20 to-success-600/20">
                    <CheckCircle className="h-6 w-6 text-success-500" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
              </div>

              {/* Avg. Score */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-ghana-gold/20 to-ghana-gold-dark/20">
                    <Target className="h-6 w-6 text-ghana-gold-dark" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Score</p>
                  <p className="text-3xl font-bold">{stats.avgScore}%</p>
                </div>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm ${
                message.type === 'success'
                  ? 'bg-success-100/80 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-400'
                  : 'bg-error-100/80 dark:bg-error-900/30 border border-error-200 dark:border-error-800 text-error-800 dark:text-error-400'
              } animate-slide-up`}>
                {message.text}
              </div>
            )}

            {/* Account Details Card */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-success-500 bg-clip-text text-transparent mb-2">
                  Account Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditing ? "Edit your account details" : "Your account details and preferences"}
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    {isEditing ? (
                      <input
                        className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
                        value={editForm.first_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.first_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    {isEditing ? (
                      <input
                        className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
                        value={editForm.last_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.last_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                  <div className="flex items-center gap-2 p-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                    {!isEditing && (
                      <span className="ml-auto text-xs text-muted-foreground">Cannot be changed</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Grade Level</label>
                  {isEditing ? (
                    <select
                      className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all cursor-pointer"
                      value={editForm.grade_level}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm(prev => ({ ...prev, grade_level: parseInt(e.target.value) }))}
                    >
                      <option value={4}>Primary 4</option>
                      <option value={5}>Primary 5</option>
                      <option value={6}>Primary 6</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>Primary {profile.grade_level}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <div className="flex items-center gap-2 p-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={isLoading}
                      size="lg"
                      className="flex items-center gap-2 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Save className="h-4 w-4" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      size="lg"
                      className="flex items-center gap-2 rounded-xl"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleEditClick}
                    size="lg"
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
