import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Building2, Users, Instagram, TrendingUp, Eye, Heart, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

const ClientPortal = () => {
  const [selectedClient, setSelectedClient] = useState('client1')
  const [influencers, setInfluencers] = useState([])
  const [submittedInfluencers, setSubmittedInfluencers] = useState([])

  const clients = [
    { id: 'client1', name: 'TechBrand Co.' },
    { id: 'client2', name: 'Fashion Forward' },
    { id: 'client3', name: 'Fitness Plus' }
  ]

  useEffect(() => {
    // Load data from localStorage
    const savedInfluencers = localStorage.getItem('influencers')
    const savedSubmittedInfluencers = localStorage.getItem('submittedInfluencers')
    
    if (savedInfluencers) setInfluencers(JSON.parse(savedInfluencers))
    if (savedSubmittedInfluencers) setSubmittedInfluencers(JSON.parse(savedSubmittedInfluencers))
  }, [])

  const getClientInfluencers = () => {
    return [...influencers, ...submittedInfluencers].filter(inf => inf.clientId === selectedClient)
  }

  const getClientStats = () => {
    const clientInfluencers = getClientInfluencers()
    
    if (clientInfluencers.length === 0) {
      return {
        totalInfluencers: 0,
        avgInstagramFollowers: 0,
        avgTikTokFollowers: 0,
        avgViews: 0,
        avgEngagement: 0,
        newToday: 0
      }
    }

    const today = new Date().toISOString().split('T')[0]
    
    return {
      totalInfluencers: clientInfluencers.length,
      avgInstagramFollowers: Math.round(clientInfluencers.reduce((sum, inf) => sum + (parseInt(inf.instagramFollowers) || 0), 0) / clientInfluencers.length),
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

