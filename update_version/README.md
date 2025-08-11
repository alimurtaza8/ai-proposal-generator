# AI Proposal Generator - Next.js Frontend

A modern, multi-page web application for generating AI-powered proposals with user authentication and dashboard management.

## 🚀 Features

- **Landing Page**: Marketing page with call-to-action
- **User Authentication**: Sign up and sign in functionality
- **Dashboard**: User management and activity overview
- **AI Proposal Generator**: Convert RFP documents to professional proposals
- **File Management**: Upload logos and RFP documents
- **Real-time Status**: Live updates during proposal generation

## 📁 Project Structure

```
├── app/
│   ├── auth/
│   │   ├── signin/page.tsx     # Sign in page
│   │   └── signup/page.tsx     # Sign up page
│   ├── dashboard/page.tsx      # User dashboard
│   ├── generator/page.tsx      # AI proposal generator
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Backend Integration

Make sure your Python FastAPI backend is running on `http://localhost:8000`

## 🔗 Page Flow

1. **Landing Page** (`/`) - Marketing and authentication entry point
2. **Sign Up** (`/auth/signup`) - User registration
3. **Sign In** (`/auth/signin`) - User login
4. **Dashboard** (`/dashboard`) - User home with navigation options
5. **Generator** (`/generator`) - AI proposal generation tool

## 🎨 Design System

- **Colors**: Dark green theme with tan accents
- **Typography**: Inter font family
- **Components**: Tailwind CSS with custom utilities
- **Icons**: Font Awesome 6.4.0
- **Animations**: CSS transitions and keyframes

## 🔧 Key Components

### Authentication
- Basic localStorage-based session management
- Form validation and error handling
- Protected routes with redirect logic

### Dashboard
- User welcome area
- Action cards for main features
- Recent activity tracking
- Quick navigation

### Generator
- Multi-step form with file uploads
- Real-time progress tracking
- Status polling from backend API
- Download management

## 🚦 API Integration

The frontend integrates with your existing Python FastAPI backend:

- `POST /upload-and-generate` - Submit proposal generation request
- `GET /status/{job_id}` - Poll generation status
- `GET /download/{filename}` - Download generated files

## 📱 Responsive Design

- Mobile-first approach
- Responsive navigation
- Flexible grid layouts
- Touch-friendly interactions

## 🔒 Security Considerations

**Current Implementation** (Basic):
- Client-side session management
- No password encryption
- localStorage-based auth

**Recommended Upgrades**:
- Server-side session management
- JWT tokens with refresh
- Password hashing (bcrypt)
- Database user storage
- CSRF protection

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-frontend-domain.com
```

## 🔄 Migration from HTML

Your existing `index.html` functionality has been converted to:
- React components with TypeScript
- Next.js app router structure
- Tailwind CSS styling
- Modern form handling
- Improved error management

## 📞 Support

For questions or issues:
- **Email**: Maazmansoorb301@gmail.com
- **LinkedIn**: [Maaz Mansoor](https://www.linkedin.com/in/maazomansoor/)

---

**Next Steps:**
1. Run `npm install` to install dependencies
2. Start the development server with `npm run dev`
3. Test the complete user flow from landing to proposal generation
4. Integrate with your existing Python backend
5. Add proper authentication system for production use