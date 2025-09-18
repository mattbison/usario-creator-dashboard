import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { CheckCircle, AlertTriangle, Info, Upload, History, Mail, UserPlus, Send, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx';
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

const TeamPortal = () => {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [userClients, setUserClients] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [todaysInfluencers, setTodaysInfluencers] = useState([]);
  const [submittedInfluencers, setSubmittedInfluencers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    businessEmail: '',
    instagramFollowers: '',
    tiktokFollowers: '',
    averageViews: '',
    engagementRate: '',
    instagramUrl: '',
    tiktokUrl: '',
    notes: ''
  });
  const [alert, setAlert] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [isSubmitProspectsDialogOpen, setIsSubmitProspectsDialogOpen] = useState(false);
  const [editingInfluencerId, setEditingInfluencerId] = useState(null);
  const [prospectsToNotify, setProspectsToNotify] = useState([]);
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
      }
      
      // Load influencers
      const influencersResponse = await apiService.getInfluencers();
      setInfluencers(influencersResponse.influencers);
      
      // Filter today's influencers (not submitted)
      const today = new Date().toISOString().split('T')[0];
      const todaysInfluencers = influencersResponse.influencers.filter(inf => 
        inf.date_added === today && !inf.submitted
      );
      setTodaysInfluencers(todaysInfluencers);
      
      // Filter submitted influencers
      const submitted = influencersResponse.influencers.filter(inf => inf.submitted);
      setSubmittedInfluencers(submitted);
      
      // Load submissions
      const submissionsResponse = await apiService.getSubmissions();
      setSubmissions(submissionsResponse.submissions);
      
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

  const isDuplicate = (newInfluencer, existingInfluencers) => {
    return existingInfluencers.some(inf => 
      inf.client_id === newInfluencer.client_id && 
      inf.business_email.toLowerCase() === newInfluencer.business_email.toLowerCase()
    );
  };

  const addInfluencer = async () => {
    if (!selectedClient) {
      showNotification('Please select a client first.', 'error', 'Client Required');
      return;
    }

    if (!formData.name || !formData.businessEmail || !formData.instagramUrl || !formData.tiktokUrl) {
      showNotification('Please fill in all required fields (Name, Business Email, Instagram URL, TikTok URL).', 'error', 'Missing Information');
      return;
    }

    try {
      const influencerData = {
        client_id: selectedClient,
        name: formData.name,
        business_email: formData.businessEmail,
        instagram_followers: parseInt(formData.instagramFollowers) || 0,
        tiktok_followers: parseInt(formData.tiktokFollowers) || 0,
        average_views: parseInt(formData.averageViews) || 0,
        engagement_rate: parseFloat(formData.engagementRate) || 0,
        instagram_url: formData.instagramUrl,
        tiktok_url: formData.tiktokUrl,
        notes: formData.notes
      };

      // Check for duplicates locally first
      if (isDuplicate(influencerData, influencers)) {
        showNotification('An influencer with this email already exists for this client.', 'error', 'Duplicate Entry');
        return;
      }

      const response = await apiService.createInfluencer(influencerData);
      const newInfluencer = response.influencer;

      // Update local state
      setInfluencers(prev => [...prev, newInfluencer]);
      setTodaysInfluencers(prev => [...prev, newInfluencer]);

      // Reset form
      setFormData({
        name: '',
        businessEmail: '',
        instagramFollowers: '',
        tiktokFollowers: '',
        averageViews: '',
        engagementRate: '',
        instagramUrl: '',
        tiktokUrl: '',
        notes: ''
      });

      showNotification('Influencer added successfully!', 'success', 'Success');
    } catch (error) {
      console.error('Error adding influencer:', error);
      showNotification(error.message || 'Failed to add influencer.', 'error', 'Error');
    }
  };

  const updateInfluencer = async () => {
    if (!editingInfluencerId) return;

    try {
      const influencerData = {
        name: formData.name,
        business_email: formData.businessEmail,
        instagram_followers: parseInt(formData.instagramFollowers) || 0,
        tiktok_followers: parseInt(formData.tiktokFollowers) || 0,
        average_views: parseInt(formData.averageViews) || 0,
        engagement_rate: parseFloat(formData.engagementRate) || 0,
        instagram_url: formData.instagramUrl,
        tiktok_url: formData.tiktokUrl,
        notes: formData.notes
      };

      const response = await apiService.updateInfluencer(editingInfluencerId, influencerData);
      const updatedInfluencer = response.influencer;

      // Update local state
      setInfluencers(prev => prev.map(inf => inf.id === editingInfluencerId ? updatedInfluencer : inf));
      setTodaysInfluencers(prev => prev.map(inf => inf.id === editingInfluencerId ? updatedInfluencer : inf));

      // Reset form and editing state
      setFormData({
        name: '',
        businessEmail: '',
        instagramFollowers: '',
        tiktokFollowers: '',
        averageViews: '',
        engagementRate: '',
        instagramUrl: '',
        tiktokUrl: '',
        notes: ''
      });
      setEditingInfluencerId(null);

      showNotification('Influencer updated successfully!', 'success', 'Success');
    } catch (error) {
      console.error('Error updating influencer:', error);
      showNotification(error.message || 'Failed to update influencer.', 'error', 'Error');
    }
  };

  const deleteInfluencerFromTodaysList = async (idToDelete) => {
    try {
      await apiService.deleteInfluencer(idToDelete);
      
      // Update local state
      setInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
      setTodaysInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
      
      showNotification('Influencer deleted successfully.', 'success', 'Deleted');
    } catch (error) {
      console.error('Error deleting influencer:', error);
      showNotification(error.message || 'Failed to delete influencer.', 'error', 'Error');
    }
  };

  const editInfluencer = (influencer) => {
    setFormData({
      name: influencer.name,
      businessEmail: influencer.business_email,
      instagramFollowers: influencer.instagram_followers.toString(),
      tiktokFollowers: influencer.tiktok_followers.toString(),
      averageViews: influencer.average_views.toString(),
      engagementRate: influencer.engagement_rate.toString(),
      instagramUrl: influencer.instagram_url,
      tiktokUrl: influencer.tiktok_url,
      notes: influencer.notes
    });
    setEditingInfluencerId(influencer.id);
  };

  const cancelEdit = () => {
    setFormData({
      name: '',
      businessEmail: '',
      instagramFollowers: '',
      tiktokFollowers: '',
      averageViews: '',
      engagementRate: '',
      instagramUrl: '',
      tiktokUrl: '',
      notes: ''
    });
    setEditingInfluencerId(null);
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedClient) {
      showNotification('Please select a client before uploading CSV.', 'error', 'Client Required');
      event.target.value = '';
      return;
    }

    setCsvFile(file);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        showNotification('CSV file must contain at least a header row and one data row.', 'error', 'Invalid CSV');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const influencersData = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Mismatched column count. Skipping.`);
          continue;
        }

        const influencerData = headers.reduce((obj, header, index) => {
          obj[header.replace(/\s/g, '')] = values[index];
          return obj;
        }, {});

        const newInfluencer = {
          client_id: selectedClient,
          name: influencerData.Name || '',
          business_email: influencerData.BusinessEmail || '',
          instagram_followers: parseInt(influencerData.InstagramFollowers) || 0,
          tiktok_followers: parseInt(influencerData.TikTokFollowers) || 0,
          average_views: parseInt(influencerData.AverageViews) || 0,
          engagement_rate: parseFloat(influencerData.EngagementRate) || 0,
          instagram_url: influencerData.InstagramUrl || '',
          tiktok_url: influencerData.TikTokUrl || '',
          notes: influencerData.Notes || ''
        };

        if (!newInfluencer.name || !newInfluencer.business_email || !newInfluencer.instagram_url || !newInfluencer.tiktok_url) {
          errors.push(`Row ${i + 1}: Missing Name, Business Email, Instagram URL, or TikTok URL. Skipping.`);
          continue;
        }

        if (isDuplicate(newInfluencer, influencers)) {
          errors.push(`Row ${i + 1}: Influencer with email '${newInfluencer.business_email}' already exists for this client. Skipping.`);
          continue;
        }

        influencersData.push(newInfluencer);
      }

      if (influencersData.length > 0) {
        try {
          const results = await apiService.bulkCreateInfluencers(influencersData);
          
          if (results.results.length > 0) {
            // Reload data to get updated list
            await loadInitialData();
            showNotification(`${results.results.length} influencers added from CSV!`, 'success', 'Bulk Upload Complete');
          }
          
          if (results.errors.length > 0) {
            setBulkUploadErrors([...errors, ...results.errors.map(e => e.error)]);
            showNotification(`Bulk upload completed with ${results.errors.length + errors.length} errors. Check the Bulk Upload tab for details.`, 'warning', 'Partial Success');
          }
        } catch (error) {
          console.error('Bulk upload error:', error);
          showNotification('Failed to upload influencers.', 'error', 'Upload Error');
        }
      } else {
        setBulkUploadErrors(errors);
        showNotification('No new influencers were added from the CSV. Check for duplicates or format issues.', 'warning', 'No New Influencers');
      }

      setCsvFile(null);
      setCsvFileName('');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const submitTodaysProspects = async () => {
    if (todaysInfluencers.length === 0) {
      showNotification('No new prospects to submit today.', 'warning', 'Nothing to Submit');
      return;
    }

    try {
      const submissionData = {
        influencer_ids: todaysInfluencers.map(inf => inf.id),
        notes: `Submitted ${todaysInfluencers.length} prospects for review`
      };

      await apiService.createSubmission(submissionData);
      
      // Store prospects for notification email before clearing
      setProspectsToNotify([...todaysInfluencers]);
      
      // Reload data to get updated status
      await loadInitialData();
      
      showNotification(`${todaysInfluencers.length} prospects successfully submitted! Admin has been notified.`, 'success', 'Submission Complete');
      setIsSubmitProspectsDialogOpen(true);
    } catch (error) {
      console.error('Error submitting prospects:', error);
      showNotification(error.message || 'Failed to submit prospects.', 'error', 'Submission Error');
    }
  };

  const handleDialogClose = () => {
    setProspectsToNotify([]);
    setIsSubmitProspectsDialogOpen(false);
  };

  const generateMailtoLink = () => {
    const adminEmail = 'mattbison@apimedia.io';
    const subject = 'New Influencer Prospects Ready for Review';
    const body = `Hello Admin,\n\n${prospectsToNotify.length} new influencer prospects have been submitted for review. Please check the Admin Dashboard.\n\nDetails:\n${prospectsToNotify.map(inf => `- ${inf.name} (${inf.business_email}) for ${getClientName(inf.client_id)}`).join('\n')}\n\nThank you!`;
    return `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Portal</h2>
        <p className="text-gray-600 mb-6">Add and manage influencer prospects for your assigned clients.</p>
        
        {userClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You haven't been assigned to any clients yet. Please contact your admin.</p>
          </div>
        ) : (
          <Tabs defaultValue="add-influencer" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="add-influencer">Add Influencer</TabsTrigger>
              <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
              <TabsTrigger value="todays-list">Today's List ({todaysInfluencers.length})</TabsTrigger>
              <TabsTrigger value="submission-history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="add-influencer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>{editingInfluencerId ? 'Edit Influencer' : 'Add New Influencer'}</span>
                  </CardTitle>
                  <CardDescription>
                    {editingInfluencerId ? 'Update influencer information' : 'Add a new influencer prospect to your client list'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-select">Client *</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient} disabled={editingInfluencerId}>
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
                    <div className="space-y-2">
                      <Label htmlFor="name">Influencer Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter influencer name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business-email">Business Email *</Label>
                      <Input
                        id="business-email"
                        type="email"
                        placeholder="Enter business email"
                        value={formData.businessEmail}
                        onChange={(e) => setFormData({...formData, businessEmail: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="engagement-rate">Engagement Rate (%)</Label>
                      <Input
                        id="engagement-rate"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 3.5"
                        value={formData.engagementRate}
                        onChange={(e) => setFormData({...formData, engagementRate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram-followers">Instagram Followers</Label>
                      <Input
                        id="instagram-followers"
                        type="number"
                        placeholder="e.g., 50000"
                        value={formData.instagramFollowers}
                        onChange={(e) => setFormData({...formData, instagramFollowers: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok-followers">TikTok Followers</Label>
                      <Input
                        id="tiktok-followers"
                        type="number"
                        placeholder="e.g., 75000"
                        value={formData.tiktokFollowers}
                        onChange={(e) => setFormData({...formData, tiktokFollowers: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="average-views">Average Views</Label>
                      <Input
                        id="average-views"
                        type="number"
                        placeholder="e.g., 10000"
                        value={formData.averageViews}
                        onChange={(e) => setFormData({...formData, averageViews: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram-url">Instagram URL *</Label>
                      <Input
                        id="instagram-url"
                        placeholder="https://instagram.com/username"
                        value={formData.instagramUrl}
                        onChange={(e) => setFormData({...formData, instagramUrl: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok-url">TikTok URL *</Label>
                      <Input
                        id="tiktok-url"
                        placeholder="https://tiktok.com/@username"
                        value={formData.tiktokUrl}
                        onChange={(e) => setFormData({...formData, tiktokUrl: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about this influencer..."
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    {editingInfluencerId ? (
                      <>
                        <Button onClick={updateInfluencer} className="flex-1">
                          Update Influencer
                        </Button>
                        <Button onClick={cancelEdit} variant="outline">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={addInfluencer} className="flex-1">
                        Add Influencer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk-upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Bulk Upload Influencers</span>
                  </CardTitle>
                  <CardDescription>
                    Upload multiple influencers at once using a CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-select-bulk">Client *</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client for bulk upload" />
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

                  <div className="space-y-2">
                    <Label htmlFor="csv-upload">CSV File</Label>
                    <Input
                      id="csv-upload-input"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="cursor-pointer"
                    />
                    {csvFileName && (
                      <p className="text-sm text-gray-600">Selected: {csvFileName}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
                    <p className="text-sm text-gray-600 mb-2">Your CSV file should have the following columns (header row required):</p>
                    <code className="text-xs bg-white p-2 rounded border block">
                      Name,BusinessEmail,InstagramFollowers,TikTokFollowers,AverageViews,EngagementRate,InstagramUrl,TikTokUrl,Notes
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                      * Name, BusinessEmail, InstagramUrl, and TikTokUrl are required fields
                    </p>
                  </div>

                  {bulkUploadErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Upload Errors:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {bulkUploadErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="todays-list" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>Today's Prospects ({todaysInfluencers.length})</span>
                    </div>
                    {todaysInfluencers.length > 0 && (
                      <Button onClick={submitTodaysProspects} className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Submit All Prospects</span>
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Influencers added today that haven't been submitted yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todaysInfluencers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No new prospects added today.</p>
                      <p className="text-sm">Add some influencers to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todaysInfluencers.map((influencer) => (
                        <div key={influencer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium text-gray-900">{influencer.name}</h3>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {getClientName(influencer.client_id)}
                                </span>
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
                              {influencer.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">{influencer.notes}</p>
                              )}
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => editInfluencer(influencer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteInfluencerFromTodaysList(influencer.id)}
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
                    <span>Submission History</span>
                  </CardTitle>
                  <CardDescription>
                    View your past submissions and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No submissions yet.</p>
                      <p className="text-sm">Submit some prospects to see them here!</p>
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
                                {new Date(submission.submission_date).toLocaleDateString()} - {submission.influencer_count} prospects
                              </p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              Submitted
                            </span>
                          </div>
                          {submission.notes && (
                            <p className="text-sm text-gray-600 italic">{submission.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Submit Prospects Dialog */}
      <Dialog open={isSubmitProspectsDialogOpen} onOpenChange={setIsSubmitProspectsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Prospects Submitted!</span>
            </DialogTitle>
            <DialogDescription>
              Your prospects have been successfully submitted for admin review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>{prospectsToNotify.length} prospects</strong> have been submitted and are now pending admin review.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button asChild className="flex-1">
                <a href={generateMailtoLink()} className="flex items-center justify-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Notify Admin</span>
                </a>
              </Button>
              <DialogClose asChild>
                <Button variant="outline" onClick={handleDialogClose}>
                  Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPortal;
  }, [influencers]);

  useEffect(() => {
    localStorage.setItem('todaysInfluencers', JSON.stringify(todaysInfluencers));
  }, [todaysInfluencers]);

  useEffect(() => {
    localStorage.setItem('submittedInfluencers', JSON.stringify(submittedInfluencers));
  }, [submittedInfluencers]);

  const showNotification = (message, type = 'info', title = '') => {
    setAlert({ message, type, title });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isDuplicate = (newInfluencer, currentInfluencers) => {
    return currentInfluencers.some(inf => 
      inf.businessEmail.toLowerCase() === newInfluencer.businessEmail.toLowerCase() &&
      inf.clientId === newInfluencer.clientId
    );
  };

  const addInfluencer = () => {
    if (!selectedClient) {
      showNotification('Please select a client first.', 'error', 'Client Not Selected');
      return;
    }

    const { name, businessEmail, instagramFollowers, tiktokFollowers, averageViews, engagementRate, instagramUrl, tiktokUrl } = formData;

    if (!name || !businessEmail || !instagramUrl || !tiktokUrl) {
      showNotification('Name, Business Email, Instagram URL, and TikTok URL are required.', 'error', 'Missing Information');
      return;
    }

    const newInfluencer = {
      id: Date.now().toString(),
      clientId: selectedClient,
      name,
      businessEmail,
      instagramFollowers: parseInt(instagramFollowers) || 0,
      tiktokFollowers: parseInt(tiktokFollowers) || 0,
      averageViews: parseInt(averageViews) || 0,
      engagementRate: parseFloat(engagementRate) || 0,
      instagramUrl, // New field
      tiktokUrl,     // New field
      notes: formData.notes,
      dateAdded: new Date().toISOString().split('T')[0],
      submitted: false
    };

    if (isDuplicate(newInfluencer, influencers)) {
      showNotification('Influencer with this email already exists for the selected client.', 'warning', 'Duplicate Entry');
      return;
    }

    setInfluencers(prev => [...prev, newInfluencer]);
    setTodaysInfluencers(prev => [...prev, newInfluencer]);
    setFormData({
      name: '',
      businessEmail: '',
      instagramFollowers: '',
      tiktokFollowers: '',
      averageViews: '',
      engagementRate: '',
      instagramUrl: '',
      tiktokUrl: '',
      notes: ''
    });
    showNotification('Influencer added successfully!', 'success', 'Success');
    document.getElementById('influencer-name-input').focus(); // QoL: auto-focus
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setCsvFileName(file.name);
    showNotification(`File selected: ${file.name}`, 'info', 'CSV Ready');
  };

  const processCsv = () => {
    if (!csvFile) {
      showNotification('Please select a CSV file first.', 'error', 'No File Selected');
      return;
    }
    if (!selectedClient) {
      showNotification('Please select a client first.', 'error', 'Client Not Selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim());
      const newInfluencersFromCsv = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Mismatched column count. Skipping.`);
          continue;
        }

        const influencerData = headers.reduce((obj, header, index) => {
          obj[header.replace(/\s/g, '')] = values[index];
          return obj;
        }, {});

        const newInfluencer = {
          id: Date.now().toString() + i, // Unique ID for each row
          clientId: selectedClient,
          name: influencerData.Name || '',
          businessEmail: influencerData.BusinessEmail || '',
          instagramFollowers: parseInt(influencerData.InstagramFollowers) || 0,
          tiktokFollowers: parseInt(influencerData.TikTokFollowers) || 0,
          averageViews: parseInt(influencerData.AverageViews) || 0,
          engagementRate: parseFloat(influencerData.EngagementRate) || 0,
          instagramUrl: influencerData.InstagramUrl || '', // New field
          tiktokUrl: influencerData.TikTokUrl || '',     // New field
          notes: influencerData.Notes || '',
          dateAdded: new Date().toISOString().split('T')[0],
          submitted: false
        };

        if (!newInfluencer.name || !newInfluencer.businessEmail || !newInfluencer.instagramUrl || !newInfluencer.tiktokUrl) {
          errors.push(`Row ${i + 1}: Missing Name, Business Email, Instagram URL, or TikTok URL. Skipping.`);
          continue;
        }

        if (isDuplicate(newInfluencer, influencers)) {
          errors.push(`Row ${i + 1}: Influencer with email '${newInfluencer.businessEmail}' already exists for this client. Skipping.`); // Smarter redundancy
          continue;
        }
        newInfluencersFromCsv.push(newInfluencer);
      }

      if (newInfluencersFromCsv.length > 0) {
        setInfluencers(prev => [...prev, ...newInfluencersFromCsv]);
        setTodaysInfluencers(prev => [...prev, ...newInfluencersFromCsv]);
        showNotification(`${newInfluencersFromCsv.length} influencers added from CSV!`, 'success', 'Bulk Upload Complete');
      }
      if (errors.length > 0) {
        setBulkUploadErrors(errors);
        showNotification(`Bulk upload completed with ${errors.length} errors. Check the Bulk Upload tab for details.`, 'warning', 'Partial Success');
      } else if (newInfluencersFromCsv.length === 0) {
        showNotification('No new influencers were added from the CSV. Check for duplicates or format issues.', 'warning', 'No New Influencers');
      }
      setCsvFile(null);
      setCsvFileName('');
      document.getElementById('csv-upload-input').value = ''; // Clear file input
    };
    reader.readAsText(csvFile);
  };

  const submitTodaysProspects = () => {
    if (todaysInfluencers.length === 0) {
      showNotification('No new prospects to submit today.', 'warning', 'Nothing to Submit');
      return;
    }

    // Store prospects for notification email before clearing
    setProspectsToNotify([...todaysInfluencers]);

    const updatedTodaysInfluencers = todaysInfluencers.map(inf => ({ ...inf, submitted: true }));
    setSubmittedInfluencers(prev => [...prev, ...updatedTodaysInfluencers]);
    setInfluencers(prev => prev.map(inf => 
      updatedTodaysInfluencers.some(submittedInf => submittedInf.id === inf.id) ? { ...inf, submitted: true } : inf
    ));
    
    showNotification(`${updatedTodaysInfluencers.length} prospects successfully submitted! Admin has been notified.`, 'success', 'Submission Complete');
    setIsSubmitProspectsDialogOpen(true); // Open the dialog for admin notification
  };

  const handleDialogClose = () => {
    setTodaysInfluencers([]); // Clear the list only when the dialog is explicitly closed
    setProspectsToNotify([]); // Clear the notification content
    setIsSubmitProspectsDialogOpen(false);
  };

  const generateMailtoLink = () => {
    const adminEmail = 'mattbison@apimedia.io';
    const subject = 'New Influencer Prospects Ready for Review';
    const body = `Hello Admin,\n\n${prospectsToNotify.length} new influencer prospects have been submitted for review. Please check the Admin Dashboard.\n\nDetails:\n${prospectsToNotify.map(inf => `- ${inf.name} (${inf.businessEmail}) for ${clients.find(c => c.id === inf.clientId)?.name}`).join('\n')}\n\nThank you!`;
    return `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const deleteInfluencerFromTodaysList = (idToDelete) => {
    setTodaysInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
    showNotification('Influencer removed from today\'s submission list.', 'info', 'Removed');
  };

  const startEditInfluencer = (influencer) => {
    setFormData({
      name: influencer.name,
      businessEmail: influencer.businessEmail,
      instagramFollowers: influencer.instagramFollowers,
      tiktokFollowers: influencer.tiktokFollowers,
      averageViews: influencer.averageViews,
      engagementRate: influencer.engagementRate,
      instagramUrl: influencer.instagramUrl,
      tiktokUrl: influencer.tiktokUrl,
      notes: influencer.notes
    });
    setSelectedClient(influencer.clientId);
    setEditingInfluencerId(influencer.id);
    // Optionally switch to the Add Influencer tab if not already there
    // document.getElementById('addInfluencerTab').click(); 
    showNotification('Influencer data loaded for editing.', 'info', 'Editing Influencer');
  };

  const saveEditedInfluencer = () => {
    if (!editingInfluencerId) return;

    if (!selectedClient) {
      showNotification('Please select a client first.', 'error', 'Client Not Selected');
      return;
    }

    const { name, businessEmail, instagramFollowers, tiktokFollowers, averageViews, engagementRate, instagramUrl, tiktokUrl } = formData;

    if (!name || !businessEmail || !instagramUrl || !tiktokUrl) {
      showNotification('Name, Business Email, Instagram URL, and TikTok URL are required.', 'error', 'Missing Information');
      return;
    }

    const updatedInfluencer = {
      id: editingInfluencerId,
      clientId: selectedClient,
      name,
      businessEmail,
      instagramFollowers: parseInt(instagramFollowers) || 0,
      tiktokFollowers: parseInt(tiktokFollowers) || 0,
      averageViews: parseInt(averageViews) || 0,
      engagementRate: parseFloat(engagementRate) || 0,
      instagramUrl,
      tiktokUrl,
      notes: formData.notes,
      dateAdded: new Date().toISOString().split('T')[0],
      submitted: false // Assuming edits are for non-submitted prospects
    };

    // Check for duplicates, excluding the current influencer being edited
    const otherInfluencers = influencers.filter(inf => inf.id !== editingInfluencerId);
    if (isDuplicate(updatedInfluencer, otherInfluencers)) {
      showNotification('Another influencer with this email already exists for the selected client.', 'warning', 'Duplicate Entry');
      return;
    }

    setInfluencers(prev => prev.map(inf => inf.id === editingInfluencerId ? updatedInfluencer : inf));
    setTodaysInfluencers(prev => prev.map(inf => inf.id === editingInfluencerId ? updatedInfluencer : inf));
    setFormData({
      name: '', businessEmail: '', instagramFollowers: '', tiktokFollowers: '',
      averageViews: '', engagementRate: '', instagramUrl: '', tiktokUrl: '', notes: ''
    });
    setEditingInfluencerId(null);
    showNotification('Influencer updated successfully!', 'success', 'Update Complete');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {alert && <Notification message={alert.message} type={alert.type} title={alert.title} onClose={() => setAlert(null)} />}

      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Usario Partners: Team Portal</h1>

        <Card className="p-6 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Select Client</CardTitle>
            <CardDescription className="text-base text-gray-600">Choose the client you are working for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full text-lg h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Tabs defaultValue="addInfluencer" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-200 rounded-xl p-1">
            <TabsTrigger value="addInfluencer" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              Add New Influencer
            </TabsTrigger>
            <TabsTrigger value="bulkUpload" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="submitProspects" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              Submit Prospects ({todaysInfluencers.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="addInfluencer" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">{editingInfluencerId ? 'Edit Influencer' : 'Add New Influencer'}</CardTitle>
              <CardDescription className="text-base text-gray-600">{editingInfluencerId ? 'Edit details for the selected influencer.' : 'Enter details for a new influencer for the selected client.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="influencer-name-input" className="text-base font-medium mb-2 block">Name <span className="text-red-500">*</span></Label>
                  <Input id="influencer-name-input" name="name" value={formData.name} onChange={handleInputChange} placeholder="Influencer name" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="businessEmail" className="text-base font-medium mb-2 block">Business Email <span className="text-red-500">*</span></Label>
                  <Input id="businessEmail" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange} placeholder="business@email.com" type="email" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="instagramUrl" className="text-base font-medium mb-2 block">Instagram URL <span className="text-red-500">*</span></Label>
                  <Input id="instagramUrl" name="instagramUrl" value={formData.instagramUrl} onChange={handleInputChange} placeholder="https://instagram.com/user" type="url" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="tiktokUrl" className="text-base font-medium mb-2 block">TikTok URL <span className="text-red-500">*</span></Label>
                  <Input id="tiktokUrl" name="tiktokUrl" value={formData.tiktokUrl} onChange={handleInputChange} placeholder="https://tiktok.com/@user" type="url" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="instagramFollowers" className="text-base font-medium mb-2 block">Instagram Followers</Label>
                  <Input id="instagramFollowers" name="instagramFollowers" value={formData.instagramFollowers} onChange={handleInputChange} placeholder="0" type="number" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="tiktokFollowers" className="text-base font-medium mb-2 block">TikTok Followers</Label>
                  <Input id="tiktokFollowers" name="tiktokFollowers" value={formData.tiktokFollowers} onChange={handleInputChange} placeholder="0" type="number" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="averageViews" className="text-base font-medium mb-2 block">Average Views (Last 10 Posts)</Label>
                  <Input id="averageViews" name="averageViews" value={formData.averageViews} onChange={handleInputChange} placeholder="0" type="number" className="h-10 text-base" />
                </div>
                <div>
                  <Label htmlFor="engagementRate" className="text-base font-medium mb-2 block">Engagement Rate (%)</Label>
                  <Input id="engagementRate" name="engagementRate" value={formData.engagementRate} onChange={handleInputChange} placeholder="0.0" type="number" step="0.1" className="h-10 text-base" />
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-base font-medium mb-2 block">Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional notes about the influencer..." rows="4" className="text-base" />
              </div>
              {editingInfluencerId ? (
                <Button onClick={saveEditedInfluencer} className="w-full py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
                  <Edit className="h-5 w-5 mr-2" /> Save Changes
                </Button>
              ) : (
                <Button onClick={addInfluencer} className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                  <UserPlus className="h-5 w-5 mr-2" /> Add Influencer
                </Button>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="bulkUpload" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Bulk Upload Influencers</CardTitle>
              <CardDescription className="text-base text-gray-600">Upload a CSV file to add multiple influencers at once. Ensure the CSV has 'Name', 'Business Email', 'InstagramUrl', 'TikTokUrl', 'Instagram Followers', 'TikTok Followers', 'Average Views', 'Engagement Rate', 'Notes' columns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="csv-upload-input" className="cursor-pointer text-blue-600 hover:text-blue-800 text-lg font-medium">
                  {csvFileName ? csvFileName : 'Click to select a CSV file'}
                </Label>
                <Input id="csv-upload-input" type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                {csvFileName && <p className="text-sm text-gray-500 mt-2">{csvFileName}</p>}
              </div>
              <Button onClick={processCsv} disabled={!csvFile} className="w-full py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
                Process CSV
              </Button>
              {bulkUploadErrors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Bulk Upload Errors:</h3>
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {bulkUploadErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="submitProspects" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Submit Today's Prospects</CardTitle>
              <CardDescription className="text-base text-gray-600">Review and submit influencers added today for the selected client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <p className="text-xl font-semibold text-blue-800">Ready to Submit</p>
                <p className="text-xl font-bold text-blue-800">{todaysInfluencers.length} prospects</p>
              </div>
              {todaysInfluencers.length > 0 && (
                <div className="space-y-4">
                  {todaysInfluencers.map(inf => (
                    <div key={inf.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                      <div>
                        <p className="font-medium text-lg">{inf.name}</p>
                        <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {inf.instagramFollowers?.toLocaleString()} IG • {inf.tiktokFollowers?.toLocaleString()} TT • {inf.engagementRate}% engagement
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">{getClientName(inf.clientId)}</span>
                        <Button variant="ghost" size="icon" onClick={() => startEditInfluencer(inf)} title="Edit Influencer">
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteInfluencerFromTodaysList(inf.id)} title="Remove from list">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={isSubmitProspectsDialogOpen} onOpenChange={setIsSubmitProspectsDialogOpen}> {/* Keep dialog open until explicitly closed by user */}
                <DialogTrigger asChild>
                  <Button onClick={submitTodaysProspects} disabled={todaysInfluencers.length === 0} className="w-full py-3 text-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200">
                    <Send className="h-5 w-5 mr-2" /> Submit New Prospects
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Prospects Submitted!</DialogTitle>
                    <DialogDescription className="text-base text-gray-600">
                      Your new prospects have been submitted. Click below to notify the admin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <a 
                      href={generateMailtoLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-lg font-medium\
                                 ring-offset-background transition-colors focus-visible:outline-none\
                                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2\
                                 disabled:pointer-events-none disabled:opacity-50\
                                 bg-blue-500 text-white hover:bg-blue-600 h-12 px-6 py-3"
                      onClick={() => showNotification('Email client opened. Please send the email to notify the admin.', 'info', 'Email Notification')}
                    >
                      <Mail className="h-5 w-5 mr-2" /> Notify Admin by Email
                    </a>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" className="py-3 text-lg" onClick={handleDialogClose}> {/* Call handleDialogClose on explicit close */}
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </TabsContent>

          <TabsContent value="history" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Submission History</CardTitle>
              <CardDescription className="text-base text-gray-600">View all previously submitted influencer prospects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submittedInfluencers.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-lg">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {submittedInfluencers.map(inf => (
                    <div key={inf.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                      <div>
                        <p className="font-medium text-lg">{inf.name}</p>
                        <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {inf.instagramFollowers?.toLocaleString()} IG • {inf.tiktokFollowers?.toLocaleString()} TT • {inf.engagementRate}% engagement
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-700">{getClientName(inf.clientId)}</span>
                        <p className="text-xs text-gray-500 mt-1">Submitted: {inf.dateAdded}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamPortal;


