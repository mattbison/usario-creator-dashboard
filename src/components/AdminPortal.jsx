import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Trash2, Edit, UserPlus, Users, Briefcase, History, CheckCircle, Clock, XCircle, Download, PlusCircle, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx';

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
  const [influencers, setInfluencers] = useState([]);
  const [submittedInfluencers, setSubmittedInfluencers] = useState([]);
  const [vas, setVAs] = useState([]); // New state for VAs
  const [clients, setClients] = useState([
    { id: 'client1', name: 'TechBrand Co.' },
    { id: 'client2', name: 'Fashion Forward' },
    { id: 'client3', name: 'Fitness Plus' }
  ]);
  const [selectedVa, setSelectedVa] = useState('');
  const [newVaName, setNewVaName] = useState('');
  const [vaToAssignClient, setVaToAssignClient] = useState(null);
  const [clientToAssign, setClientToAssign] = useState('');
  const [isAssignClientDialogOpen, setIsAssignClientDialogOpen] = useState(false);
  const [isAddVaDialogOpen, setIsAddVaDialogOpen] = useState(false);
  const [alert, setAlert] = useState(null); // For notifications
  const [expandedSubmission, setExpandedSubmission] = useState(null); // For submission history
  const [expandedInfluencerClients, setExpandedInfluencerClients] = useState({}); // For multiple clients per influencer

  useEffect(() => {
    const savedInfluencers = localStorage.getItem('influencers');
    const savedSubmittedInfluencers = localStorage.getItem('submittedInfluencers');
    const savedVAs = localStorage.getItem('vas');

    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers));
    if (savedSubmittedInfluencers) setSubmittedInfluencers(JSON.parse(savedSubmittedInfluencers));
    if (savedVAs) setVAs(JSON.parse(savedVAs));
  }, []);

  useEffect(() => {
    localStorage.setItem('influencers', JSON.stringify(influencers));
  }, [influencers]);

  useEffect(() => {
    localStorage.setItem('submittedInfluencers', JSON.stringify(submittedInfluencers));
  }, [submittedInfluencers]);

  useEffect(() => {
    localStorage.setItem('vas', JSON.stringify(vas));
  }, [vas]);

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
