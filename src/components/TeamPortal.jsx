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

// Custom Notification Component
const Notification = ({ message, type, title, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Allow time for fade-out animation
    }, 5000); // Notification visible for 5 seconds

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
  const [selectedClient, setSelectedClient] = useState('');
  const [influencers, setInfluencers] = useState([]);
  const [todaysInfluencers, setTodaysInfluencers] = useState([]);
  const [submittedInfluencers, setSubmittedInfluencers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    businessEmail: '',
    instagramFollowers: '',
    tiktokFollowers: '',
    averageViews: '',
    engagementRate: '',
    instagramUrl: '', // New field
    tiktokUrl: '',     // New field
    notes: ''
  });
  const [alert, setAlert] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState([]);
  const [isSubmitProspectsDialogOpen, setIsSubmitProspectsDialogOpen] = useState(false);
  const [editingInfluencerId, setEditingInfluencerId] = useState(null); // For edit functionality
  const [prospectsToNotify, setProspectsToNotify] = useState([]); // New state for notification content

  const clients = [
    { id: 'client1', name: 'TechBrand Co.' },
    { id: 'client2', name: 'Fashion Forward' },
    { id: 'client3', name: 'Fitness Plus' }
  ];

  useEffect(() => {
    const savedInfluencers = localStorage.getItem('influencers');
    const savedTodaysInfluencers = localStorage.getItem('todaysInfluencers');
    const savedSubmittedInfluencers = localStorage.getItem('submittedInfluencers');

    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers));
    if (savedTodaysInfluencers) setTodaysInfluencers(JSON.parse(savedTodaysInfluencers));
    if (savedSubmittedInfluencers) setSubmittedInfluencers(JSON.parse(savedSubmittedInfluencers));
  }, []);

  useEffect(() => {
    localStorage.setItem('influencers', JSON.stringify(influencers));
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
                  <Label htmlFor="averageViews" className="text-base font-medium mb-2 block">Average Views (Last 10 Posts )</Label>
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
              <Dialog open={isSubmitProspectsDialogOpen} onOpenChange={handleDialogClose}> {/* Use handleDialogClose here */}
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
                    >
                      <Mail className="h-5 w-5 mr-2" /> Notify Admin by Email
                    </a>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" className="py-3 text-lg">
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
