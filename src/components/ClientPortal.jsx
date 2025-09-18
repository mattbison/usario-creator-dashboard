import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Building2, Users, Instagram, TrendingUp, Eye, Heart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const ClientPortal = () => {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [userClients, setUserClients] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load clients
      const clientsResponse = await apiService.getClients();
      setClients(clientsResponse.clients);
      
      // Load user's assigned clients
      if (user) {
        const userClientsResponse = await apiService.getUserClients(user.id);
        setUserClients(userClientsResponse.clients);
        
        // Set first client as default if available
        if (userClientsResponse.clients.length > 0) {
          setSelectedClient(userClientsResponse.clients[0].id.toString());
        }
      }
      
      // Load influencers
      const influencersResponse = await apiService.getInfluencers();
      setInfluencers(influencersResponse.influencers);
      
      // Load submissions
      const submissionsResponse = await apiService.getSubmissions();
      setSubmissions(submissionsResponse.submissions);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientInfluencers = () => {
    if (!selectedClient) return [];
    return influencers.filter(inf => inf.client_id.toString() === selectedClient);
  };

  const getClientStats = () => {
    const clientInfluencers = getClientInfluencers();
    
    if (clientInfluencers.length === 0) {
      return {
        totalInfluencers: 0,
        avgInstagramFollowers: 0,
        avgTikTokFollowers: 0,
        avgViews: 0,
        avgEngagement: 0,
        newToday: 0
      };
    }

    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalInfluencers: clientInfluencers.length,
      avgInstagramFollowers: Math.round(clientInfluencers.reduce((sum, inf) => sum + (inf.instagram_followers || 0), 0) / clientInfluencers.length),
      avgTikTokFollowers: Math.round(clientInfluencers.reduce((sum, inf) => sum + (inf.tiktok_followers || 0), 0) / clientInfluencers.length),
      avgViews: Math.round(clientInfluencers.reduce((sum, inf) => sum + (inf.average_views || 0), 0) / clientInfluencers.length),
      avgEngagement: (clientInfluencers.reduce((sum, inf) => sum + (inf.engagement_rate || 0), 0) / clientInfluencers.length).toFixed(2),
      newToday: clientInfluencers.filter(inf => inf.date_added === today).length
    };
  };

  const getFollowerDistribution = () => {
    const clientInfluencers = getClientInfluencers();
    
    const ranges = [
      { name: '0-10K', min: 0, max: 10000, count: 0, color: '#8884d8' },
      { name: '10K-50K', min: 10000, max: 50000, count: 0, color: '#82ca9d' },
      { name: '50K-100K', min: 50000, max: 100000, count: 0, color: '#ffc658' },
      { name: '100K-500K', min: 100000, max: 500000, count: 0, color: '#ff7300' },
      { name: '500K+', min: 500000, max: Infinity, count: 0, color: '#8dd1e1' }
    ];

    clientInfluencers.forEach(inf => {
      const followers = inf.instagram_followers || 0;
      const range = ranges.find(r => followers >= r.min && followers < r.max);
      if (range) range.count++;
    });

    return ranges.filter(r => r.count > 0);
  };

  const getEngagementData = () => {
    const clientInfluencers = getClientInfluencers();
    
    const ranges = [
      { name: '0-1%', min: 0, max: 1, count: 0 },
      { name: '1-3%', min: 1, max: 3, count: 0 },
      { name: '3-5%', min: 3, max: 5, count: 0 },
      { name: '5-10%', min: 5, max: 10, count: 0 },
      { name: '10%+', min: 10, max: Infinity, count: 0 }
    ];

    clientInfluencers.forEach(inf => {
      const engagement = inf.engagement_rate || 0;
      const range = ranges.find(r => engagement >= r.min && engagement < r.max);
      if (range) range.count++;
    });

    return ranges;
  };

  const getRecentActivity = () => {
    const clientInfluencers = getClientInfluencers();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = clientInfluencers.filter(inf => inf.date_added === dateStr).length;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        influencers: count
      });
    }
    
    return last7Days;
  };

  const getClientSubmissions = () => {
    if (!selectedClient) return [];
    return submissions.filter(sub => {
      // Check if any influencers in this submission belong to the selected client
      const submissionInfluencers = influencers.filter(inf => 
        inf.submission_id === sub.id && inf.client_id.toString() === selectedClient
      );
      return submissionInfluencers.length > 0;
    });
  };

  const stats = getClientStats();
  const followerDistribution = getFollowerDistribution();
  const engagementData = getEngagementData();
  const recentActivity = getRecentActivity();
  const clientSubmissions = getClientSubmissions();

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id.toString() === clientId);
    return client ? client.name : 'Unknown Client';
  };

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

  if (userClients.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Client Access</h2>
          <p className="text-gray-600">You don't have access to any client data yet. Please contact your admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Client Analytics Dashboard</h2>
            <p className="text-gray-600">View performance metrics and insights for your clients</p>
          </div>
          <div className="w-64">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {userClients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedClient && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.newToday} added today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Instagram Followers</CardTitle>
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgInstagramFollowers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Average across all influencers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Per post average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
                  <p className="text-xs text-muted-foreground">
                    Engagement rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Follower Distribution */}
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

              {/* Engagement Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Rate Distribution</CardTitle>
                  <CardDescription>Number of influencers by engagement rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Influencers added in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="influencers" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Recent Submissions</span>
                </CardTitle>
                <CardDescription>Latest influencer submissions for {getClientName(selectedClient)}</CardDescription>
              </CardHeader>
              <CardContent>
                {clientSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No submissions yet for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientSubmissions.slice(0, 5).map((submission) => {
                      const submissionInfluencers = influencers.filter(inf => 
                        inf.submission_id === submission.id && inf.client_id.toString() === selectedClient
                      );
                      
                      return (
                        <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Submission #{submission.id}</h3>
                            <p className="text-sm text-gray-600">
                              {submissionInfluencers.length} influencer{submissionInfluencers.length !== 1 ? 's' : ''} submitted
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(submission.submission_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">Submitted</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Influencers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Influencers</CardTitle>
                <CardDescription>Highest performing influencers for {getClientName(selectedClient)}</CardDescription>
              </CardHeader>
              <CardContent>
                {getClientInfluencers().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No influencers found for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getClientInfluencers()
                      .sort((a, b) => (b.instagram_followers || 0) - (a.instagram_followers || 0))
                      .slice(0, 5)
                      .map((influencer) => (
                        <div key={influencer.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{influencer.name}</h3>
                            <p className="text-sm text-gray-600">{influencer.business_email}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Instagram className="h-4 w-4" />
                                <span>{(influencer.instagram_followers || 0).toLocaleString()} followers</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>{influencer.engagement_rate || 0}% engagement</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{(influencer.average_views || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500">avg views</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientPortal;
      avgTikTokFollowers: Math.round(clientInfluencers.reduce((sum, inf) => sum + (parseInt(inf.tiktokFollowers) || 0), 0) / clientInfluencers.length),
      avgViews: Math.round(clientInfluencers.reduce((sum, inf) => sum + (parseInt(inf.averageViews) || 0), 0) / clientInfluencers.length),
      avgEngagement: (clientInfluencers.reduce((sum, inf) => sum + (parseFloat(inf.engagementRate) || 0), 0) / clientInfluencers.length).toFixed(1),
      newToday: clientInfluencers.filter(inf => inf.dateAdded === today).length
    }
  }

  const getPlatformDistribution = () => {
    const clientInfluencers = getClientInfluencers()
    
    const instagramDominant = clientInfluencers.filter(inf => 
      (parseInt(inf.instagramFollowers) || 0) > (parseInt(inf.tiktokFollowers) || 0)
    ).length
    
    const tiktokDominant = clientInfluencers.filter(inf => 
      (parseInt(inf.tiktokFollowers) || 0) > (parseInt(inf.instagramFollowers) || 0)
    ).length
    
    const equal = clientInfluencers.length - instagramDominant - tiktokDominant

    return [
      { name: 'Instagram Dominant', value: instagramDominant, color: '#E1306C' },
      { name: 'TikTok Dominant', value: tiktokDominant, color: '#000000' },
      { name: 'Equal/Other', value: equal, color: '#8884d8' }
    ]
  }

  const getTopCreators = () => {
    const clientInfluencers = getClientInfluencers()
    return clientInfluencers
      .sort((a, b) => (parseInt(b.averageViews) || 0) - (parseInt(a.averageViews) || 0))
      .slice(0, 5)
      .map(inf => ({
        name: inf.name,
        views: parseInt(inf.averageViews) || 0,
        engagement: parseFloat(inf.engagementRate) || 0
      }))
  }

  const getCreatorsOverTime = () => {
    const clientInfluencers = getClientInfluencers()
    const dateGroups = {}
    
    clientInfluencers.forEach(inf => {
      const date = inf.dateAdded
      dateGroups[date] = (dateGroups[date] || 0) + 1
    })

    return Object.entries(dateGroups)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, count]) => ({
        date,
        creators: count,
        cumulative: Object.entries(dateGroups)
          .filter(([d]) => new Date(d) <= new Date(date))
          .reduce((sum, [, c]) => sum + c, 0)
      }))
  }

  const stats = getClientStats()
  const platformData = getPlatformDistribution()
  const topCreators = getTopCreators()
  const timelineData = getCreatorsOverTime()

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Client Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Client</label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Instagram</CardTitle>
            <Instagram className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgInstagramFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg TikTok</CardTitle>
            <div className="h-4 w-4 bg-black rounded-sm"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTikTokFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.newToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Creators by dominant platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Creators Added Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Creators Added Over Time</CardTitle>
            <CardDescription>Cumulative creator count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cumulative" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Creators */}
      <Card>
        <CardHeader>
          <CardTitle>Top Creators by Average Views</CardTitle>
          <CardDescription>Your highest performing influencers</CardDescription>
        </CardHeader>
        <CardContent>
          {topCreators.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No creators found for this client</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCreators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Creator List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your Influencers</CardTitle>
          <CardDescription>Complete list of influencers for {clients.find(c => c.id === selectedClient)?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {getClientInfluencers().length === 0 ? (
            <p className="text-gray-500 text-center py-8">No influencers found for this client</p>
          ) : (
            <div className="space-y-3">
              {getClientInfluencers().map(inf => (
                <div key={inf.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{inf.name}</h3>
                    <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>📷 {parseInt(inf.instagramFollowers)?.toLocaleString() || '0'}</span>
                      <span>🎵 {parseInt(inf.tiktokFollowers)?.toLocaleString() || '0'}</span>
                      <span>👁️ {parseInt(inf.averageViews)?.toLocaleString() || '0'}</span>
                      <span>❤️ {inf.engagementRate}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={inf.submitted ? 'default' : 'secondary'}>
                      {inf.submitted ? 'Active' : 'Pending'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Added: {inf.dateAdded}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientPortal

