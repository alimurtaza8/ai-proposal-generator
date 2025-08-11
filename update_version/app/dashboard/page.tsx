'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserActivity, deleteActivity, formatDate, type ProposalActivity } from '@/lib/storage'

export default function DashboardPage() {
  const [user, setUser] = useState<{ email: string; fullName?: string } | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ProposalActivity[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
      
      // Load user's recent activity
      const activity = getUserActivity(parsedUser.email)
      setRecentActivity(activity)
    } else {
      router.push('/auth/signin')
    }
  }, [router])

  // Add effect to refresh activity when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Dashboard focused, refreshing activity...')
        const activity = getUserActivity(user.email)
        setRecentActivity(activity)
      }
    }

    window.addEventListener('focus', handleFocus)
    
    // Also check for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('userData_') && user) {
        console.log('Storage changed, refreshing activity...')
        const activity = getUserActivity(user.email)
        setRecentActivity(activity)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleDeleteActivity = (activityId: string) => {
    if (!user) return
    
    deleteActivity(user.email, activityId)
    const updatedActivity = getUserActivity(user.email)
    setRecentActivity(updatedActivity)
  }

  const refreshActivity = () => {
    if (!user) return
    
    console.log('Manually refreshing activity for:', user.email)
    const activity = getUserActivity(user.email)
    console.log('Loaded activities:', activity)
    setRecentActivity(activity)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-green flex items-center justify-center">
        <div className="text-white text-xl">
          <i className="fas fa-spinner spin mr-2"></i>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-green">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in">
          <i className="fas fa-check-circle mr-2"></i>
          Login successful! Welcome back!
        </div>
      )}

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 lg:px-20 border-b border-gray-700">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">AI Proposal Generator</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-gray-300">
            Welcome, {user.email}
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 lg:px-20 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Dashboard</h1>
          <p className="text-gray-300 text-lg">
            Manage your AI proposals and generate new documents
          </p>
          <p className="text-gray-400 mt-2">
            Get started by creating a new proposal or managing your existing ones.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Create New Proposal */}
          <div className="bg-charcoal rounded-xl p-8 hover:bg-opacity-80 transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl text-accent-tan mb-4">
                <i className="fas fa-plus-circle"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Create New Proposal</h3>
              <p className="text-gray-300 mb-6">
                Generate a new AI-powered proposal
              </p>
              <Link 
                href="/generator"
                className="bg-accent-tan hover:bg-accent-tan-hover text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center"
              >
                <i className="fas fa-magic mr-2"></i>
                New Proposal
              </Link>
            </div>
          </div>

          {/* View Reports */}
          <div className="bg-charcoal rounded-xl p-8 hover:bg-opacity-80 transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl text-green-500 mb-4">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">View Reports</h3>
              <p className="text-gray-300 mb-6">
                Access your generated reports
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center">
                <i className="fas fa-file-alt mr-2"></i>
                View Reports
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-charcoal rounded-xl p-8 hover:bg-opacity-80 transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl text-blue-500 mb-4">
                <i className="fas fa-cog"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Settings</h3>
              <p className="text-gray-300 mb-6">
                Manage your account settings
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 inline-flex items-center">
                <i className="fas fa-user-cog mr-2"></i>
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-charcoal rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
              <p className="text-gray-400">Your latest proposals and reports</p>
            </div>
            <button 
              onClick={refreshActivity}
              className="text-accent-tan hover:text-accent-tan-hover transition-colors p-2"
              title="Refresh activity"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="bg-dark-green rounded-lg p-6 flex items-center justify-between hover:bg-opacity-80 transition-all">
                  <div className="flex items-center flex-1">
                    <div className="text-2xl text-accent-tan mr-4">
                      <i className={activity.status === 'completed' ? 'fas fa-file-word' : 'fas fa-exclamation-triangle'}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">
                        {activity.companyName} - {activity.proposalType}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>
                          <i className="fas fa-industry mr-1"></i>
                          {activity.sector}
                        </span>
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {formatDate(activity.createdAt)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          activity.status === 'completed' 
                            ? 'bg-green-600 text-green-100' 
                            : 'bg-red-600 text-red-100'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activity.status === 'completed' && (
                      <a
                        href={activity.downloadUrl}
                        download
                        className="text-green-500 hover:text-green-400 transition-colors p-2"
                        title="Download proposal"
                      >
                        <i className="fas fa-download"></i>
                      </a>
                    )}
                    <button 
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="text-red-500 hover:text-red-400 transition-colors p-2"
                      title="Delete activity"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl text-gray-600 mb-4">
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No recent activity</h3>
                <p className="text-gray-500 mb-4">
                  Create your first proposal to see it here
                </p>
                <Link 
                  href="/generator"
                  className="bg-accent-tan hover:bg-accent-tan-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create First Proposal
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}