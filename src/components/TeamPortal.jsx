import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx'
import { CheckCircle, AlertTriangle, Info, Upload, History, Mail, UserPlus, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx'

const TeamPortal = () => {
  const [selectedClient, setSelectedClient] = useState('')
  const [influencers, setInfluencers] = useState([])
  const [todaysInfluencers, setTodaysInfluencers] = useState([])
  const [submittedInfluencers, setSubmittedInfluencers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    businessEmail: '',
    instagramFollowers: '',
    tiktokFollowers: '',
    averageViews: '',
    engagementRate: '',
    notes: ''
  })
  const [alert, setAlert] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [csvFileName, setCsvFileName] = useState('')
  const [bulkUploadErrors, setBulkUploadErrors] = useState([])
  const [isSubmitProspectsDialogOpen, setIsSubmitProspectsDialogOpen] = useState(false)

  const clients = [
    { id: 'client1', name: 'TechBrand Co.' },
    { id: 'client2', name: 'Fashion Forward' },
    { id: 'client3', name: 'Fitness Plus' }
  ]

  useEffect(() => {
    const savedInfluencers = localStorage.getItem('influencers')
    const savedTodaysInfluencers = localStorage.getItem('todaysInfluencers')
    const savedSubmittedInfluencers = localStorage.getItem('submittedInfluencers')

    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers))
    if (savedTodaysInfluencers) setTodaysInfluencers(JSON.parse(savedTodaysInfluencers))
    if (savedSubmittedInfluencers) setSubmittedInfluencers(JSON.parse(savedSubmittedInfluencers))
  }, [])

  useEffect(() => {
    localStorage.setItem('influencers', JSON.stringify(influencers))
  }, [influencers])

  useEffect(() => {
    localStorage.setItem('todaysInfluencers', JSON.stringify(todaysInfluencers))
  }, [todaysInfluencers])

  useEffect(() => {
    localStorage.setItem('submittedInfluencers', JSON.stringify(submittedInfluencers))
  }, [submittedInfluencers])

  const showAlert = (message, type = 'info', title = '') => {
    setAlert({ message, type, title })
    setTimeout(() => setAlert(null), 7000) // Increased visibility time
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const isDuplicate = (newInfluencer, currentInfluencers) => {
    return currentInfluencers.some(inf => 
      inf.businessEmail.toLowerCase() === newInfluencer.businessEmail.toLowerCase() &&
      inf.clientId === newInfluencer.clientId
    )
  }

  const addInfluencer = () => {
    if (!selectedClient) {
      showAlert('Please select a client first.', 'error', 'Client Not Selected')
      return
    }

    const { name, businessEmail, instagramFollowers, tiktokFollowers, averageViews, engagementRate } = formData

    if (!name || !businessEmail) {
      showAlert('Name and Business Email are required.', 'error', 'Missing Information')
      return
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
      notes: formData.notes,
      dateAdded: new Date().toISOString().split('T')[0],
      submitted: false
    }

    if (isDuplicate(newInfluencer, influencers)) {
      showAlert('Influencer with this email already exists for the selected client.', 'warning', 'Duplicate Entry')
      return
    }

    setInfluencers(prev => [...prev, newInfluencer])
    setTodaysInfluencers(prev => [...prev, newInfluencer])
    setFormData({
      name: '',
      businessEmail: '',
      instagramFollowers: '',
      tiktokFollowers: '',
      averageViews: '',
      engagementRate: '',
      notes: ''
    })
    showAlert('Influencer added successfully!', 'success', 'Success')
    document.getElementById('influencer-name-input').focus() // QoL: auto-focus
  }

  const handleCsvUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setCsvFile(file)
    setCsvFileName(file.name)
    showAlert(`File selected: ${file.name}`, 'info', 'CSV Ready')
  }

  const processCsv = () => {
    if (!csvFile) {
      showAlert('Please select a CSV file first.', 'error', 'No File Selected')
      return
    }
    if (!selectedClient) {
      showAlert('Please select a client first.', 'error', 'Client Not Selected')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const lines = text.split('\n').filter(line => line.trim() !== '')
      const headers = lines[0].split(',').map(h => h.trim())
      const newInfluencersFromCsv = []
      const errors = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Mismatched column count. Skipping.`)
          continue
        }

        const influencerData = headers.reduce((obj, header, index) => {
          obj[header.replace(/\s/g, '')] = values[index]
          return obj
        }, {})

        const newInfluencer = {
          id: Date.now().toString() + i, // Unique ID for each row
          clientId: selectedClient,
          name: influencerData.Name || '',
          businessEmail: influencerData.BusinessEmail || '',
          instagramFollowers: parseInt(influencerData.InstagramFollowers) || 0,
          tiktokFollowers: parseInt(influencerData.TikTokFollowers) || 0,
          averageViews: parseInt(influencerData.AverageViews) || 0,
          engagementRate: parseFloat(influencerData.EngagementRate) || 0,
          notes: influencerData.Notes || '',
          dateAdded: new Date().toISOString().split('T')[0],
          submitted: false
        }

        if (!newInfluencer.name || !newInfluencer.businessEmail) {
          errors.push(`Row ${i + 1}: Name or Business Email missing. Skipping.`)
          continue
        }

        if (isDuplicate(newInfluencer, influencers)) {
          errors.push(`Row ${i + 1}: Influencer with email '${newInfluencer.businessEmail}' already exists for this client. Skipping.`) // Smarter redundancy
          continue
        }
        newInfluencersFromCsv.push(newInfluencer)
      }

      if (newInfluencersFromCsv.length > 0) {
        setInfluencers(prev => [...prev, ...newInfluencersFromCsv])
        setTodaysInfluencers(prev => [...prev, ...newInfluencersFromCsv])
        showAlert(`${newInfluencersFromCsv.length} influencers added from CSV!`, 'success', 'Bulk Upload Complete')
      }
      if (errors.length > 0) {
        setBulkUploadErrors(errors)
        showAlert(`Bulk upload completed with ${errors.length} errors. Check the Bulk Upload tab for details.`, 'warning', 'Partial Success')
      } else if (newInfluencersFromCsv.length === 0) {
        showAlert('No new influencers were added from the CSV. Check for duplicates or format issues.', 'warning', 'No New Influencers')
      }
      setCsvFile(null)
      setCsvFileName('')
      document.getElementById('csv-upload-input').value = '' // Clear file input
    }
    reader.readAsText(csvFile)
  }

  const submitTodaysProspects = () => {
    if (todaysInfluencers.length === 0) {
      showAlert('No new prospects to submit today.', 'warning', 'Nothing to Submit')
      return
    }

    const updatedTodaysInfluencers = todaysInfluencers.map(inf => ({ ...inf, submitted: true }))
    setSubmittedInfluencers(prev => [...prev, ...updatedTodaysInfluencers])
    setInfluencers(prev => prev.map(inf => 
      updatedTodaysInfluencers.some(submittedInf => submittedInf.id === inf.id) ? { ...inf, submitted: true } : inf
    ))
    setTodaysInfluencers([])
    showAlert(`${updatedTodaysInfluencers.length} prospects successfully submitted! Admin has been notified.`, 'success', 'Submission Complete')
    setIsSubmitProspectsDialogOpen(true) // Open the dialog for admin notification
  }

  const generateMailtoLink = () => {
    const adminEmail = 'mattbison@apimedia.io'
    const subject = 'New Influencer Prospects Ready for Review'
    const body = `Hello Admin,\n\n${todaysInfluencers.length} new influencer prospects have been submitted for review. Please check the Admin Dashboard.\n\nDetails:\n${todaysInfluencers.map(inf => `- ${inf.name} (${inf.businessEmail}) for ${clients.find(c => c.id === inf.clientId)?.name}`).join('\n')}\n\nThank you!`
    return `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Unknown Client'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Team Portal</h1>

        {alert && (
          <Alert className={`p-4 rounded-lg shadow-md ${alert.type === 'error' ? 'border-red-500 bg-red-50' : alert.type === 'success' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
            {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
            {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {alert.type === 'warning' && <Info className="h-5 w-5 text-yellow-600" />}
            <AlertTitle className="text-lg font-semibold">{alert.title}</AlertTitle>
            <AlertDescription className="text-base">{alert.message}</AlertDescription>
          </Alert>
        )}

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
              <CardTitle className="text-2xl font-bold">Add New Influencer</CardTitle>
              <CardDescription className="text-base text-gray-600">Enter details for a new influencer for the selected client.</CardDescription>
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
              <Button onClick={addInfluencer} className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                <UserPlus className="h-5 w-5 mr-2" /> Add Influencer
              </Button>
            </CardContent>
          </TabsContent>

          <TabsContent value="bulkUpload" className="mt-6 p-6 bg-white rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Bulk Upload Influencers</CardTitle>
              <CardDescription className="text-base text-gray-600">Upload a CSV file to add multiple influencers at once. Ensure the CSV has 'Name', 'Business Email', 'Instagram Followers', 'TikTok Followers', 'Average Views', 'Engagement Rate', 'Notes' columns.</CardDescription>
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
                      </div>
                      <span className="text-sm text-gray-500">{getClientName(inf.clientId)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Dialog open={isSubmitProspectsDialogOpen} onOpenChange={setIsSubmitProspectsDialogOpen}>
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
                      className="inline-flex items-center justify-center rounded-md text-lg font-medium
                                 ring-offset-background transition-colors focus-visible:outline-none
                                 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                 disabled:pointer-events-none disabled:opacity-50
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
  )
}

export default TeamPortal
