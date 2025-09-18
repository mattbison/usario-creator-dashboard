// API service for Usario Creators
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:5000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  // Helper method to get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  // Authentication methods
  async signup(userData) {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse(response);
  }

  async signin(credentials) {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    
    const data = await this.handleResponse(response);
    
    if (data.session && data.session.access_token) {
      this.setToken(data.session.access_token);
    }
    
    return data;
  }

  async signout() {
    const response = await fetch(`${API_BASE_URL}/api/auth/signout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    
    this.setToken(null);
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Client methods
  async getClients() {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createClient(clientData) {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(clientData),
    });
    
    return this.handleResponse(response);
  }

  // User management methods
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async assignClientToUser(userId, clientId) {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/clients`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ client_id: clientId }),
    });
    
    return this.handleResponse(response);
  }

  async getUserClients(userId) {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/clients`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Influencer methods
  async getInfluencers() {
    const response = await fetch(`${API_BASE_URL}/api/influencers`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createInfluencer(influencerData) {
    const response = await fetch(`${API_BASE_URL}/api/influencers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(influencerData),
    });
    
    return this.handleResponse(response);
  }

  async updateInfluencer(influencerId, influencerData) {
    const response = await fetch(`${API_BASE_URL}/api/influencers/${influencerId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(influencerData),
    });
    
    return this.handleResponse(response);
  }

  async deleteInfluencer(influencerId) {
    const response = await fetch(`${API_BASE_URL}/api/influencers/${influencerId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  // Submission methods
  async getSubmissions() {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse(response);
  }

  async createSubmission(submissionData) {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(submissionData),
    });
    
    return this.handleResponse(response);
  }

  // Bulk operations
  async bulkCreateInfluencers(influencersData) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < influencersData.length; i++) {
      try {
        const result = await this.createInfluencer(influencersData[i]);
        results.push(result);
      } catch (error) {
        errors.push({
          index: i,
          data: influencersData[i],
          error: error.message
        });
      }
    }
    
    return { results, errors };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

