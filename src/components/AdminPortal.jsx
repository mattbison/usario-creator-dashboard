import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Users, Building2, UserPlus, Download, Calendar, TrendingUp, Eye, Heart, Instagram } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const AdminPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAssignClientOpen, setIsAssignClientOpen] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'va', full_name: '' });
  const [newClient, setNewClient] = useState({ name: '', description: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const [usersRes, clientsRes, influencersRes, submissionsRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getClients(),
        apiService.getInfluencers(),
        apiService.getSubmissions()
      ]);
      
      setUsers(usersRes.users);
      setClients(clientsRes.clients);
      setInfluencers(influencersRes.influencers);
      setSubmissions(submissionsRes.submissions);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await apiService.createUser(newUser);
      setNewUser({ email: '', password: '', role: 'va', full_name: '' });
      setIsAddUserOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleAddClient = async () => {
    try {
      await apiService.createClient(newClient);
      setNewClient({ name: '', description: '' });
      setIsAddClientOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleAssignClient = async () => {
    try {
      await apiService.assignUserToClient(selectedUserId, selectedClientId);
      setSelectedUserId('');
      setSelectedClientId('');
      setIsAssignClientOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error assigning client:', error);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Instagram Handle', 'Instagram Followers', 'TikTok Handle', 'TikTok Followers', 'Average Views', 'Engagement Rate', 'Client', 'Date Added'],
      ...influencers.map(inf => [
        inf.name,
        inf.business_email,
        inf.instagram_handle,
        inf.instagram_followers,
        inf.tiktok_handle,
        inf.tiktok_followers,
        inf.average_views,
        inf.engagement_rate,
        getClientName(inf.client_id),
        inf.date_added
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'influencers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalVAs: users.filter(u => u.role === 'va').length,
      totalClients: clients.length,
      totalInfluencers: influencers.length,
      newInfluencersToday: influencers.filter(inf => inf.date_added === today).length,
      totalSubmissions: submissions.length,
      avgFollowers: influencers.length > 0 ? Math.round(influencers.reduce((sum, inf) => sum + (inf.instagram_followers || 0), 0) / influencers.length) : 0
    };
  };

  const getClientStats = () => {
    return clients.map(client => {
      const clientInfluencers = influencers.filter(inf => inf.client_id === client.id);
      return {
        name: client.name,
        influencers: clientInfluencers.length,
        avgFollowers: clientInfluencers.length > 0 ? Math.round(clientInfluencers.reduce((sum, inf) => sum + (inf.instagram_followers || 0), 0) / clientInfluencers.length) : 0
      };
    });
  };

  const getRecentActivity = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = influencers.filter(inf => inf.date_added === dateStr).length;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        influencers: count
      });
    }
    return last7Days;
  };

  const getFollowerDistribution = () => {
    const ranges = [
      { name: '0-10K', min: 0, max: 10000, count: 0, color: '#8884d8' },
      { name: '10K-50K', min: 10000, max: 50000, count: 0, color: '#82ca9d' },
      { name: '50K-100K', min: 50000, max: 100000, count: 0, color: '#ffc658' },
      { name: '100K-500K', min: 100000, max: 500000, count: 0, color: '#ff7300' },
      { name: '500K+', min: 500000, max: Infinity, count: 0, color: '#8dd1e1' }
    ];

    influencers.forEach(inf => {
      const followers = inf.instagram_followers || 0;
      const range = ranges.find(r => followers >= r.min && followers < r.max);
      if (range) range.count++;
    });

    return ranges.filter(r => r.count > 0);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getVaName = (vaId) => {
    const va = users.find(u => u.id === vaId);
    return va ? va.full_name || va.email : 'Unknown VA';
  };

  const stats = getStats();
  const clientStats = getClientStats();
  const recentActivity = getRecentActivity();
  const followerDistribution = getFollowerDistribution();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Manage users, clients, and view analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-50 p-1 m-6 mb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vas">Manage VAs</TabsTrigger>
            <TabsTrigger value="clients">Manage Clients</TabsTrigger>
            <TabsTrigger value="influencers">All Influencers</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total VAs</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalVAs}</div>
                    <p className="text-xs text-muted-foreground">Active virtual assistants</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClients}</div>
                    <p className="text-xs text-muted-foreground">Active clients</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.newInfluencersToday} added today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Followers</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgFollowers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Instagram average</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Influencers added in the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={recentActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="influencers" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Follower Distribution</CardTitle>
                    <CardDescription>Instagram followers by range</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {followerDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={followerDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {followerDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Client Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Performance</CardTitle>
                  <CardDescription>Influencers and average followers by client</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="influencers" fill="#8884d8" name="Influencers" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vas" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Virtual Assistants</h3>
                  <p className="text-gray-600">Manage VA accounts and client assignments</p>
                </div>
                <div className="space-x-2">
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add VA
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New VA</DialogTitle>
                        <DialogDescription>Create a new virtual assistant account</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            placeholder="va@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={newUser.full_name}
                            onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            placeholder="Enter password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Role</Label>
                          <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="va">VA</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser}>Add VA</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isAssignClientOpen} onOpenChange={setIsAssignClientOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Assign Client</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Client to VA</DialogTitle>
                        <DialogDescription>Give a VA access to a specific client</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Select VA</Label>
                          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a VA" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.filter(u => u.role === 'va').map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.full_name || user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Select Client</Label>
                          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignClientOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignClient}>Assign</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid gap-4">
                {users.filter(u => u.role === 'va').map(user => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{user.full_name || user.email}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <Badge variant="secondary" className="mt-2">{user.role.toUpperCase()}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Clients</h3>
                  <p className="text-gray-600">Manage client accounts and information</p>
                </div>
                <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Building2 className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                      <DialogDescription>Create a new client account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="clientName">Client Name</Label>
                        <Input
                          id="clientName"
                          value={newClient.name}
                          onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientDescription">Description</Label>
                        <Input
                          id="clientDescription"
                          value={newClient.description}
                          onChange={(e) => setNewClient({...newClient, description: e.target.value})}
                          placeholder="Brief description of the client"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddClient}>Add Client</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {clients.map(client => {
                  const clientInfluencers = influencers.filter(inf => inf.client_id === client.id);
                  return (
                    <Card key={client.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{client.name}</h4>
                            <p className="text-sm text-gray-600">{client.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline">
                                {clientInfluencers.length} influencers
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              Created: {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="influencers" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">All Influencers</h3>
                  <p className="text-gray-600">View and export all influencer data</p>
                </div>
                <Button onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              <div className="grid gap-4">
                {influencers.map(influencer => (
                  <Card key={influencer.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{influencer.name}</h4>
                          <p className="text-sm text-gray-600">{influencer.business_email}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Instagram className="h-4 w-4" />
                              <span>{(influencer.instagram_followers || 0).toLocaleString()} followers</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{(influencer.average_views || 0).toLocaleString()} avg views</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{influencer.engagement_rate || 0}% engagement</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline">{getClientName(influencer.client_id)}</Badge>
                            <Badge variant="secondary">
                              Added: {new Date(influencer.date_added).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Submissions</h3>
                <p className="text-gray-600">View all influencer submissions by VAs</p>
              </div>

              <div className="grid gap-4">
                {submissions.map(submission => {
                  const submissionInfluencers = influencers.filter(inf => inf.submission_id === submission.id);
                  return (
                    <Card key={submission.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Submission #{submission.id}</h4>
                            <p className="text-sm text-gray-600">
                              By: {getVaName(submission.submitted_by)}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge variant="outline">
                                {submissionInfluencers.length} influencers
                              </Badge>
                              <span className="text-sm text-gray-500 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(submission.submission_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">Submitted</Badge>
                        </div>
                        
                        {submissionInfluencers.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium mb-2">Influencers in this submission:</h5>
                            <div className="space-y-2">
                              {submissionInfluencers.slice(0, 3).map(inf => (
                                <div key={inf.id} className="flex items-center justify-between text-sm">
                                  <span>{inf.name} - {getClientName(inf.client_id)}</span>
                                  <span className="text-gray-500">
                                    {(inf.instagram_followers || 0).toLocaleString()} followers
                                  </span>
                                </div>
                              ))}
                              {submissionInfluencers.length > 3 && (
                                <p className="text-sm text-gray-500">
                                  +{submissionInfluencers.length - 3} more influencers
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;
