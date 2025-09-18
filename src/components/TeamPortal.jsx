import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Users, Plus, Upload, Calendar, TrendingUp, Eye, Heart, Instagram } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const TeamPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('add-influencer');
  const [clients, setClients] = useState([]);
  const [userClients, setUserClients] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedClient, setSelectedClient] = useState('');
  const [influencerForm, setInfluencerForm] = useState({
    name: '',
    businessEmail: '',
    instagramHandle: '',
    instagramFollowers: '',
    tiktokHandle: '',
    tiktokFollowers: '',
    averageViews: '',
    engagementRate: '',
    notes: ''
  });

  // Bulk upload state
  const [bulkInfluencers, setBulkInfluencers] = useState([]);
  const [bulkText, setBulkText] = useState('');

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

  const handleAddInfluencer = async () => {
    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }

    try {
      const influencerData = {
        name: influencerForm.name,
        business_email: influencerForm.businessEmail,
        instagram_handle: influencerForm.instagramHandle,
        instagram_followers: parseInt(influencerForm.instagramFollowers) || 0,
        tiktok_handle: influencerForm.tiktokHandle,
        tiktok_followers: parseInt(influencerForm.tiktokFollowers) || 0,
        average_views: parseInt(influencerForm.averageViews) || 0,
        engagement_rate: parseFloat(influencerForm.engagementRate) || 0,
        notes: influencerForm.notes,
        client_id: parseInt(selectedClient),
        submitted_by: user.id
      };

      await apiService.createInfluencer(influencerData);
      
      // Reset form
      setInfluencerForm({
        name: '',
        businessEmail: '',
        instagramHandle: '',
        instagramFollowers: '',
        tiktokHandle: '',
        tiktokFollowers: '',
        averageViews: '',
        engagementRate: '',
        notes: ''
      });
      
      // Reload data
      loadInitialData();
      
      alert('Influencer added successfully!');
    } catch (error) {
      console.error('Error adding influencer:', error);
      alert('Error adding influencer. Please try again.');
    }
  };

  const parseBulkInfluencers = () => {
    const lines = bulkText.trim().split('\n');
    const parsed = [];
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 6) {
          parsed.push({
            id: index,
            name: parts[0] || '',
            businessEmail: parts[1] || '',
            instagramHandle: parts[2] || '',
            instagramFollowers: parts[3] || '0',
            tiktokHandle: parts[4] || '',
            tiktokFollowers: parts[5] || '0',
            averageViews: parts[6] || '0',
            engagementRate: parts[7] || '0',
            notes: parts[8] || ''
          });
        }
      }
    });
    
    setBulkInfluencers(parsed);
  };

  const handleBulkSubmit = async () => {
    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }

    if (bulkInfluencers.length === 0) {
      alert('No influencers to submit');
      return;
    }

    try {
      // Create submission first
      const submissionData = {
        submitted_by: user.id,
        client_id: parseInt(selectedClient)
      };
      
      const submissionResponse = await apiService.createSubmission(submissionData);
      const submissionId = submissionResponse.submission.id;

      // Add all influencers with the submission ID
      for (const inf of bulkInfluencers) {
        const influencerData = {
          name: inf.name,
          business_email: inf.businessEmail,
          instagram_handle: inf.instagramHandle,
          instagram_followers: parseInt(inf.instagramFollowers) || 0,
          tiktok_handle: inf.tiktokHandle,
          tiktok_followers: parseInt(inf.tiktokFollowers) || 0,
          average_views: parseInt(inf.averageViews) || 0,
          engagement_rate: parseFloat(inf.engagementRate) || 0,
          notes: inf.notes,
          client_id: parseInt(selectedClient),
          submitted_by: user.id,
          submission_id: submissionId
        };

        await apiService.createInfluencer(influencerData);
      }

      // Reset bulk form
      setBulkText('');
      setBulkInfluencers([]);
      
      // Reload data
      loadInitialData();
      
      alert(`Successfully submitted ${bulkInfluencers.length} influencers!`);
    } catch (error) {
      console.error('Error submitting bulk influencers:', error);
      alert('Error submitting influencers. Please try again.');
    }
  };

  const getMyInfluencers = () => {
    return influencers.filter(inf => inf.submitted_by === user?.id);
  };

  const getMySubmissions = () => {
    return submissions.filter(sub => sub.submitted_by === user?.id);
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getStats = () => {
    const myInfluencers = getMyInfluencers();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalInfluencers: myInfluencers.length,
      totalSubmissions: getMySubmissions().length,
      addedToday: myInfluencers.filter(inf => inf.date_added === today).length,
      avgFollowers: myInfluencers.length > 0 ? Math.round(myInfluencers.reduce((sum, inf) => sum + (inf.instagram_followers || 0), 0) / myInfluencers.length) : 0
    };
  };

  const stats = getStats();

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
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Client Access</h2>
          <p className="text-gray-600">You don't have access to any clients yet. Please contact your admin to get assigned to clients.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Portal</h2>
              <p className="text-gray-600">Add and manage influencers for your assigned clients</p>
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
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInfluencers}</div>
                <p className="text-xs text-muted-foreground">Added by you</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Total submissions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Added Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.addedToday}</div>
                <p className="text-xs text-muted-foreground">New today</p>
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-1 m-6 mb-0">
            <TabsTrigger value="add-influencer">Add Influencer</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
            <TabsTrigger value="my-influencers">My Influencers</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="add-influencer" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Single Influencer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={influencerForm.name}
                        onChange={(e) => setInfluencerForm({...influencerForm, name: e.target.value})}
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="businessEmail">Business Email *</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={influencerForm.businessEmail}
                        onChange={(e) => setInfluencerForm({...influencerForm, businessEmail: e.target.value})}
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagramHandle">Instagram Handle</Label>
                      <Input
                        id="instagramHandle"
                        value={influencerForm.instagramHandle}
                        onChange={(e) => setInfluencerForm({...influencerForm, instagramHandle: e.target.value})}
                        placeholder="@johndoe"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="instagramFollowers">Instagram Followers</Label>
                      <Input
                        id="instagramFollowers"
                        type="number"
                        value={influencerForm.instagramFollowers}
                        onChange={(e) => setInfluencerForm({...influencerForm, instagramFollowers: e.target.value})}
                        placeholder="10000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                      <Input
                        id="tiktokHandle"
                        value={influencerForm.tiktokHandle}
                        onChange={(e) => setInfluencerForm({...influencerForm, tiktokHandle: e.target.value})}
                        placeholder="@johndoe"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tiktokFollowers">TikTok Followers</Label>
                      <Input
                        id="tiktokFollowers"
                        type="number"
                        value={influencerForm.tiktokFollowers}
                        onChange={(e) => setInfluencerForm({...influencerForm, tiktokFollowers: e.target.value})}
                        placeholder="5000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="averageViews">Average Views</Label>
                      <Input
                        id="averageViews"
                        type="number"
                        value={influencerForm.averageViews}
                        onChange={(e) => setInfluencerForm({...influencerForm, averageViews: e.target.value})}
                        placeholder="1000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
                      <Input
                        id="engagementRate"
                        type="number"
                        step="0.1"
                        value={influencerForm.engagementRate}
                        onChange={(e) => setInfluencerForm({...influencerForm, engagementRate: e.target.value})}
                        placeholder="3.5"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={influencerForm.notes}
                    onChange={(e) => setInfluencerForm({...influencerForm, notes: e.target.value})}
                    placeholder="Additional notes about this influencer..."
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleAddInfluencer} 
                  className="mt-6"
                  disabled={!influencerForm.name || !influencerForm.businessEmail || !selectedClient}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Influencer
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="bulk-upload" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Bulk Upload Influencers</h3>
                <p className="text-gray-600 mb-4">
                  Paste influencer data in CSV format. Each line should contain: Name, Email, Instagram Handle, Instagram Followers, TikTok Handle, TikTok Followers, Average Views, Engagement Rate, Notes
                </p>
                
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="John Doe, john@example.com, @johndoe, 10000, @johndoe_tiktok, 5000, 1000, 3.5, Great engagement
Jane Smith, jane@example.com, @janesmith, 15000, @janesmith_tt, 8000, 2000, 4.2, Fashion influencer"
                  rows={10}
                  className="mb-4"
                />
                
                <div className="flex space-x-4">
                  <Button onClick={parseBulkInfluencers} variant="outline">
                    Parse Data
                  </Button>
                  <Button 
                    onClick={handleBulkSubmit} 
                    disabled={bulkInfluencers.length === 0 || !selectedClient}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit {bulkInfluencers.length} Influencers
                  </Button>
                </div>
                
                {bulkInfluencers.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Parsed Influencers ({bulkInfluencers.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {bulkInfluencers.map((inf, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{inf.name}</h5>
                              <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                              <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                                <span>IG: {inf.instagramFollowers} followers</span>
                                <span>TT: {inf.tiktokFollowers} followers</span>
                                <span>Engagement: {inf.engagementRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my-influencers" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">My Influencers</h3>
                <p className="text-gray-600 mb-4">Influencers you've added to the system</p>
                
                <div className="grid gap-4">
                  {getMyInfluencers().map(influencer => (
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
                  
                  {getMyInfluencers().length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Influencers Yet</h3>
                      <p className="text-gray-600">Start by adding your first influencer using the form above.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">My Submissions</h3>
                <p className="text-gray-600 mb-4">Track your influencer submissions</p>
                
                <div className="grid gap-4">
                  {getMySubmissions().map(submission => {
                    const submissionInfluencers = influencers.filter(inf => inf.submission_id === submission.id);
                    return (
                      <Card key={submission.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">Submission #{submission.id}</h4>
                              <p className="text-sm text-gray-600">
                                Client: {getClientName(submission.client_id)}
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
                                    <span>{inf.name}</span>
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
                  
                  {getMySubmissions().length === 0 && (
                    <div className="text-center py-12">
                      <Upload className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                      <p className="text-gray-600">Your bulk submissions will appear here once you start uploading influencers.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamPortal;
