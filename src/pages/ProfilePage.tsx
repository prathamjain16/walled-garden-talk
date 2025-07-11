import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  about: string | null;
  class: string | null;
  section: string | null;
  batch: string | null;
  hobby: string | null;
  website: string | null;
  social: string | null;
  email: string;
  is_admin: boolean;
  created_at: string;
}

const ProfilePage = () => {
  const { userId } = useParams();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileUser, setProfileUser] = useState<Profile | null>(null);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    about: '',
    class: '',
    section: '',
    batch: '',
    hobby: '',
    website: '',
    social: '',
    avatar: ''
  });

  const isOwnProfile = !userId || userId === user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfileUser(data);
        setProfileData({
          name: data.display_name || '',
          bio: data.bio || '',
          about: data.about || '',
          class: data.class || '',
          section: data.section || '',
          batch: data.batch || '',
          hobby: data.hobby || '',
          website: data.website || '',
          social: data.social || '',
          avatar: data.avatar_url || ''
        });
      }
    };

    fetchProfile();
  }, [userId, user?.id]);

  const handleSave = async () => {
    if (!isOwnProfile) return;
    
    try {
      await updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        about: profileData.about,
        class: profileData.class,
        section: profileData.section,
        batch: profileData.batch,
        hobby: profileData.hobby,
        website: profileData.website,
        social: profileData.social,
        avatar: profileData.avatar
      });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Refresh profile data
      if (profileUser) {
        setProfileUser({
          ...profileUser,
          display_name: profileData.name,
          bio: profileData.bio,
          about: profileData.about,
          class: profileData.class,
          section: profileData.section,
          batch: profileData.batch,
          hobby: profileData.hobby,
          website: profileData.website,
          social: profileData.social,
          avatar_url: profileData.avatar
        });
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profileUser) {
      setProfileData({
        name: profileUser.display_name || '',
        bio: profileUser.bio || '',
        about: profileUser.about || '',
        class: profileUser.class || '',
        section: profileUser.section || '',
        batch: profileUser.batch || '',
        hobby: profileUser.hobby || '',
        website: profileUser.website || '',
        social: profileUser.social || '',
        avatar: profileUser.avatar_url || ''
      });
    }
    setIsEditing(false);
  };

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="dark:bg-black">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="dark:bg-black">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {isOwnProfile ? 'Your Profile' : `${profileUser.display_name || 'User'}'s Profile`}
            </CardTitle>
            {isOwnProfile && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="text-center">
                 <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src={profileUser.avatar_url || undefined} alt={profileUser.display_name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {(profileUser.display_name || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      placeholder="https://example.com/avatar.jpg"
                      value={profileData.avatar}
                      onChange={(e) => setProfileData(prev => ({ ...prev, avatar: e.target.value }))}
                    />
                  </div>
                )}
                
                 {profileUser.is_admin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mt-4">
                    Administrator
                  </span>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div>
                <Label htmlFor="name" className="text-base font-semibold">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-lg">{profileUser.display_name || 'Unknown User'}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                <p className="mt-2 text-muted-foreground">{profileUser.email || 'Not available'}</p>
              </div>

              <div>
                <Label htmlFor="class" className="text-base font-semibold">Class</Label>
                {isEditing ? (
                  <Input
                    id="class"
                    placeholder="Enter your class"
                    value={profileData.class}
                    onChange={(e) => setProfileData(prev => ({ ...prev, class: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground">{profileUser.class || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="section" className="text-base font-semibold">Section</Label>
                {isEditing ? (
                  <Input
                    id="section"
                    placeholder="Enter your section"
                    value={profileData.section}
                    onChange={(e) => setProfileData(prev => ({ ...prev, section: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground">{profileUser.section || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="batch" className="text-base font-semibold">Batch</Label>
                {isEditing ? (
                  <Input
                    id="batch"
                    placeholder="Enter your batch"
                    value={profileData.batch}
                    onChange={(e) => setProfileData(prev => ({ ...prev, batch: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground">{profileUser.batch || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="hobby" className="text-base font-semibold">Hobby</Label>
                {isEditing ? (
                  <Input
                    id="hobby"
                    placeholder="Enter your hobby"
                    value={profileData.hobby}
                    onChange={(e) => setProfileData(prev => ({ ...prev, hobby: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground">{profileUser.hobby || 'Not specified'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website" className="text-base font-semibold">Website</Label>
                {isEditing ? (
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    {profileUser.website ? (
                      <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {profileUser.website}
                      </a>
                    ) : 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="social" className="text-base font-semibold">Social Media</Label>
                {isEditing ? (
                  <Input
                    id="social"
                    placeholder="@username or social media handle"
                    value={profileData.social}
                    onChange={(e) => setProfileData(prev => ({ ...prev, social: e.target.value }))}
                    className="mt-2"
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground">{profileUser.social || 'Not specified'}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="bio" className="text-base font-semibold">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    placeholder="A brief bio..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-2"
                    rows={3}
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {profileUser.bio || 'No bio available.'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="about" className="text-base font-semibold">About</Label>
                {isEditing ? (
                  <Textarea
                    id="about"
                    placeholder="Tell us more about yourself..."
                    value={profileData.about}
                    onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                    className="mt-2"
                    rows={4}
                  />
                ) : (
                  <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {profileUser.about || 'No additional information available.'}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-base font-semibold">Member Since</Label>
                <p className="mt-2 text-muted-foreground">
                  {new Date(profileUser.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;