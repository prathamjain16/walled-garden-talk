import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProfileSetup = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.name || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatar || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName,
          bio: formData.bio,
          avatar_url: formData.avatarUrl || null
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local context
      await updateProfile({
        name: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatarUrl
      });

      toast({
        title: "Profile updated successfully!",
        description: "Welcome to the community.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Profile setup error:', error);
      toast({
        title: "Profile setup failed",
        description: error instanceof Error ? error.message : "Failed to set up profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            Let's set up your profile details
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Profile Setup</CardTitle>
            <CardDescription className="text-center">
              Tell us a bit about yourself (you can skip and update later)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="How should we call you?"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  type="url"
                  placeholder="https://example.com/your-photo.jpg"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSkip}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-purple-600 hover:bg-purple-700" 
                  disabled={isLoading}
                >
                  {isLoading ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;