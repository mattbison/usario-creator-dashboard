import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Shield, Users, Building2, Download, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

const AdminPortal = () => {
  const [influencers, setInfluencers] = useState([])
  const [submittedInfluencers, setSubmittedInfluencers] = useState([])
  const [clients, setClients] = useState([
    { id: 'client1', name: 'TechBrand Co.', teamMembers: ['VA1', 'VA2'] },
    { id: 'client2', name: 'Fashion Forward', teamMembers: ['VA3'] },
    { id: 'client3', name: 'Fitness Plus', teamMembers: ['VA1'] }
  ])
  const [newClientName, setNewClientName] = useState('')
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    // Load data from localStorage
    const savedInfluencers = localStorage.getItem('influencers')
    const savedSubmittedInfluencers = localStorage.getItem('submittedInfluencers')
    
    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers))
    if (savedSubmittedInfluencers) setSubmittedInfluencers(JSON.parse(savedSubmittedInfluencers))
  }, [])

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const addClient = () => {
    if (!newClientName.trim()) {
      showAlert('Please enter a client name', 'error')
      return
    }

    const newClient = {
      id: `client${Date.now()}`,
      name: newClientName.trim(),
      teamMembers: []
    }

    setClients([...clients, newClient])
    setNewClientName('')
    showAlert('Client added successfully!', 'success')
  }

  const removeClient = (clientId) => {
    setClients(clients.filter(c => c.id !== clientId))
    showAlert('Client removed successfully!', 'success')
  }

  const exportData = (type) => {
    let data = []
    let filename = ''

    switch (type) {
      case 'all_influencers':
        data = [...influencers, ...submittedInfluencers]
        filename = 'all_influencers.csv'
        break
      case 'submitted_only':
        data = submittedInfluencers
        filename = 'submitted_influencers.csv'
        break
      case 'pending_only':
        data = influencers.filter(inf => !inf.submitted)
        filename = 'pending_influencers.csv'
        break
    }

    if (data.length === 0) {
      showAlert('No data to export', 'warning')
      return
    }

    // Convert to CSV
    const headers = ['Name', 'Business Email', 'Instagram Followers', 'TikTok Followers', 'Average Views', 'Engagement Rate', 'Notes', 'Client', 'Date Added', 'Status']
    const csvContent = [
      headers.join(','),
      ...data.map(inf => [
        inf.name,
        inf.businessEmail,
        inf.instagramFollowers,
        inf.tiktokFollowers,
        inf.averageViews,
        inf.engagementRate,
        `"${inf.notes}"`,
        clients.find(c => c.id === inf.clientId)?.name || 'Unknown',
        inf.dateAdded,
        inf.submitted ? 'Submitted' : 'Pending'
      ].join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    showAlert(`Exported ${data.length} records to ${filename}`, 'success')
  }

  const getClientStats = (clientId) => {
    const clientInfluencers = [...influencers, ...submittedInfluencers].filter(inf => inf.clientId === clientId)
    const submitted = clientInfluencers.filter(inf => inf.submitted).length
    const pending = clientInfluencers.filter(inf => !inf.submitted).length
    
    return {
      total: clientInfluencers.length,
      submitted,
      pending
    }
  }

  const getAllStats = () => {
    const allInfluencers = [...influencers, ...submittedInfluencers]
    return {
      totalInfluencers: allInfluencers.length,
      totalSubmitted: submittedInfluencers.length,
      totalPending: influencers.filter(inf => !inf.submitted).length,
      totalClients: clients.length
    }
  }

  const stats = getAllStats()

  return (
    <div className="max-w-7xl mx-auto p-6">
      {alert && (
        <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-500' : alert.type === 'success' ? 'border-green-500' : 'border-yellow-500'}`}>
          {alert.type === 'error' && <AlertTriangle className="h-4 w-4" />}
          {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalSubmitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="influencers">All Influencers</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client Management
              </CardTitle>
              <CardDescription>
                Manage clients and assign team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New client name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addClient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>

              <div className="space-y-4">
                {clients.map(client => {
                  const clientStats = getClientStats(client.id)
                  return (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{client.name}</h3>
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span>Total: {clientStats.total}</span>
                          <span className="text-green-600">Submitted: {clientStats.submitted}</span>
                          <span className="text-yellow-600">Pending: {clientStats.pending}</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {client.teamMembers.map(member => (
                            <Badge key={member} variant="outline">{member}</Badge>
                          ))}
                          {client.teamMembers.length === 0 && (
                            <Badge variant="outline">No team members assigned</Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influencers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Influencers
              </CardTitle>
              <CardDescription>
                Complete list of all influencers across all clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {[...influencers, ...submittedInfluencers].length === 0 ? (
                <p className="text-gray-500 text-center py-8">No influencers found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Instagram</TableHead>
                      <TableHead>TikTok</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...influencers, ...submittedInfluencers].map(inf => (
                      <TableRow key={inf.id}>
                        <TableCell className="font-medium">{inf.name}</TableCell>
                        <TableCell>{inf.businessEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {clients.find(c => c.id === inf.clientId)?.name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{inf.instagramFollowers?.toLocaleString() || '0'}</TableCell>
                        <TableCell>{inf.tiktokFollowers?.toLocaleString() || '0'}</TableCell>
                        <TableCell>{inf.engagementRate}%</TableCell>
                        <TableCell>{inf.dateAdded}</TableCell>
                        <TableCell>
                          <Badge variant={inf.submitted ? 'default' : 'secondary'}>
                            {inf.submitted ? 'Submitted' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Submission History
              </CardTitle>
              <CardDescription>
                All submitted influencer prospects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submittedInfluencers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No submissions yet</p>
              ) : (
                <div className="space-y-2">
                  {submittedInfluencers.map(inf => (
                    <div key={inf.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{inf.name}</p>
                        <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                        <p className="text-xs text-gray-500">
                          {inf.instagramFollowers?.toLocaleString()} IG • {inf.tiktokFollowers?.toLocaleString()} TT • {inf.engagementRate}% engagement
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {clients.find(c => c.id === inf.clientId)?.name || 'Unknown'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Submitted: {inf.dateAdded}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download influencer data in CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => exportData('all_influencers')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All Influencers
                </Button>
                <Button 
                  onClick={() => exportData('submitted_only')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Submitted Only
                </Button>
                <Button 
                  onClick={() => exportData('pending_only')}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Pending Only
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Export includes: Name, Email, Follower counts, Engagement rate, Notes, Client, Date added, and Status</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPortal
