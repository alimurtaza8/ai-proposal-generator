// Simple storage utility for managing user data
// In production, this would be replaced with a proper database

export interface ProposalActivity {
  id: string
  filename: string
  proposalType: string
  sector: string
  companyName: string
  createdAt: string
  downloadUrl: string
  fileSize?: string
  status: 'completed' | 'failed'
}

export interface UserData {
  email: string
  fullName?: string
  recentActivity: ProposalActivity[]
}

// Get user data from localStorage
export const getUserData = (email: string): UserData | null => {
  try {
    const userData = localStorage.getItem(`userData_${email}`)
    if (userData) {
      return JSON.parse(userData)
    }
    // Create default user data if not exists
    const defaultData: UserData = {
      email,
      recentActivity: []
    }
    setUserData(email, defaultData)
    return defaultData
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}

// Save user data to localStorage
export const setUserData = (email: string, data: UserData): void => {
  try {
    localStorage.setItem(`userData_${email}`, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving user data:', error)
  }
}

// Add a new proposal to user's recent activity
export const addProposalToActivity = (
  email: string, 
  proposal: Omit<ProposalActivity, 'id' | 'createdAt'>
): void => {
  try {
    console.log('addProposalToActivity called with:', { email, proposal })
    
    const userData = getUserData(email)
    if (!userData) {
      console.error('No user data found for email:', email)
      return
    }

    const newActivity: ProposalActivity = {
      ...proposal,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }

    console.log('Created new activity:', newActivity)

    // Add to beginning of array (most recent first)
    userData.recentActivity.unshift(newActivity)

    // Keep only last 10 activities
    userData.recentActivity = userData.recentActivity.slice(0, 10)

    console.log('Updated user data:', userData)

    setUserData(email, userData)
    
    // Verify it was saved
    const verification = getUserData(email)
    console.log('Verification after save:', verification?.recentActivity)
  } catch (error) {
    console.error('Error adding proposal to activity:', error)
  }
}

// Get user's recent activity
export const getUserActivity = (email: string): ProposalActivity[] => {
  try {
    console.log('getUserActivity called for:', email)
    const userData = getUserData(email)
    console.log('Retrieved user data:', userData)
    const activity = userData?.recentActivity || []
    console.log('Returning activity:', activity)
    return activity
  } catch (error) {
    console.error('Error getting user activity:', error)
    return []
  }
}

// Delete a specific activity
export const deleteActivity = (email: string, activityId: string): void => {
  try {
    const userData = getUserData(email)
    if (!userData) return

    userData.recentActivity = userData.recentActivity.filter(
      activity => activity.id !== activityId
    )

    setUserData(email, userData)
  } catch (error) {
    console.error('Error deleting activity:', error)
  }
}

// Clear all activity for a user
export const clearUserActivity = (email: string): void => {
  try {
    const userData = getUserData(email)
    if (!userData) return

    userData.recentActivity = []
    setUserData(email, userData)
  } catch (error) {
    console.error('Error clearing user activity:', error)
  }
}

// Generate a simple unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date for display
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  } catch (error) {
    return 'Unknown date'
  }
}