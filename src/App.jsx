import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Users, Shield, Building2 } from 'lucide-react'
import TeamPortal from './components/TeamPortal.jsx'
import AdminPortal from './components/AdminPortal.jsx'
import ClientPortal from './components/ClientPortal.jsx'
import './App.css'

function App() {
  const [currentPortal, setCurrentPortal] = useState(null)

  const portals = [
    {
      id: 'team',
      title: 'Team Portal',
      description: 'Source and manage influencers',
      icon: Users,
      color: 'bg-blue-500',
      component: TeamPortal
    },
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'Full access to manage everything',
      icon: Shield,
      color: 'bg-red-500',
      component: AdminPortal
    },
    {
      id: 'client',
      title: 'Client Portal',
      description: 'View stats and analytics',
      icon: Building2,
      color: 'bg-green-500',
      component: ClientPortal
    }
  ]

  if (currentPortal) {
    const PortalComponent = currentPortal.component
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <currentPortal.icon className="h-6 w-6 text-gray-600" />
                <h1 className="text-xl font-semibold text-gray-900">{currentPortal.title}</h1>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPortal(null)}
              >
                Switch Portal
              </Button>
            </div>
          </div>
        </div>
        <PortalComponent />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Usario Creators</h1>
          <p className="text-lg text-gray-600">Influencer Marketing Platform</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const IconComponent = portal.icon
            return (
              <Card 
                key={portal.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => setCurrentPortal(portal)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${portal.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{portal.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {portal.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Enter Portal
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App

