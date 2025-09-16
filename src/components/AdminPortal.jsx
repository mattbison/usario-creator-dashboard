import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Trash2, UserPlus, Users, Briefcase, History, CheckCircle, XCircle, Download, Info, AlertTriangle, ChevronDown, ChevronUp, PlusCircle, Edit, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog.jsx';

// Custom Notification Component (copied from TeamPortal for consistency)
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

const AdminPortal = () => {
  const [influencers, setInfluencers] = useState([]); // All influencers in the system
  const [vas, setVAs] = useState([]); // Virtual Assistants
  const [clients, setClients] = useState([
    { id: 'client1', name: 'TechBrand Co.' },
    { id: 'client2', name: 'Fashion Forward' },
    { id: 'client3', name: 'Fitness Plus' }
  ]);
  const [newVaName, setNewVaName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [vaToAssignClient, setVaToAssignClient] = useState(null);
  const [clientToAssign, setClientToAssign] = useState('');
  const [isAssignClientDialogOpen, setIsAssignClientDialogOpen] = useState(false);
  const [isAddVaDialogOpen, setIsAddVaDialogOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [alert, setAlert] = useState(null); // For notifications
  const [expandedSubmission, setExpandedSubmission] = useState(null); // For submission history
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // New state for export filters
  const [exportVaFilter, setExportVaFilter] = useState('');
  const [exportClientFilter, setExportClientFilter] = useState('');

  useEffect(() => {
    const savedInfluencers = localStorage.getItem('influencers');
    const savedVAs = localStorage.getItem('vas');
    const savedClients = localStorage.getItem('clients');

    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers));
    if (savedVAs) setVAs(JSON.parse(savedVAs));
    if (savedClients) setClients(JSON.parse(savedClients));
  }, []);

  useEffect(() => {
    localStorage.setItem('influencers', JSON.stringify(influencers));
  }, [influencers]);

  useEffect(() => {
    localStorage.setItem('vas', JSON.stringify(vas));
  }, [vas]);

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  const showNotification = (message, type = 'info', title = '') => {
    setAlert({ message, type, title });
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getVaName = (vaId) => {
    const va = vas.find(v => v.id === vaId);
    return va ? va.name : 'Unknown VA';
  };

  // VA Management Functions
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

  // Client Management Functions
  const addClient = () => {
    if (newClientName.trim() === '') {
      showNotification('Client name cannot be empty.', 'error', 'Error Adding Client');
      return;
    }
    const newClient = { id: Date.now().toString(), name: newClientName };
    setClients(prev => [...prev, newClient]);
    setNewClientName('');
    setIsAddClientDialogOpen(false);
    showNotification(`Client '${newClientName}' added successfully!`, 'success', 'Client Added');
  };

  const deleteClient = (clientId) => {
    const clientName = getClientName(clientId);
    // Remove client from all VAs
    setVAs(prev => prev.map(va => ({ ...va, assignedClients: va.assignedClients.filter(id => id !== clientId) })));
    // Remove client from all influencers
    setInfluencers(prev => prev.filter(inf => (inf.clientIds || [inf.clientId]).includes(clientId)));
    setClients(prev => prev.filter(client => client.id !== clientId));
    showNotification(`Client '${clientName}' and associated data deleted.`, 'success', 'Client Deleted');
  };

  // Influencer Management Functions
  const deleteInfluencer = (idToDelete) => {
    const influencerName = influencers.find(inf => inf.id === idToDelete)?.name || 'Influencer';
    setInfluencers(prev => prev.filter(inf => inf.id !== idToDelete));
    showNotification(`${influencerName} deleted successfully.`, 'success', 'Influencer Deleted');
  };

  // Data Export Functions
  const exportInfluencersToCsv = (data, filename) => {
    if (data.length === 0) {
      showNotification('No influencers to export.', 'warning', 'Export Failed');
      return;
    }
    const headers = ["Name", "Business Email", "Instagram Followers", "TikTok Followers", "Average Views", "Engagement Rate", "Instagram URL", "TikTok URL", "Notes", "Client(s)", "Date Added"];
    const rows = data.map(inf => {
      const clientNames = (inf.clientIds || [inf.clientId]).map(id => getClientName(id)).join(', ');
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
      ];
    });

    let csvContent = headers.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`${filename} exported successfully!`, 'success', 'Export Complete');
  };

  // Group influencers by VA and date for history tab
  const getGroupedSubmissions = () => {
    // Assuming influencers now have a vaId and dateAdded from TeamPortal submission
    const grouped = influencers.reduce((acc, inf) => {
      if (!inf.vaId || !inf.dateAdded) return acc; // Only process submitted influencers with VA info

      const vaId = inf.vaId;
      const date = inf.dateAdded;
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

  // Filtered influencers for export
  const getFilteredInfluencers = () => {
    let filtered = [...influencers];

    if (exportVaFilter) {
      filtered = filtered.filter(inf => inf.vaId === exportVaFilter);
    }
    if (exportClientFilter) {
      filtered = filtered.filter(inf => (inf.clientIds || [inf.clientId]).includes(exportClientFilter));
    }
    return filtered;
  };

  const handleClearFilters = () => {
    setExportVaFilter('');
    setExportClientFilter('');
    showNotification('Export filters cleared.', 'info', 'Filters Cleared');
  };

  // Sorting logic for All Influencers table
  const sortedInfluencers = [...influencers].sort((a, b) => {
    if (!sortBy) return 0;

    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'clientIds') {
      valA = (a.clientIds || [a.clientId]).map(id => getClientName(id)).join(', ');
      valB = (b.clientIds || [b.clientId]).map(id => getClientName(id)).join(', ');
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (typeof valA === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });

  // Overview Stats
  const totalUniqueInfluencersCount = influencers.length;
  const totalClientsCount = clients.length;
  const totalVAsCount = vas.length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {alert && <Notification message={alert.message} type={alert.type} title={alert.title} onClose={() => setAlert(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Usario Partners: Admin Portal</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Total Unique Influencers</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{totalUniqueInfluencersCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Total Clients</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{totalClientsCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-gray-500">Total VAs</CardDescription>
              <CardTitle className="text-3xl font-bold text-gray-900">{totalVAsCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="allInfluencers" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-14 bg-gray-200 rounded-xl p-1">
            <TabsTrigger value="allInfluencers" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <Users className="h-5 w-5 mr-2" /> All Influencers
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <Briefcase className="h-5 w-5 mr-2" /> Clients
            </TabsTrigger>
            <TabsTrigger value="vaManagement" className="text-lg font-medium data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 rounded-lg transition-all duration-200">
              <UserPlus className="h-5 w-5 mr-2" /> VA Management
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
              <CardDescription className="text-base text-gray-600">A comprehensive list of all influencers in your database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {influencers.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-lg">No influencers added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                          Name {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('businessEmail')}>
                          Email {sortBy === 'businessEmail' && (sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IG Followers</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TT Followers</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Views</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IG URL</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TT URL</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('clientIds')}>
                          Client(s) {sortBy === 'clientIds' && (sortOrder === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />)}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedInfluencers.map(inf => (
                        <tr key={inf.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inf.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inf.businessEmail}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inf.instagramFollowers?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inf.tiktokFollowers?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inf.averageViews?.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inf.engagementRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline"><a href={inf.instagramUrl} target="_blank" rel="noopener noreferrer">Link</a></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:underline"><a href={inf.tiktokUrl} target="_blank" rel="noopener noreferrer">Link</a></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={inf.notes}>{inf.notes}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(inf.clientIds || [inf.clientId]).map(id => getClientName(id)).join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inf.dateAdded}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="destructive" size="icon" onClick={() => deleteInfluencer(inf.id)} title="Delete Influencer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Clients</CardTitle>
              <CardDescription className="text-base text-gray-600">Manage your clients and their associated VAs and influencers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                    <PlusCircle className="h-5 w-5 mr-2" /> Add New Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>Enter the name of the new client.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input id="clientName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="e.g., Brand X" />
                  </div>
                  <DialogFooter>
                    <Button onClick={addClient}>Add Client</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-lg col-span-full">No clients added yet.</p>
                ) : (
                  clients.map(client => (
                    <Card key={client.id} className="p-4 shadow-sm rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{client.name}</h3>
                        <Button variant="destructive" size="icon" onClick={() => deleteClient(client.id)} title="Delete Client">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">Assigned VAs: {vas.filter(va => va.assignedClients.includes(client.id)).length}</p>
                      <p className="text-sm text-gray-600">Associated Influencers: {influencers.filter(inf => (inf.clientIds || [inf.clientId]).includes(client.id)).length}</p>
                      {/* Add more client-specific details here if needed */}
                    </Card>
                  ))
                )}
              </div>
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
              <CardDescription className="text-base text-gray-600">Download your influencer data in CSV format with filters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exportVaFilter">Filter by VA</Label>
                  <Select value={exportVaFilter} onValueChange={setExportVaFilter}>
                    <SelectTrigger id="exportVaFilter">
                      <SelectValue placeholder="Select a VA (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All VAs</SelectItem>
                      {vas.map(va => (
                        <SelectItem key={va.id} value={va.id}>
                          {va.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="exportClientFilter">Filter by Client</Label>
                  <Select value={exportClientFilter} onValueChange={setExportClientFilter}>
                    <SelectTrigger id="exportClientFilter">
                      <SelectValue placeholder="Select a Client (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Clients</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleClearFilters} variant="outline" className="w-full py-3 text-lg font-semibold">
                <Filter className="h-5 w-5 mr-2" /> Clear Filters
              </Button>
              <Button onClick={() => exportInfluencersToCsv(getFilteredInfluencers(), 'filtered_influencers.csv')} className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                <Download className="h-5 w-5 mr-2" /> Export Filtered Influencers (CSV)
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPortal;
