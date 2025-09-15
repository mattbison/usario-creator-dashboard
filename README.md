# Usario Creators - Influencer Marketing Platform

A comprehensive web application designed for influencer marketing agencies to manage influencer relationships, track submissions, and provide analytics to clients. Built with React, featuring three distinct portals for different user types.

## 🚀 Features

### Team Portal (VA Workflow)
- **Client Selection**: Choose from assigned client accounts
- **Influencer Management**: Add influencers with comprehensive details
- **Bulk Upload**: CSV import with duplicate detection
- **Daily Submissions**: Submit new prospects with automatic notifications
- **History Tracking**: View all past submissions

### Admin Portal (Full Access)
- **Dashboard Overview**: Real-time statistics and metrics
- **Client Management**: Add/remove clients and assign team members
- **Complete Influencer Database**: View all influencers across clients
- **Submission History**: Track all submissions by date and client
- **Data Export**: Download influencer data in CSV format

### Client Portal (View-Only Analytics)
- **Performance Metrics**: Average followers, views, and engagement rates
- **Visual Analytics**: Charts showing platform distribution and growth
- **Top Performers**: Identify highest-performing influencers
- **Timeline Tracking**: Monitor influencer acquisition over time

## 🛠️ Technology Stack

- **Frontend**: React 18 with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Storage**: Local Storage (MVP approach)
- **Styling**: Tailwind CSS with custom design system

## 📋 Prerequisites

Before running the application, ensure you have:

- Node.js (version 18 or higher)
- npm or pnpm package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd usario-creators

# Install dependencies
npm install
# or
pnpm install
```

### 2. Development Server

```bash
# Start the development server
npm run dev
# or
pnpm run dev
```

The application will be available at `http://localhost:5173`

### 3. Building for Production

```bash
# Build the application
npm run build
# or
pnpm run build
```

The built files will be in the `dist/` directory.

## 🎯 Usage Guide

### Getting Started

1. **Portal Selection**: Choose your role from the main screen
   - **Team Portal**: For VAs managing influencer data
   - **Admin Portal**: For administrators with full access
   - **Client Portal**: For clients viewing analytics

### Team Portal Workflow

1. **Select Client**: Choose the client you're working with
2. **Add Influencers**: 
   - Use the form to add individual influencers
   - Upload CSV files for bulk additions
   - System automatically checks for duplicates
3. **Submit Prospects**: At end of day, submit new influencers
4. **View History**: Track all previous submissions

#### CSV Format for Bulk Upload

```csv
Name,Business Email,Instagram Followers,TikTok Followers,Average Views,Engagement Rate,Notes
John Doe,john@example.com,50000,25000,15000,3.5,Tech reviewer
Jane Smith,jane@example.com,75000,30000,20000,4.2,Fashion influencer
```

### Admin Portal Features

1. **Dashboard**: Monitor overall platform statistics
2. **Client Management**: 
   - Add new clients
   - Remove existing clients
   - View client-specific metrics
3. **Data Export**: Download comprehensive reports
4. **Submission Tracking**: Monitor all team submissions

### Client Portal Analytics

1. **Select Your Brand**: Choose your client account
2. **View Metrics**: Monitor key performance indicators
3. **Analyze Trends**: Use charts to understand growth patterns
4. **Review Influencers**: See complete list of your influencers

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=Usario Creators
VITE_API_URL=http://localhost:3000
```

### Customization

#### Adding New Clients

Modify the `clients` array in the respective components:

```javascript
const clients = [
  { id: 'client1', name: 'Your Client Name' },
  // Add more clients here
]
```

#### Modifying Influencer Fields

Update the form fields in `TeamPortal.jsx`:

```javascript
const [formData, setFormData] = useState({
  name: '',
  businessEmail: '',
  // Add or modify fields here
})
```

## 🚀 Deployment Options

### Option 1: Static Hosting (Recommended for MVP)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to static hosting**:
   - **Netlify**: Drag and drop the `dist` folder
   - **Vercel**: Connect your Git repository
   - **GitHub Pages**: Upload the `dist` contents

### Option 2: VPS/Server Deployment

1. **Prepare the server**:
   ```bash
   # Install Node.js and nginx
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

2. **Upload and build**:
   ```bash
   # Upload your code
   git clone <your-repo>
   cd usario-creators
   npm install
   npm run build
   ```

3. **Configure nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/usario-creators/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

### Option 3: Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=0 /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and run**:
   ```bash
   docker build -t usario-creators .
   docker run -p 80:80 usario-creators
   ```

## 📊 Data Management

### Local Storage Structure

The application uses browser Local Storage for data persistence:

```javascript
// Stored data structure
{
  "influencers": [...],           // All influencer records
  "todaysInfluencers": [...],     // Today's additions
  "submittedInfluencers": [...]   // Submitted records
}
```

### Data Migration

For production deployment, consider migrating to:
- **Database**: PostgreSQL, MySQL, or MongoDB
- **Backend API**: Node.js/Express or Python/Flask
- **Authentication**: Auth0, Firebase Auth, or custom solution

## 🔒 Security Considerations

### Current MVP Security

- Client-side data storage only
- No authentication required
- Suitable for internal team use

### Production Security Recommendations

1. **Authentication**: Implement proper user authentication
2. **Authorization**: Role-based access control
3. **Data Encryption**: Encrypt sensitive data
4. **HTTPS**: Use SSL certificates
5. **Input Validation**: Sanitize all user inputs
6. **Rate Limiting**: Prevent abuse

## 🐛 Troubleshooting

### Common Issues

1. **Application won't start**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Charts not displaying**:
   - Ensure Recharts is properly installed
   - Check browser console for errors

3. **CSV upload fails**:
   - Verify CSV format matches expected structure
   - Check for special characters in data

4. **Data not persisting**:
   - Ensure browser allows Local Storage
   - Check for private/incognito mode restrictions

### Performance Optimization

1. **Large datasets**: Implement pagination
2. **Slow loading**: Add loading states
3. **Memory usage**: Implement data cleanup

## 🔄 Future Enhancements

### Planned Features

1. **Backend Integration**: 
   - Database storage
   - API endpoints
   - Real-time synchronization

2. **Advanced Authentication**:
   - Google OAuth integration
   - Role-based permissions
   - Multi-tenant support

3. **Enhanced Analytics**:
   - Advanced reporting
   - Predictive analytics
   - Performance benchmarking

4. **Notification System**:
   - Email notifications
   - Slack integration
   - Real-time alerts

5. **Mobile Application**:
   - React Native app
   - Offline capabilities
   - Push notifications

### Technical Improvements

1. **Testing**: Unit and integration tests
2. **CI/CD**: Automated deployment pipeline
3. **Monitoring**: Error tracking and analytics
4. **Documentation**: API documentation

## 📞 Support

### Getting Help

1. **Documentation**: Check this README first
2. **Issues**: Create GitHub issues for bugs
3. **Features**: Submit feature requests
4. **Contact**: Reach out to the development team

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and modern web technologies
- UI components powered by shadcn/ui
- Charts and visualizations by Recharts
- Icons provided by Lucide React

---

**Usario Creators** - Streamlining influencer marketing for agencies and brands.

For questions or support, please contact the development team.

