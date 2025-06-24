
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Article, AdminStats } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Users, FileText, MessageSquare, BarChart3, Plus, Edit, Trash2, Settings } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newArticle, setNewArticle] = useState({ title: '', content: '', category: '', readTime: '' });

  // Mock data for demonstration
  const adminStats: AdminStats = {
    totalUsers: 1250,
    activeUsers: 890,
    totalArticles: 45,
    totalChatMessages: 5670
  };

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      periodLength: 5,
      cycleLength: 28,
      lastPeriodDate: '2024-06-01',
      createdAt: '2024-05-01',
      isAdmin: false
    },
    {
      id: '2',
      name: 'Emma Wilson',
      email: 'emma@email.com',
      periodLength: 4,
      cycleLength: 30,
      lastPeriodDate: '2024-06-05',
      createdAt: '2024-04-15',
      isAdmin: false
    }
  ];

  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'Understanding Your Menstrual Cycle',
      content: 'Complete guide to menstrual cycles...',
      category: 'Education',
      readTime: '5 min read',
      isPublished: true,
      createdAt: '2024-06-01'
    },
    {
      id: '2',
      title: 'Managing Period Pain',
      content: 'Tips for dealing with menstrual cramps...',
      category: 'Health',
      readTime: '3 min read',
      isPublished: false,
      createdAt: '2024-06-02'
    }
  ];

  const handleCreateArticle = () => {
    if (newArticle.title && newArticle.content) {
      console.log('Creating article:', newArticle);
      setNewArticle({ title: '', content: '', category: '', readTime: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ←
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">FloMentor Administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Admin User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Articles</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalArticles}</div>
                  <p className="text-xs text-muted-foreground">+3 this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{adminStats.totalChatMessages}</div>
                  <p className="text-xs text-muted-foreground">+15% from last week</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">New user registration: Emma Wilson</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Article published: "Understanding Your Cycle"</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">235 new chat interactions today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Content Management</CardTitle>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Article title"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    />
                    <Input
                      placeholder="Category"
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Read time (e.g., 5 min read)"
                    value={newArticle.readTime}
                    onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                  />
                  <textarea
                    className="w-full p-3 border rounded-md"
                    rows={4}
                    placeholder="Article content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  />
                  <Button onClick={handleCreateArticle}>Create Article</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>{article.title}</TableCell>
                        <TableCell>{article.category}</TableCell>
                        <TableCell>
                          <Badge variant={article.isPublished ? "default" : "secondary"}>
                            {article.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>{article.createdAt && new Date(article.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">User Engagement</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Daily Active Users</span>
                        <span className="font-medium">423</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Session Duration</span>
                        <span className="font-medium">8.5 min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Retention Rate (7-day)</span>
                        <span className="font-medium">78%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Content Performance</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Most Read Article</span>
                        <span className="font-medium">Cycle Basics</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Read Time</span>
                        <span className="font-medium">4.2 min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Article Completion Rate</span>
                        <span className="font-medium">65%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
