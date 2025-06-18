import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import { User, Mail, Calendar, GraduationCap, Edit, Save, X } from "lucide-react";

export function ProfilePage() {
  const { user, profile, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    grade_level: 4
  });

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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>
          
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                {isEditing ? "Edit your account details" : "Your account details and preferences"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">First Name</label>
                  {isEditing ? (
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={editForm.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.first_name}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                  {isEditing ? (
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={editForm.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.last_name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editForm.grade_level}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditForm(prev => ({ ...prev, grade_level: parseInt(e.target.value) }))}
                  >
                    <option value={4}>Primary 4</option>
                    <option value={5}>Primary 5</option>
                    <option value={6}>Primary 6</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Primary {profile.grade_level}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex justify-center gap-4">
            {isEditing ? (
              <>
                <Button 
                  variant="ghana" 
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="ghana" 
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
