
import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, MOCK_USERS } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Users, Search, Send, Menu, X } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  senderName: string;
  senderAvatar?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock initial community messages
  useEffect(() => {
    const mockMessages: Message[] = [{
      id: '1',
      senderId: '1',
      content: 'Welcome to our community chat! Feel free to introduce yourselves.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      senderName: 'Admin User',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    }, {
      id: '2',
      senderId: '2',
      content: 'Hi everyone! Excited to be part of this community.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      senderName: 'John Doe',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }, {
      id: '3',
      senderId: '3',
      content: 'Hello! Looking forward to connecting with everyone.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      senderName: 'Jane Smith',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c1?w=150&h=150&fit=crop&crop=face'
    }];
    setMessages(mockMessages);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      content: newMessage,
      timestamp: new Date(),
      senderName: user.name,
      senderAvatar: user.avatar
    };
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const otherUsers = MOCK_USERS.filter(u => u.id !== user?.id);
  const filteredUsers = otherUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-64px)] flex relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Mobile Header with Sidebar Toggle */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b bg-white">
          <h2 className="text-lg font-semibold">Community Chat</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
          {messages.map(message => {
            const isOwnMessage = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex space-x-2 max-w-[85%] sm:max-w-[75%] lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`rounded-lg p-3 ${isOwnMessage ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="text-xs font-medium mb-1">{message.senderName}</p>
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-purple-200' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="border-t p-3 lg:p-4 flex-shrink-0 bg-white">
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
        bg-gray-50 border-l border-gray-200
        flex-shrink-0
        z-50 lg:z-auto
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
              <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  {member.isAdmin && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                      Admin
                    </span>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                  <Link to={`/profile/${member.id}`}>
                    View
                  </Link>
                </Button>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && searchTerm && (
            <div className="text-center py-4">
              <p className="text-gray-500">No members found matching "{searchTerm}"</p>
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
