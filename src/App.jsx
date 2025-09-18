import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Users, Shield, Building2, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginForm from './components/LoginForm'
import TeamPortal from './components/TeamPortal.jsx'
import AdminPortal from './components/AdminPortal.jsx'
import ClientPortal from './components/ClientPortal.jsx'
import './App.css'

function AppContent() {
  const [currentPortal, setCurrentPortal] = useState(null)
  const { user, loading, signout, isAdmin, isVA } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const portals = [
    {
      id: 'team',
      title: 'Team Portal',
      description: 'For VAs to add influencers and manage prospects',
      icon: Users,
      color: 'bg-blue-500',
      component: TeamPortal,
      allowedRoles: ['va', 'admin']
    },
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'Full access to manage everything',
      icon: Shield,
      color: 'bg-red-500',
      component: AdminPortal,
      allowedRoles: ['admin']
    },
    {
      id: 'client',
      title: 'Client Portal',
      description: 'View stats and analytics',
      icon: Building2,
      color: 'bg-green-500',
      component: ClientPortal,
      allowedRoles: ['admin', 'va'] // For now, allow both to see client view
    }
  ]

  // Filter portals based on user role
  const availablePortals = portals.filter(portal => 
    portal.allowedRoles.includes(user.role)
  )

  const handleSignout = async () => {
    await signout()
    setCurrentPortal(null)
  }

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
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.full_name} ({user.role})
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPortal(null)}
                >
                  Back to Home
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <PortalComponent />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Usario Creators
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Hello, {user.full_name}!
          </p>
          <p className="text-lg text-gray-500">
            Choose a portal to get started
          </p>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignout}
              className="flex items-center space-x-2 mx-auto"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePortals.map((portal) => {
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
                  <CardDescription className="text-gray-600">
                    {portal.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

