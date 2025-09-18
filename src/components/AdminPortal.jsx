import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Trash2, Edit, UserPlus, Users, Briefcase, History, CheckCircle, Clock, XCircle, Download, PlusCircle, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

// Custom Notification Component
const Notification = ({ message, type, title, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);

    return () => clearTimeout(timerRef.current);
  }, [message, type, title, onClose]);

  const bgColor = type === 'error' ? 'bg-red-50' : type === 'success' ? 'bg-green-50' : 'bg-yellow-50';
  const borderColor = type === 'error' ? 'border-red-500' : type === 'success' ? 'border-green-500' : 'border-yellow-500';
  const iconColor = type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-yellow-600';
  const Icon = type === 'error' ? AlertTriangle : type === 'success' ? CheckCircle : Info;

  return (
    <div
      className={`fixed top-0 left-1/2 -translate-x-1/2 mt-4 p-4 rounded-lg shadow-lg max-w-md w-full z-50 transition-all duration-500\
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}\
        ${bgColor} ${borderColor} border`}
      role="alert"
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 mr-3 ${iconColor}`} />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-base text-gray-700">{message}</p>
        </div>
        <button onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }} className="ml-auto -mr-1 -mt-1 p-1 rounded-md inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const AdminPortal = () => {
  const { user } = useAuth();
  const [influencers, setInfluencers] = useState([]);
  const [submittedInfluencers, setSubmittedInfluencers] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedVa, setSelectedVa] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [vaToAssignClient, setVaToAssignClient] = useState(null);
  const [clientToAssign, setClientToAssign] = useState('');
  const [isAssignClientDialogOpen, setIsAssignClientDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load all data
      const [clientsResponse, usersResponse, influencersResponse, submissionsResponse] = await Promise.all([
        apiService.getClients(),
        apiService.getUsers(),
        apiService.getInfluencers(),
        apiService.getSubmissions()
      ]);
      
      setClients(clientsResponse.clients);
      setUsers(usersResponse.users);
      setInfluencers(influencersResponse.influencers);
      setSubmissions(submissionsResponse.submissions);
      
      // Filter submitted influencers
      const submitted = influencersResponse.influencers.filter(inf => inf.submitted);
      setSubmittedInfluencers(submitted);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data. Please refresh the page.', 'error', 'Loading Error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info', title = '') => {
    setAlert({ message, type, title });
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getVaName = (vaId) => {
    const va = users.find(u => u.id === vaId);
    return va ? va.full_name : 'Unknown VA';
  };

  const addClient = async () => {
    if (!newClientName.trim()) {
      showNotification('Please enter a client name.', 'error', 'Client Name Required');
      return;
    }

    try {
      const clientData = {
        name: newClientName.trim(),
        description: `Client: ${newClientName.trim()}`
      };

      const response = await apiService.createClient(clientData);
      const newClient = response.client;

      setClients(prev => [...prev, newClient]);
      setNewClientName('');
      setIsAddClientDialogOpen(false);
      
      showNotification('Client added successfully!', 'success', 'Success');
    } catch (error) {
      console.error('Error adding client:', error);
      showNotification(error.message || 'Failed to add client.', 'error', 'Error');
    }
  };

  const assignClientToVa = async () => {
    if (!vaToAssignClient || !clientToAssign) {
      showNotification('Please select both a VA and a client.', 'error', 'Selection Required');
      return;
    }

    try {
      await apiService.assignClientToUser(vaToAssignClient.id, clientToAssign);
      
      showNotification(`Client assigned to ${vaToAssignClient.full_name} successfully!`, 'success', 'Assignment Complete');
      setIsAssignClientDialogOpen(false);
      setVaToAssignClient(null);
      setClientToAssign('');
      
      // Reload data to reflect changes
      await loadInitialData();
    } catch (error) {
      console.error('Error assigning client:', error);
      showNotification(error.message || 'Failed to assign client.', 'error', 'Assignment Error');
    }
  };

  const deleteInfluencer = async (idToDelete) => {
    try {
      await apiService.deleteInfluencer(idToDelete);
      
      setInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
      setSubmittedInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
      
      showNotification('Influencer deleted successfully.', 'success', 'Deleted');
    } catch (error) {
      console.error('Error deleting influencer:', error);
      showNotification(error.message || 'Failed to delete influencer.', 'error', 'Error');
    }
  };

  const exportInfluencersToCSV = () => {
    const csvHeaders = [
      'Name', 'Business Email', 'Client', 'Instagram Followers', 'TikTok Followers',
      'Average Views', 'Engagement Rate', 'Instagram URL', 'TikTok URL', 'Notes', 'Date Added', 'Added By'
    ];

    const csvData = influencers.map(inf => [
      inf.name,
      inf.business_email,
      getClientName(inf.client_id),
      inf.instagram_followers,
      inf.tiktok_followers,
      inf.average_views,
      inf.engagement_rate,
      inf.instagram_url,
      inf.tiktok_url,
      inf.notes,
      inf.date_added,
      getVaName(inf.added_by)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `influencers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Influencers exported to CSV successfully!', 'success', 'Export Complete');
  };

  const getSubmissionStats = () => {
    const totalSubmissions = submissions.length;
    const totalInfluencers = submittedInfluencers.length;
    const avgInfluencersPerSubmission = totalSubmissions > 0 ? (totalInfluencers / totalSubmissions).toFixed(1) : 0;
    
    return {
      totalSubmissions,
      totalInfluencers,
      avgInfluencersPerSubmission
    };
  };

  const stats = getSubmissionStats();

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
      {alert && (
        <Notification
          message={alert.message}
          type={alert.type}
          title={alert.title}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Portal</h2>
        <p className="text-gray-600 mb-6">Manage VAs, clients, and review all influencer submissions.</p>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="manage-vas">Manage VAs</TabsTrigger>
            <TabsTrigger value="manage-clients">Manage Clients</TabsTrigger>
            <TabsTrigger value="all-influencers">All Influencers</TabsTrigger>
            <TabsTrigger value="submission-history">Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total VAs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter(u => u.role === 'va').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clients.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{influencers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest influencer submissions and activity</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No submissions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">Submission #{submission.id}</h3>
                          <p className="text-sm text-gray-600">
                            {submission.influencer_count} influencers submitted by {getVaName(submission.submitted_by)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submission_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Submitted
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-vas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Virtual Assistants ({users.filter(u => u.role === 'va').length})</span>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage VA accounts and client assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.filter(u => u.role === 'va').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No VAs registered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.filter(u => u.role === 'va').map((va) => (
                      <div key={va.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{va.full_name}</h3>
                            <p className="text-sm text-gray-600">{va.email}</p>
                            <p className="text-xs text-gray-500">
                              Joined: {new Date(va.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setVaToAssignClient(va);
                              setIsAssignClientDialogOpen(true);
                            }}
                          >
                            Assign Client
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Clients ({clients.length})</span>
                  </div>
                  <Button onClick={() => setIsAddClientDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage client accounts and assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No clients added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div key={client.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{client.name}</h3>
                            <p className="text-sm text-gray-600">{client.description}</p>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-influencers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>All Influencers ({influencers.length})</span>
                  </div>
                  <Button onClick={exportInfluencersToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardTitle>
                <CardDescription>
                  View and manage all influencer records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {influencers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No influencers added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {influencers.map((influencer) => (
                      <div key={influencer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{influencer.name}</h3>
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {getClientName(influencer.client_id)}
                              </span>
                              {influencer.submitted && (
                                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Submitted
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{influencer.business_email}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Instagram:</span>
                                <p className="font-medium">{influencer.instagram_followers?.toLocaleString() || 0} followers</p>
                              </div>
                              <div>
                                <span className="text-gray-500">TikTok:</span>
                                <p className="font-medium">{influencer.tiktok_followers?.toLocaleString() || 0} followers</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Avg Views:</span>
                                <p className="font-medium">{influencer.average_views?.toLocaleString() || 0}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Engagement:</span>
                                <p className="font-medium">{influencer.engagement_rate || 0}%</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Added by {getVaName(influencer.added_by)} on {new Date(influencer.date_added).toLocaleDateString()}
                            </div>
                            {influencer.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">{influencer.notes}</p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteInfluencer(influencer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submission-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Submission History ({submissions.length})</span>
                </CardTitle>
                <CardDescription>
                  View all VA submissions and their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No submissions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Submission #{submission.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {submission.influencer_count} influencers submitted by {getVaName(submission.submitted_by)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(submission.submission_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Submitted
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedSubmission(
                                expandedSubmission === submission.id ? null : submission.id
                              )}
                            >
                              {expandedSubmission === submission.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {submission.notes && (
                          <p className="text-sm text-gray-600 italic mb-2">{submission.notes}</p>
                        )}
                        {expandedSubmission === submission.id && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-gray-900 mb-2">Submitted Influencers:</h4>
                            <div className="space-y-2">
                              {submittedInfluencers
                                .filter(inf => inf.submission_id === submission.id)
                                .map((influencer) => (
                                  <div key={influencer.id} className="text-sm bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{influencer.name}</span> - {influencer.business_email}
                                    <span className="text-gray-500 ml-2">({getClientName(influencer.client_id)})</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client account that can be assigned to VAs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                placeholder="Enter client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={addClient}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Client Dialog */}
      <Dialog open={isAssignClientDialogOpen} onOpenChange={setIsAssignClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Client to VA</DialogTitle>
            <DialogDescription>
              {vaToAssignClient && `Assign a client to ${vaToAssignClient.full_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Select Client</Label>
              <Select value={clientToAssign} onValueChange={setClientToAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={assignClientToVa}>Assign Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPortal;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getVaName = (vaId) => {
    const va = vas.find(v => v.id === vaId);
    return va ? va.name : 'Unknown VA';
  };

  const addVa = () => {
    if (newVaName.trim() === '') {
      showNotification('VA name cannot be empty.', 'error', 'Error Adding VA');
      return;
    }
    const newVa = { id: Date.now().toString(), name: newVaName, assignedClients: [] };
    setVAs(prev => [...prev, newVa]);
    setNewVaName('');
    setIsAddVaDialogOpen(false);
    showNotification(`VA '${newVaName}' added successfully!`, 'success', 'VA Added');
  };

  const deleteVa = (vaId) => {
    const vaName = getVaName(vaId);
    setVAs(prev => prev.filter(va => va.id !== vaId));
    showNotification(`VA '${vaName}' deleted successfully.`, 'success', 'VA Deleted');
  };

  const openAssignClientDialog = (va) => {
    setVaToAssignClient(va);
    setClientToAssign('');
    setIsAssignClientDialogOpen(true);
  };

  const assignClientToVa = () => {
    if (!vaToAssignClient || !clientToAssign) {
      showNotification('Please select a VA and a client.', 'error', 'Assignment Error');
      return;
    }
    setVAs(prev => prev.map(va => 
      va.id === vaToAssignClient.id
        ? { ...va, assignedClients: [...new Set([...va.assignedClients, clientToAssign])] }
        : va
    ));
    setIsAssignClientDialogOpen(false);
    showNotification(`Client '${getClientName(clientToAssign)}' assigned to '${vaToAssignClient.name}'.`, 'success', 'Client Assigned');
  };

  const unassignClientFromVa = (vaId, clientId) => {
    const vaName = getVaName(vaId);
    const clientName = getClientName(clientId);
    setVAs(prev => prev.map(va => 
      va.id === vaId
        ? { ...va, assignedClients: va.assignedClients.filter(id => id !== clientId) }
        : va
    ));
    showNotification(`Client '${clientName}' unassigned from '${vaName}'.`, 'success', 'Client Unassigned');
  };

  const deleteInfluencer = (idToDelete) => {
    const influencerName = influencers.find(inf => inf.id === idToDelete)?.name || submittedInfluencers.find(inf => inf.id === idToDelete)?.name || 'Influencer';
    setInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
    setSubmittedInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
    showNotification(`${influencerName} deleted successfully.`, 'success', 'Influencer Deleted');
  };

  const changeInfluencerStatus = (influencerId, newStatus) => {
    let updatedInfluencer = null;
    setInfluencers(prev => prev.map(inf => {
      if (inf.id === influencerId) {
        updatedInfluencer = { ...inf, submitted: newStatus };
        return updatedInfluencer;
      }
      return inf;
    }));

    if (updatedInfluencer) {
      if (newStatus) {
        // Move from pending to submitted
        setSubmittedInfluencers(prev => [...prev, updatedInfluencer]);
        setInfluencers(prev => prev.filter(inf => inf.id !== influencerId));
      } else {
        // Move from submitted to pending
        setInfluencers(prev => [...prev, updatedInfluencer]);
        setSubmittedInfluencers(prev => prev.filter(inf => inf.id !== influencerId));
      }
      showNotification(`Influencer status updated to ${newStatus ? 'Submitted' : 'Pending'}.`, 'success', 'Status Updated');
    }
  };

  const exportAllInfluencers = () => {
    const allInfluencers = [...influencers, ...submittedInfluencers];
    if (allInfluencers.length === 0) {
      showNotification('No influencers to export.', 'warning', 'Export Failed');
      return;
    }
    const headers = ["Name", "Business Email", "Instagram Followers", "TikTok Followers", "Average Views", "Engagement Rate", "Instagram URL", "TikTok URL", "Notes", "Client(s)", "Date Added", "Status"];
    const rows = allInfluencers.map(inf => {
      // Handle multiple clients for an influencer if it were implemented more robustly
      // For now, it's one client per influencer as per current data structure
      const clientNames = getClientName(inf.clientId);
      return [
        inf.name,
        inf.businessEmail,
        inf.instagramFollowers,
        inf.tiktokFollowers,
        inf.averageViews,
        inf.engagementRate,
        inf.instagramUrl,
        inf.tiktokUrl,
        inf.notes,
        clientNames,
        inf.dateAdded,
        inf.submitted ? "Submitted" : "Pending"
      ];
    });

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(item => `"${item}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'all_influencers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('All influencers exported successfully!', 'success', 'Export Complete');
  };

  const exportSubmittedInfluencers = () => {
    if (submittedInfluencers.length === 0) {
      showNotification('No submitted influencers to export.', 'warning', 'Export Failed');
      return;
    }
    const headers = ["Name", "Business Email", "Instagram Followers", "TikTok Followers", "Average Views", "Engagement Rate", "Instagram URL", "TikTok URL", "Notes", "Client(s)", "Date Added", "Status"];
    const rows = submittedInfluencers.map(inf => {
      const clientNames = getClientName(inf.clientId);
      return [
        inf.name,
        inf.businessEmail,
        inf.instagramFollowers,
        inf.tiktokFollowers,
        inf.averageViews,
        inf.engagementRate,
        inf.instagramUrl,
        inf.tiktokUrl,
        inf.notes,
        clientNames,
        inf.dateAdded,
        inf.submitted ? "Submitted" : "Pending"
      ];
    });

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(item => `"${item}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'submitted_influencers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Submitted influencers exported successfully!', 'success', 'Export Complete');
  };

  const exportPendingInfluencers = () => {
    const pendingInfluencers = influencers.filter(inf => !inf.submitted);
    if (pendingInfluencers.length === 0) {
      showNotification('No pending influencers to export.', 'warning', 'Export Failed');
      return;
    }
    const headers = ["Name", "Business Email", "Instagram Followers", "TikTok Followers", "Average Views", "Engagement Rate", "Instagram URL", "TikTok URL", "Notes", "Client(s)", "Date Added", "Status"];
    const rows = pendingInfluencers.map(inf => {
      const clientNames = getClientName(inf.clientId);
      return [
        inf.name,
        inf.businessEmail,
        inf.instagramFollowers,
        inf.tiktokFollowers,
        inf.averageViews,
        inf.engagementRate,
        inf.instagramUrl,
        inf.tiktokUrl,
        inf.notes,
        clientNames,
        inf.dateAdded,
        inf.submitted ? "Submitted" : "Pending"
      ];
    });

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(item => `"${item}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'pending_influencers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Pending influencers exported successfully!', 'success', 'Export Complete');
  };

  // Group submitted influencers by VA and date for history tab
  const getGroupedSubmissions = () => {
    const grouped = submittedInfluencers.reduce((acc, inf) => {
      // Assuming VA ID is stored with influencer on submission, or default to 'unknown'
      const vaId = inf.vaId || 'unknown'; 
      const date = inf.dateAdded; // Use dateAdded as submission date
      const key = `${vaId}-${date}`;
      if (!acc[key]) {
        acc[key] = { id: key, vaId, date, influencers: [] };
      }
      acc[key].influencers.push(inf);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const submissionHistory = getGroupedSubmissions();

  // Aggregate influencers for 'All Influencers' tab to handle multiple clients
  const aggregatedInfluencers = influencers.concat(submittedInfluencers).reduce((acc, inf) => {
    const existing = acc.find(item => item.businessEmail === inf.businessEmail);
    if (existing) {
      // Add client if not already present
      if (!existing.clientIds.includes(inf.clientId)) {
        existing.clientIds.push(inf.clientId);
      }
      // Update status if any instance is submitted
      if (inf.submitted) {
        existing.submitted = true;
      }
    } else {
      acc.push({ ...inf, clientIds: [inf.clientId] });
    }
    return acc;
  }, []);

  const totalInfluencersCount = aggregatedInfluencers.length;
  const totalSubmittedCount = aggregatedInfluencers.filter(inf => inf.submitted).length;
  const totalPendingCount = aggregatedInfluencers.filter(inf => !inf.submitted).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {alert && <Notification message={alert.message} type={alert.type} title={alert.title} onClose={() => setAlert(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Usario Partners: Admin Portal</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Total Unique Influencers</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{totalInfluencersCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Submitted Influencers</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{totalSubmittedCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Pending Influencers</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{totalPendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Total Clients</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{clients.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="allInfluencers" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-200 rounded-xl p-1">
            <TabsTrigger value="allInfluencers" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <Users className="h-5 w-5 mr-2" /> All Influencers
            </TabsTrigger>
            <TabsTrigger value="vaManagement" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <Briefcase className="h-5 w-5 mr-2" /> VA Management
            </TabsTrigger>
            <TabsTrigger value="submissionHistory" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <History className="h-5 w-5 mr-2" /> Submission History
            </TabsTrigger>
            <TabsTrigger value="dataExport" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <Download className="h-5 w-5 mr-2" /> Data Export
            </TabsTrigger>
          </TabsList>

          {/* All Influencers Tab */}
          <TabsContent value="allInfluencers" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">All Influencers</CardTitle>
              <CardDescription className="text-base text-gray-600">Manage all unique influencers across all clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aggregatedInfluencers.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-lg">No influencers added yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aggregatedInfluencers.map(inf => (
                    <Card key={inf.id} className="p-4 shadow-sm rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{inf.name}</h3>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => deleteInfluencer(inf.id)} title="Delete Influencer">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => changeInfluencerStatus(inf.id, !inf.submitted)} title={inf.submitted ? "Mark as Pending" : "Mark as Submitted"}>
                            {inf.submitted ? <Clock className="h-4 w-4 text-yellow-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {inf.instagramFollowers?.toLocaleString()} IG • {inf.tiktokFollowers?.toLocaleString()} TT • {inf.engagementRate}% engagement
                      </p>
                      <p className="text-xs text-gray-500 mt-1">IG: <a href={inf.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a> | TT: <a href={inf.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a></p>
                      <div className="mt-2 flex items-center space-x-2">
                        {inf.submitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" /> Pending
                          </span>
                        )}
                        {inf.clientIds.length === 1 ? (
                          <span className="text-sm font-medium text-gray-700">{getClientName(inf.clientIds[0])}</span>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setExpandedInfluencerClients(prev => ({ ...prev, [inf.id]: !prev[inf.id] }))} className="h-auto px-2 py-1">
                            {getClientName(inf.clientIds[0])} +{inf.clientIds.length - 1} {expandedInfluencerClients[inf.id] ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                          </Button>
                        )}
                      </div>
                      {expandedInfluencerClients[inf.id] && inf.clientIds.length > 1 && (
                        <div className="mt-2 pl-4 border-l border-gray-200">
                          {inf.clientIds.slice(1).map(clientId => (
                            <p key={clientId} className="text-xs text-gray-600">- {getClientName(clientId)}</p>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>

          {/* VA Management Tab */}
          <TabsContent value="vaManagement" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">VA Management</CardTitle>
              <CardDescription className="text-base text-gray-600">Add, assign clients to, and manage your Virtual Assistants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog open={isAddVaDialogOpen} onOpenChange={setIsAddVaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                    <UserPlus className="h-5 w-5 mr-2" /> Add New VA
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Virtual Assistant</DialogTitle>
                    <DialogDescription>Enter the name of the new VA.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="vaName">VA Name</Label>
                    <Input id="vaName" value={newVaName} onChange={(e) => setNewVaName(e.target.value)} placeholder="e.g., Jane Doe" />
                  </div>
                  <DialogFooter>
                    <Button onClick={addVa}>Add VA</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="space-y-4">
                {vas.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-lg">No VAs added yet.</p>
                ) : (
                  vas.map(va => (
                    <Card key={va.id} className="p-4 shadow-sm rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{va.name}</h3>
                          <p className="text-sm text-gray-600">Assigned Clients: 
                            {va.assignedClients.length > 0 
                              ? va.assignedClients.map(clientId => getClientName(clientId)).join(', ') 
                              : 'None'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openAssignClientDialog(va)}>
                            <Briefcase className="h-4 w-4 mr-2" /> Assign Client
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteVa(va.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete VA
                          </Button>
                        </div>
                      </div>
                      {va.assignedClients.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {va.assignedClients.map(clientId => (
                            <span key={clientId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getClientName(clientId)}
                              <button onClick={() => unassignClientFromVa(va.id, clientId)} className="ml-1 -mr-0.5 h-3 w-3 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <XCircle className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>

              <Dialog open={isAssignClientDialogOpen} onOpenChange={setIsAssignClientDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Assign Client to {vaToAssignClient?.name}</DialogTitle>
                    <DialogDescription>Select a client to assign to this VA.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="clientSelect">Client</Label>
                    <Select value={clientToAssign} onValueChange={setClientToAssign}>
                      <SelectTrigger id="clientSelect">
                        <SelectValue placeholder="Select a client" />
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
                  <DialogFooter>
                    <Button onClick={assignClientToVa}>Assign Client</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </TabsContent>

          {/* Submission History Tab */}
          <TabsContent value="submissionHistory" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Submission History</CardTitle>
              <CardDescription className="text-base text-gray-600">View historical submissions by VAs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissionHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-lg">No submission history yet.</p>
              ) : (
                submissionHistory.map((submission) => (
                  <Card key={submission.id} className="p-4 shadow-sm rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedSubmission(expandedSubmission === submission.id ? null : submission.id)}>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Submission by {getVaName(submission.vaId)}</h3>
                        <p className="text-sm text-gray-600">on {submission.date} ({submission.influencers.length} influencers)</p>
                      </div>
                      {expandedSubmission === submission.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                    {expandedSubmission === submission.id && (
                      <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                        {submission.influencers.map(inf => (
                          <div key={inf.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                            <div>
                              <p className="font-medium text-base">{inf.name}</p>
                              <p className="text-sm text-gray-600">{getClientName(inf.clientId)}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {inf.submitted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" /> Pending
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </CardContent>
          </TabsContent>

          {/* Data Export Tab */}
          <TabsContent value="dataExport" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Data Export</CardTitle>
              <CardDescription className="text-base text-gray-600">Download your influencer data in CSV format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={exportAllInfluencers} className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                <Download className="h-5 w-5 mr-2" /> Export All Influencers (CSV)
              </Button>
              <Button onClick={exportSubmittedInfluencers} variant="outline" className="w-full py-3 text-lg font-semibold">
                <Download className="h-5 w-5 mr-2" /> Export Submitted Influencers (CSV)
              </Button>
              <Button onClick={exportPendingInfluencers} variant="outline" className="w-full py-3 text-lg font-semibold">
                <Download className="h-5 w-5 mr-2" /> Export Pending Influencers (CSV)
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;


