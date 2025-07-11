import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, Search, Send, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Helper function to detect and linkify URLs in text
const linkifyText = (text: string) => {
  // More comprehensive URL regex that includes www domains
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Add protocol if missing
      const url = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  email: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for sidebar toggle events from navbar
  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen(true);
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
  }, []);

  // Fetch messages and profiles
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch messages and profiles separately  
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, user_id, content, created_at')
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      // Fetch profiles and merge with messages
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url');

      if (allProfilesError) {
        console.error('Error fetching profiles for messages:', allProfilesError);
        return;
      }

      // Create a map for easy lookup
      const profileMap = new Map(allProfiles?.map(p => [p.user_id, p]) || []);
      
      // Merge messages with profile data
      const messagesWithProfiles = messagesData?.map(msg => ({
        ...msg,
        profiles: profileMap.get(msg.user_id) || null
      })) || [];

      setMessages(messagesWithProfiles);

      // Fetch all profiles for the sidebar
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else {
        setProfiles(profilesData || []);
      }
    };

    fetchData();

    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('New message received:', payload);
          // Fetch the new message 
          const { data: newMessageData } = await supabase
            .from('messages')
            .select('id, user_id, content, created_at')
            .eq('id', payload.new.id)
            .single();

          if (newMessageData) {
            // Get profile for this user
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url')
              .eq('user_id', newMessageData.user_id)
              .single();

            const messageWithProfile = {
              ...newMessageData,
              profiles: profile || null
            };

            setMessages(prev => [...prev, messageWithProfile]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        content: newMessage
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter to show only other users (not current user) and exclude any null/undefined profiles
  const otherProfiles = profiles.filter(p => 
    p.user_id !== user?.id && 
    p.display_name && 
    p.user_id
  );
  
  const filteredUsers = otherProfiles.filter(p => 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-64px)] flex relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
          {messages.map(message => {
            const isOwnMessage = message.user_id === user?.id;
            const senderName = message.profiles?.display_name || 'Unknown User';
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex space-x-2 max-w-[85%] sm:max-w-[75%] lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.profiles?.avatar_url || undefined} alt={senderName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg p-3 ${isOwnMessage ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'}`}>
                    <p className="text-xs font-medium mb-1">{senderName}</p>
                    <div className="text-sm break-words">{linkifyText(message.content)}</div>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="border-t p-3 lg:p-4 flex-shrink-0 bg-background">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input 
              placeholder="Type your message..." 
              value={newMessage} 
              onChange={e => setNewMessage(e.target.value)} 
              className="flex-1" 
            />
            <Button type="submit" size="sm" disabled={!newMessage.trim()} className="flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0
        transition-transform duration-300 ease-in-out
        fixed lg:relative
        top-0 lg:top-auto
        right-0
        h-full lg:h-auto
        w-full sm:w-80 lg:w-80
        bg-background dark:bg-black border-l border-border
        flex-shrink-0
        z-50 lg:z-auto
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              Community Members
            </h3>
            <Button
              variant="ghost" 
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search members..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </div>
        
        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredUsers.map(member => (
              <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent dark:hover:bg-gray-800">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.avatar_url || undefined} alt={member.display_name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(member.display_name || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.display_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  {member.is_admin && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                      Admin
                    </span>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                  <Link to={`/profile/${member.user_id}`}>
                    View
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && searchTerm && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No members found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;