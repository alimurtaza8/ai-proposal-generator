'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addProposalToActivity, getUserActivity } from '@/lib/storage'

interface JobStatus {
  status: string
  message: string
  progress: number
  files?: string[]
}

export default function GeneratorPage() {
  const [user, setUser] = useState<{ email: string; fullName?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [, setCurrentJobId] = useState<string | null>(null)
  const [downloadFiles, setDownloadFiles] = useState<string[]>([])
  const [formData, setFormData] = useState<FormData | null>(null)
  const [showSavedNotification, setShowSavedNotification] = useState(false)
  const router = useRouter()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/signin')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleProposalTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'financial') {
      router.push('/financial-proposal')
    }
  }

  const saveToUserActivity = (files: string[], formData: FormData) => {
    if (!user) {
      console.error('No user found, cannot save to activity')
      return
    }

    try {
      console.log('Saving to user activity for:', user.email)
      console.log('Files to save:', files)

      // Extract form data
      const proposalType = formData.get('proposal_type') as string
      const sector = formData.get('sector') as string
      const companyName = formData.get('company_name') as string

      console.log('Form data extracted:', { proposalType, sector, companyName })

      // Save each file to activity
      files.forEach(filename => {
        const activityData = {
          filename,
          proposalType: proposalType || 'Unknown',
          sector: sector || 'Unknown',
          companyName: companyName || 'Unknown',
          downloadUrl: `${API_BASE_URL}/download/${encodeURIComponent(filename)}`,
          status: 'completed' as const
        }
        
        console.log('Adding activity:', activityData)
        addProposalToActivity(user.email, activityData)
      })

      // Verify it was saved
      const savedActivities = getUserActivity(user.email)
      console.log('Activities after saving:', savedActivities)

      console.log('Proposal saved to user activity successfully:', files)
      
      // Show success notification
      setShowSavedNotification(true)
      setTimeout(() => setShowSavedNotification(false), 5000)
    } catch (error) {
      console.error('Error saving to user activity:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isLoading) {
      console.log('Generation already in progress, ignoring duplicate request')
      return
    }

    setIsLoading(true)
    setJobStatus(null)
    setDownloadFiles([])

    try {
      const formData = new FormData(e.currentTarget)
      setFormData(formData) // Store form data for later use
      
      console.log('Sending request to:', `${API_BASE_URL}/upload-and-generate`)
      
      const response = await fetch(`${API_BASE_URL}/upload-and-generate`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Success data:', data)
      
      setCurrentJobId(data.job_id)
      setJobStatus({
        status: 'processing',
        message: data.message || 'Processing started successfully',
        progress: 10
      })
      
      // Start polling for status
      pollJobStatus(data.job_id)
      
    } catch (error) {
      console.error('Generation error:', error)
      setJobStatus({
        status: 'error',
        message: `Error generating proposal: ${error}`,
        progress: 0
      })
      setIsLoading(false)
    }
  }

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        console.log('Polling status for job:', jobId)
        
        const response = await fetch(`${API_BASE_URL}/status/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('Status data:', data)
        
        setJobStatus({
          status: data.status,
          message: data.message || 'Processing...',
          progress: data.progress || 0
        })
        
        if (data.status === 'completed') {
          clearInterval(interval)
          setIsLoading(false)
          if (data.files && data.files.length > 0) {
            setDownloadFiles(data.files)
            
            // Save to user's activity
            if (user && formData) {
              saveToUserActivity(data.files, formData)
            }
          }
        } else if (data.status === 'error') {
          clearInterval(interval)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(interval)
        setJobStatus({
          status: 'error',
          message: `Error checking status: ${error}`,
          progress: 0
        })
        setIsLoading(false)
      }
    }, 2000)
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
      {/* Success Notification */}
      {showSavedNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in">
          <i className="fas fa-check-circle mr-2"></i>
          Proposal saved to your dashboard!
        </div>
      )}

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 lg:px-20 border-b border-gray-700">
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard"
            className="text-accent-tan hover:text-accent-tan-hover transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Link>
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

      {/* Hero Section */}
      <div className="text-center py-16 px-6">
        <h1 className="text-5xl font-black mb-4 text-white">
          AI Proposal Generator
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Generate intelligent proposals with AI assistance
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-charcoal py-16 px-6">
        <div className="max-w-2xl mx-auto slide-in-up">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Proposal Type */}
            <div>
              <label htmlFor="proposal_type" className="block text-white font-semibold mb-3">
                <i className="fas fa-clipboard-list mr-2"></i> Proposal Type
              </label>
              <select 
                id="proposal_type" 
                name="proposal_type"
                onChange={handleProposalTypeChange}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent"
                required
              >
                <option value="">Select proposal type</option>
                <option value="technical">Technical Proposal</option>
                <option value="financial">Financial Proposal</option>
              </select>
            </div>

            {/* Sector */}
            <div>
              <label htmlFor="sector" className="block text-white font-semibold mb-3">
                <i className="fas fa-industry mr-2"></i> Sector
              </label>
              <select 
                id="sector" 
                name="sector"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent"
                required
              >
                <option value="">Select sector</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="block text-white font-semibold mb-3">
                <i className="fas fa-building mr-2"></i> Client's Name
              </label>
              <input 
                type="text" 
                id="company_name" 
                name="company_name"
                placeholder="Enter your client's name"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent placeholder-gray-400"
                required
              />
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-white font-semibold mb-3">
                <i className="fas fa-language mr-2"></i> Language
              </label>
              <select 
                id="language" 
                name="language"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            {/* Logos */}
            <div>
              <label htmlFor="logo_top_left" className="block text-white font-semibold mb-3">
                <i className="fas fa-image mr-2"></i> Top-Left Logo
              </label>
              <input 
                type="file" 
                id="logo_top_left" 
                name="logo_top_left" 
                accept="image/*"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-tan file:text-white hover:file:bg-accent-tan-hover"
              />
            </div>

            <div>
              <label htmlFor="logo_bottom_right" className="block text-white font-semibold mb-3">
                <i className="fas fa-image mr-2"></i> Bottom-Right Logo
              </label>
              <input 
                type="file" 
                id="logo_bottom_right" 
                name="logo_bottom_right" 
                accept="image/*"
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-tan file:text-white hover:file:bg-accent-tan-hover"
              />
            </div>

            {/* RFP Documents */}
            <div>
              <label htmlFor="files" className="block text-white font-semibold mb-3">
                <i className="fas fa-upload mr-2"></i> RFP Documents
              </label>
              <input 
                type="file" 
                id="files" 
                name="files" 
                multiple 
                required
                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-tan file:text-white hover:file:bg-accent-tan-hover"
              />
              <p className="text-gray-400 text-sm mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                Upload the main RFP documents that define the project requirements
              </p>
            </div>

            {/* Enhanced AI Analysis Section */}
            <div className="bg-gradient-to-br from-accent-tan/10 to-accent-tan/5 border border-accent-tan/30 rounded-xl p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-accent-tan mb-2 flex items-center justify-center">
                  <i className="fas fa-brain mr-2"></i>
                  Enhanced AI Analysis (Optional)
                </h3>
                <p className="text-gray-300 text-sm">
                  Upload additional documents to create more comprehensive and effective proposals
                </p>
              </div>

              {/* Special Supporting Document */}
              <div>
                <label htmlFor="special_document" className="block text-white font-semibold mb-3">
                  <i className="fas fa-file-shield mr-2"></i> Special Supporting Document
                </label>
                <input 
                  type="file" 
                  id="special_document" 
                  name="special_document" 
                  accept=".pdf,.docx,.doc,.txt"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-tan file:text-white hover:file:bg-accent-tan-hover"
                />
                <p className="text-gray-400 text-sm mt-2">
                  <i className="fas fa-lightbulb mr-1"></i>
                  Upload a key document with standards, methodologies, or requirements that will enhance your proposal
                </p>
              </div>

              {/* Additional Supporting Documents */}
              <div>
                <label htmlFor="additional_documents" className="block text-white font-semibold mb-3">
                  <i className="fas fa-file-circle-plus mr-2"></i> Additional Supporting Documents
                </label>
                <input 
                  type="file" 
                  id="additional_documents" 
                  name="additional_documents" 
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-dark-green text-white focus:ring-2 focus:ring-accent-tan focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-tan file:text-white hover:file:bg-accent-tan-hover"
                />
                <p className="text-gray-400 text-sm mt-2">
                  <i className="fas fa-chart-line mr-1"></i>
                  Upload supplementary documents like case studies, references, or technical specifications
                </p>
              </div>

              {/* Benefits Info */}
              <div className="bg-dark-green/30 rounded-lg p-4">
                <h4 className="text-accent-tan font-semibold mb-2 flex items-center">
                  <i className="fas fa-star mr-2"></i>
                  Enhanced Analysis Benefits
                </h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li><i className="fas fa-check mr-2 text-green-400"></i>AI extracts best practices and methodologies</li>
                  <li><i className="fas fa-check mr-2 text-green-400"></i>Incorporates industry standards and compliance requirements</li>
                  <li><i className="fas fa-check mr-2 text-green-400"></i>Strengthens proposal credibility with supporting evidence</li>
                  <li><i className="fas fa-check mr-2 text-green-400"></i>Automatically integrates insights into relevant sections</li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent-tan hover:bg-accent-tan-hover disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center text-lg"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Generate Proposal
                  </>
                )}
              </button>

              {/* Debug Test Button */}
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    // Test saving a dummy activity
                    const testFormData = new FormData()
                    testFormData.set('proposal_type', 'technical')
                    testFormData.set('sector', 'technology')
                    testFormData.set('company_name', 'Test Company')
                    
                    saveToUserActivity(['test_proposal.docx'], testFormData)
                    alert('Test activity saved! Check console and dashboard.')
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                🧪 Test Save to Dashboard
              </button>
            </div>
          </form>

          {/* Status Display */}
          {jobStatus && (
            <div className="mt-8 fade-in">
              <div className="bg-dark-green rounded-lg p-6">
                <p className={`text-lg font-medium mb-4 ${jobStatus.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                  {jobStatus.message}
                </p>
                
                {jobStatus.status !== 'error' && (
                  <div className="w-full bg-gray-700 rounded-lg h-3 mb-4">
                    <div 
                      className="bg-accent-tan h-3 rounded-lg transition-all duration-500"
                      style={{ width: `${jobStatus.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download Section */}
          {downloadFiles.length > 0 && (
            <div className="mt-8 fade-in">
              <div className="bg-dark-green rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Download Your Proposal Documents</h2>
                
                {/* Separate documents into categories */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Main Proposal Documents */}
                  <div className="bg-charcoal rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-accent-tan mb-3 flex items-center">
                      <i className="fas fa-file-alt mr-2"></i>
                      Main Proposal Document
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Complete proposal with detailed content, sections, and business information
                    </p>
                    <div className="space-y-2">
                      {downloadFiles
                        .filter(filename => !filename.includes('visualization'))
                        .map((filename, index) => (
                          <a
                            key={index}
                            href={`${API_BASE_URL}/download/${encodeURIComponent(filename)}`}
                            download
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 inline-flex items-center w-full justify-center"
                          >
                            {filename.endsWith('.docx') && <i className="fas fa-file-word mr-2"></i>}
                            {filename.endsWith('.xlsx') && <i className="fas fa-file-excel mr-2"></i>}
                            {filename.endsWith('.pdf') && <i className="fas fa-file-pdf mr-2"></i>}
                            {filename.endsWith('.docx') && 'Word Document'}
                            {filename.endsWith('.xlsx') && 'Excel Spreadsheet'}
                            {filename.endsWith('.pdf') && 'PDF Document'}
                          </a>
                        ))}
                    </div>
                  </div>

                  {/* Visualization Documents */}
                  <div className="bg-charcoal rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-accent-tan mb-3 flex items-center">
                      <i className="fas fa-chart-line mr-2"></i>
                      Interactive Visualizations
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Timeline diagrams, architecture charts, and modular design visualizations
                    </p>
                    <div className="space-y-2">
                      {downloadFiles
                        .filter(filename => filename.includes('visualization'))
                        .map((filename, index) => (
                          <a
                            key={index}
                            href={`${API_BASE_URL}/download/${encodeURIComponent(filename)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 inline-flex items-center w-full justify-center"
                          >
                            <i className="fas fa-external-link-alt mr-2"></i>
                            View Visualizations
                          </a>
                        ))}
                      {downloadFiles.filter(filename => filename.includes('visualization')).length === 0 && (
                        <div className="text-gray-400 text-center py-4">
                          <i className="fas fa-info-circle mr-1"></i>
                          Visualizations not generated for this proposal type
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-accent-tan/10 border border-accent-tan/30 rounded-lg p-4 mb-4">
                  <h4 className="text-accent-tan font-semibold mb-2 flex items-center">
                    <i className="fas fa-lightbulb mr-2"></i>
                    Document Guide
                  </h4>
                  <div className="text-gray-300 text-sm space-y-1">
                    <p><strong>Main Document:</strong> Complete proposal ready for client presentation</p>
                    <p><strong>Visualizations:</strong> Interactive diagrams showing timelines, architecture, and modular design</p>
                    <p><strong>Tip:</strong> Open visualizations in a new tab to view interactive Mermaid diagrams</p>
                  </div>
                </div>
                
                <div className="text-center border-t border-gray-600 pt-4">
                  <p className="text-gray-300 mb-3">
                    <i className="fas fa-info-circle mr-1"></i>
                    Your proposal has been saved to your dashboard for future access.
                  </p>
                  <Link 
                    href="/dashboard"
                    className="bg-accent-tan hover:bg-accent-tan-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center"
                  >
                    <i className="fas fa-tachometer-alt mr-2"></i>
                    View Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
