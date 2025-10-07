'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Send,
  MapPin,
  Calendar,
  ThumbsUp,
  Eye,
  Star,
  MessageSquare,
  UserCheck,
  UserX,
  Bell,
  Settings,
  BookOpen,
  Award,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NetworkPost {
  _id: string
  userId: string
  userName: string
  userAvatar?: string
  userTitle?: string
  type: 'job_opportunity' | 'career_advice' | 'success_story' | 'question' | 'general'
  title?: string
  content: string
  tags?: string[]
  attachments?: Array<{
    type: 'image' | 'document' | 'link'
    url: string
    name: string
  }>
  likes: string[]
  comments: Array<{
    userId: string
    userName: string
    content: string
    createdAt: Date
  }>
  shares: number
  createdAt: Date
  updatedAt: Date
  visibility: 'public' | 'connections' | 'private'
}

interface NetworkUser {
  id: string
  name: string
  title?: string
  avatar?: string
  location?: string
  skills?: string[]
  experience?: string
  connections: number
  mutualConnections: number
  isOnline?: boolean
  lastActive?: Date
}

interface Connection {
  _id: string
  userId: string
  connectedUserId: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  initiatedBy: string
  createdAt: Date
  acceptedAt?: Date
  message?: string
  user?: NetworkUser
}

interface NetworkDashboardProps {
  userId: string
}

export function NetworkDashboard({ userId }: NetworkDashboardProps) {
  const [activeTab, setActiveTab] = useState('feed')
  const [posts, setPosts] = useState<NetworkPost[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [suggestions, setSuggestions] = useState<NetworkUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Messaging state
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedConversationUser, setSelectedConversationUser] = useState<NetworkUser | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showConnectionRequests, setShowConnectionRequests] = useState(false)

  // Create post state
  const [newPost, setNewPost] = useState({
    type: 'general' as NetworkPost['type'],
    title: '',
    content: '',
    tags: [] as string[],
    visibility: 'public' as NetworkPost['visibility']
  })

  // Load initial data
  useEffect(() => {
    loadFeed()
    loadConnections()
  }, [])

  const loadFeed = async () => {
    try {
      const response = await fetch('/api/network/feed')
      const data = await response.json()
      if (data.success) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to load feed:', error)
      toast.error('Failed to load network feed')
    }
  }

  const loadConnections = async () => {
    try {
      // Load accepted connections
      const connectionsResponse = await fetch('/api/network/connections')
      const connectionsData = await connectionsResponse.json()

      // Load suggestions
      const suggestionsResponse = await fetch('/api/network/connections?type=suggestions')
      const suggestionsData = await suggestionsResponse.json()

      if (connectionsData.success) {
        setConnections(connectionsData.connections)
      }

      if (suggestionsData.success) {
        setSuggestions(suggestionsData.connections)
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      toast.error('Please enter some content for your post')
      return
    }

    try {
      const response = await fetch('/api/network/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      })

      const data = await response.json()
      if (data.success) {
        setPosts(prev => [data.post, ...prev])
        setNewPost({
          type: 'general',
          title: '',
          content: '',
          tags: [],
          visibility: 'public'
        })
        setShowCreatePost(false)
        toast.success('Post created successfully!')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
    }
  }

  const handleLikePost = async (postId: string) => {
    // Mock like functionality
    setPosts(prev => prev.map(post =>
      post._id === postId
        ? {
            ...post,
            likes: post.likes.includes(userId)
              ? post.likes.filter(id => id !== userId)
              : [...post.likes, userId]
          }
        : post
    ))
  }

  const handleAddComment = (postId: string, comment: string) => {
    if (!comment.trim()) return

    const newComment = {
      userId,
      userName: 'You', // In real app, get from user session
      content: comment,
      createdAt: new Date()
    }

    setPosts(prev => prev.map(post =>
      post._id === postId
        ? { ...post, comments: [...post.comments, newComment] }
        : post
    ))
  }

  const handleConnect = async (targetUserId: string, message?: string) => {
    try {
      const response = await fetch('/api/network/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          targetUserId,
          message
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Connection request sent!')
        // Remove from suggestions and add to pending connections
        setSuggestions(prev => prev.filter(user => user.id !== targetUserId))
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to send connection request:', error)
      toast.error('Failed to send connection request')
    }
  }

  const handleConnectionAction = async (action: 'accept' | 'decline', targetUserId: string) => {
    try {
      const response = await fetch('/api/network/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          targetUserId
        }),
      })

      const data = await response.json()
      if (data.success) {
        if (action === 'accept') {
          setConnections(prev => prev.map(conn =>
            conn.userId === targetUserId && conn.connectedUserId === userId
              ? { ...conn, status: 'accepted', acceptedAt: new Date() }
              : conn
          ))
          toast.success('Connection accepted!')
        } else {
          setConnections(prev => prev.filter(conn =>
            !(conn.userId === targetUserId && conn.connectedUserId === userId)
          ))
          toast.success('Connection request declined')
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} connection:`, error)
      toast.error(`Failed to ${action} connection`)
    }
  }

  const loadMessages = async (otherUserId: string) => {
    try {
      const response = await fetch(`/api/network/messages?otherUserId=${otherUserId}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/network/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage.trim()
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }

  const getPostTypeIcon = (type: NetworkPost['type']) => {
    switch (type) {
      case 'job_opportunity': return <Briefcase className="w-4 h-4" />
      case 'career_advice': return <BookOpen className="w-4 h-4" />
      case 'success_story': return <Award className="w-4 h-4" />
      case 'question': return <MessageSquare className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getPostTypeColor = (type: NetworkPost['type']) => {
    switch (type) {
      case 'job_opportunity': return 'bg-blue-100 text-blue-800'
      case 'career_advice': return 'bg-green-100 text-green-800'
      case 'success_story': return 'bg-purple-100 text-purple-800'
      case 'question': return 'bg-orange-100 text-orange-800'
      default: return 'bg-muted text-foreground'
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === 'all' || post.type === filterType

    return matchesSearch && matchesType
  })

  const pendingRequests = connections.filter(conn => conn.status === 'pending' && conn.initiatedBy !== userId)

  if (isLoading) {
    return <div>Loading network...</div>
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connections</p>
                <p className="text-2xl font-bold">{connections.filter(c => c.status === 'accepted').length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Network Posts</p>
                <p className="text-2xl font-bold">{posts.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Network Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-6">
          {/* Create Post */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Share your thoughts, ask a question, or post a job opportunity...
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search posts, people, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts</SelectItem>
                    <SelectItem value="job_opportunity">Job Opportunities</SelectItem>
                    <SelectItem value="career_advice">Career Advice</SelectItem>
                    <SelectItem value="success_story">Success Stories</SelectItem>
                    <SelectItem value="question">Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <Card key={post._id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.userAvatar} />
                      <AvatarFallback>{post.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{post.userName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {post.userTitle}
                        </Badge>
                        <Badge className={`text-xs ${getPostTypeColor(post.type)}`}>
                          {getPostTypeIcon(post.type)}
                          <span className="ml-1 capitalize">{post.type.replace('_', ' ')}</span>
                        </Badge>
                      </div>

                      {post.title && (
                        <h4 className="font-medium mb-2">{post.title}</h4>
                      )}

                      <p className="text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleLikePost(post._id)}
                            className={`flex items-center gap-1 hover:text-red-500 ${
                              post.likes.includes(userId) ? 'text-red-500' : ''
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes.length}
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-500">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments.length}
                          </button>
                          <button className="flex items-center gap-1 hover:text-green-500">
                            <Share2 className="w-4 h-4" />
                            {post.shares}
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {post.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {post.comments.slice(0, 3).map((comment, index) => (
                            <div key={index} className="flex gap-3 p-3 bg-background rounded-lg">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {comment.userName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.userName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">{comment.content}</p>
                              </div>
                            </div>
                          ))}

                          {post.comments.length > 3 && (
                            <button className="text-sm text-blue-600 hover:underline">
                              View all {post.comments.length} comments
                            </button>
                          )}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="mt-3 flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">Y</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Write a comment..."
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post._id, (e.target as HTMLInputElement).value)
                                ;(e.target as HTMLInputElement).value = ''
                              }
                            }}
                          />
                          <Button size="sm" variant="outline">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connection Requests */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Connection Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No pending requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarImage src={request.user?.avatar} />
                          <AvatarFallback>{request.user?.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{request.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{request.user?.title}</p>
                          {request.message && (
                            <p className="text-xs text-muted-foreground mt-1">"{request.message}"</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConnectionAction('accept', request.userId)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnectionAction('decline', request.userId)}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Connections */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>My Network</CardTitle>
                <CardDescription>
                  {connections.filter(c => c.status === 'accepted').length} connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections
                    .filter(conn => conn.status === 'accepted')
                    .map((connection) => (
                      <div key={connection.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarImage src={connection.user?.avatar} />
                          <AvatarFallback>{connection.user?.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{connection.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{connection.user?.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{connection.user?.location}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>People You May Know</CardTitle>
              <CardDescription>
                Expand your network with relevant connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((person) => (
                  <Card key={person.id}>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-4">
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback>{person.name[0]}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold mb-1">{person.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{person.title}</p>
                        <div className="text-xs text-muted-foreground mb-4">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MapPin className="w-3 h-3" />
                            {person.location}
                          </div>
                          <div>{person.mutualConnections} mutual connections</div>
                        </div>

                        {person.skills && person.skills.length > 0 && (
                          <div className="flex flex-wrap justify-center gap-1 mb-4">
                            {person.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={() => handleConnect(person.id)}
                          className="w-full"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {connections
                    .filter(conn => conn.status === 'accepted')
                    .slice(0, 10)
                    .map((connection) => (
                      <div
                        key={connection._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-background cursor-pointer border"
                        onClick={() => {
                          if (connection.user) {
                            setSelectedConversation(connection.user.id)
                            setSelectedConversationUser(connection.user)
                            loadMessages(connection.user.id)
                          }
                        }}
                      >
                        <Avatar>
                          <AvatarImage src={connection.user?.avatar} />
                          <AvatarFallback>{connection.user?.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{connection.user?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground truncate">{connection.user?.title || 'Job Seeker'}</p>
                        </div>
                        {connection.user?.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Messages View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedConversationUser ? selectedConversationUser.name : 'Select a conversation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="flex flex-col h-96">
                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex gap-3 ${
                            message.isFromCurrentUser ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {!message.isFromCurrentUser && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.isFromCurrentUser
                                ? 'bg-blue-500 text-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.isFromCurrentUser ? 'text-blue-100' : 'text-muted-foreground'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {message.isFromCurrentUser && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>You</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, ask questions, or post opportunities with your network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Post Type</label>
              <Select
                value={newPost.type}
                onValueChange={(value: NetworkPost['type']) =>
                  setNewPost(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Post</SelectItem>
                  <SelectItem value="job_opportunity">Job Opportunity</SelectItem>
                  <SelectItem value="career_advice">Career Advice</SelectItem>
                  <SelectItem value="success_story">Success Story</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newPost.type === 'job_opportunity' || newPost.type === 'career_advice' ||
              newPost.type === 'success_story' || newPost.type === 'question') && (
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your post a title..."
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What's on your mind?"
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags (optional)</label>
              <Input
                value={newPost.tags.join(', ')}
                onChange={(e) => setNewPost(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                }))}
                placeholder="e.g., javascript, react, career-advice"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Visibility</label>
              <Select
                value={newPost.visibility}
                onValueChange={(value: NetworkPost['visibility']) =>
                  setNewPost(prev => ({ ...prev, visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="connections">Connections Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleCreatePost} className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

