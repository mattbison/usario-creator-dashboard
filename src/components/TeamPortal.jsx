import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Plus, Upload, Send, History, AlertTriangle, CheckCircle } from 'lucide-react'

const TeamPortal = () => {
  const [selectedClient, setSelectedClient] = useState('')
  const [influencers, setInfluencers] = useState([])
  const [todaysInfluencers, setTodaysInfluencers] = useState([])
  const [submittedInfluencers, setSubmittedInfluencers] = useState([])
  const [alert, setAlert] = useState(null)

  // Mock clients data
  const clients = [
    { id: 'client1', name: 'TechBrand Co.' },
    { id: 'client2', name: 'Fashion Forward' },
    { id: 'client3', name: 'Fitness Plus' }
  ]

  const [formData, setFormData] = useState({
    name: '',
    businessEmail: '',
    instagramFollowers: '',
    tiktokFollowers: '',
    averageViews: '',
    engagementRate: '',
    notes: ''
  })

  useEffect(() => {
    // Load data from localStorage
    const savedInfluencers = localStorage.getItem('influencers')
    const savedTodaysInfluencers = localStorage.getItem('todaysInfluencers')
    const savedSubmittedInfluencers = localStorage.getItem('submittedInfluencers')
    
    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers))
    if (savedTodaysInfluencers) setTodaysInfluencers(JSON.parse(savedTodaysInfluencers))
    if (savedSubmittedInfluencers) setSubmittedInfluencers(JSON.parse(savedSubmittedInfluencers))
  }, [])

  const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data))
  }

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const checkDuplicate = (email) => {
    return influencers.some(inf => inf.businessEmail.toLowerCase() === email.toLowerCase())
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      businessEmail: '',
      instagramFollowers: '',
      tiktokFollowers: '',
      averageViews: '',
      engagementRate: '',
      notes: ''
    })
  }

  const addInfluencer = () => {
    if (!selectedClient) {
      showAlert('Please select a client first', 'error')
      return
    }

    if (!formData.name || !formData.businessEmail) {
      showAlert('Name and Business Email are required', 'error')
      return
    }

    if (checkDuplicate(formData.businessEmail)) {
      showAlert('Duplicate found! An influencer with this email already exists', 'error')
      return
    }

    const newInfluencer = {
      id: Date.now(),
      ...formData,
      clientId: selectedClient,
      dateAdded: new Date().toISOString().split('T')[0],
      submitted: false
    }

    const updatedInfluencers = [...influencers, newInfluencer]
    const updatedTodaysInfluencers = [...todaysInfluencers, newInfluencer]

    setInfluencers(updatedInfluencers)
    setTodaysInfluencers(updatedTodaysInfluencers)
    
    saveToStorage('influencers', updatedInfluencers)
    saveToStorage('todaysInfluencers', updatedTodaysInfluencers)

    resetForm()
    showAlert('Influencer added successfully!', 'success')
  }

  const handleBulkUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!selectedClient) {
      showAlert('Please select a client first', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target.result
        const lines = csv.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        const newInfluencers = []
        const duplicates = []

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue
          
          const values = lines[i].split(',').map(v => v.trim())
          const influencer = {
            id: Date.now() + i,
            name: values[0] || '',
            businessEmail: values[1] || '',
            instagramFollowers: values[2] || '',
            tiktokFollowers: values[3] || '',
            averageViews: values[4] || '',
            engagementRate: values[5] || '',
            notes: values[6] || '',
            clientId: selectedClient,
            dateAdded: new Date().toISOString().split('T')[0],
            submitted: false
          }

          if (checkDuplicate(influencer.businessEmail)) {
            duplicates.push(influencer.businessEmail)
          } else {
            newInfluencers.push(influencer)
          }
        }

        if (duplicates.length > 0) {
          showAlert(`Found ${duplicates.length} duplicates. Only new influencers were added.`, 'warning')
        }

        if (newInfluencers.length > 0) {
          const updatedInfluencers = [...influencers, ...newInfluencers]
          const updatedTodaysInfluencers = [...todaysInfluencers, ...newInfluencers]

          setInfluencers(updatedInfluencers)
          setTodaysInfluencers(updatedTodaysInfluencers)
          
          saveToStorage('influencers', updatedInfluencers)
          saveToStorage('todaysInfluencers', updatedTodaysInfluencers)

          showAlert(`Successfully added ${newInfluencers.length} influencers!`, 'success')
        }
      } catch (error) {
        showAlert('Error processing CSV file. Please check the format.', 'error')
      }
    }
    reader.readAsText(file)
  }

  const submitTodaysProspects = () => {
    if (todaysInfluencers.length === 0) {
      showAlert('No new prospects to submit today', 'warning')
      return
    }

    // Mark today's influencers as submitted
    const submittedToday = todaysInfluencers.map(inf => ({ ...inf, submitted: true }))
    const updatedSubmitted = [...submittedInfluencers, ...submittedToday]
    
    setSubmittedInfluencers(updatedSubmitted)
    setTodaysInfluencers([])
    
    saveToStorage('submittedInfluencers', updatedSubmitted)
    saveToStorage('todaysInfluencers', [])

    // Simulate notification (in real app, this would send email/Slack)
    showAlert(`Successfully submitted ${submittedToday.length} prospects! Admin has been notified.`, 'success')
  }

  const getTodaysUnsubmitted = () => {
    return todaysInfluencers.filter(inf => !inf.submitted)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {alert && (
        <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-500' : alert.type === 'success' ? 'border-green-500' : 'border-yellow-500'}`}>
          {alert.type === 'error' && <AlertTriangle className="h-4 w-4" />}
          {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <Label htmlFor="client-select">Select Client</Label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose a client..." />
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

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="add">Add Influencer</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          <TabsTrigger value="submit">Submit Prospects</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Influencer
              </CardTitle>
              <CardDescription>
                Add influencer details for {selectedClient ? clients.find(c => c.id === selectedClient)?.name : 'selected client'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Influencer name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    placeholder="business@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram Followers</Label>
                  <Input
                    id="instagram"
                    type="number"
                    value={formData.instagramFollowers}
                    onChange={(e) => handleInputChange('instagramFollowers', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="tiktok">TikTok Followers</Label>
                  <Input
                    id="tiktok"
                    type="number"
                    value={formData.tiktokFollowers}
                    onChange={(e) => handleInputChange('tiktokFollowers', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="views">Average Views (Last 10 Posts)</Label>
                  <Input
                    id="views"
                    type="number"
                    value={formData.averageViews}
                    onChange={(e) => handleInputChange('averageViews', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="engagement">Engagement Rate (%)</Label>
                  <Input
                    id="engagement"
                    type="number"
                    step="0.1"
                    value={formData.engagementRate}
                    onChange={(e) => handleInputChange('engagementRate', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about the influencer..."
                  rows={3}
                />
              </div>
              <Button onClick={addInfluencer} className="w-full" disabled={!selectedClient}>
                <Plus className="h-4 w-4 mr-2" />
                Add Influencer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Upload
              </CardTitle>
              <CardDescription>
                Upload multiple influencers via CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-lg font-medium">Choose CSV file</span>
                  <p className="text-sm text-gray-500 mt-2">
                    CSV should have columns: Name, Business Email, Instagram Followers, TikTok Followers, Average Views, Engagement Rate, Notes
                  </p>
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleBulkUpload}
                  className="hidden"
                  disabled={!selectedClient}
                />
              </div>
              {!selectedClient && (
                <p className="text-sm text-red-500">Please select a client first</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Submit Today's Prospects
              </CardTitle>
              <CardDescription>
                Review and submit influencers added today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">Ready to Submit</p>
                  <p className="text-sm text-gray-600">
                    {getTodaysUnsubmitted().length} new prospects added today
                  </p>
                </div>
                <Badge variant="secondary">
                  {getTodaysUnsubmitted().length} prospects
                </Badge>
              </div>
              
              {getTodaysUnsubmitted().length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Today's Prospects:</h4>
                  {getTodaysUnsubmitted().map(inf => (
                    <div key={inf.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{inf.name}</p>
                        <p className="text-sm text-gray-600">{inf.businessEmail}</p>
                      </div>
                      <Badge variant="outline">
                        {clients.find(c => c.id === inf.clientId)?.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={submitTodaysProspects} 
                className="w-full" 
                disabled={getTodaysUnsubmitted().length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit New Prospects
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Submission History
              </CardTitle>
              <CardDescription>
                View all previously submitted prospects
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
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {clients.find(c => c.id === inf.clientId)?.name}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Added: {inf.dateAdded}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TeamPortal

