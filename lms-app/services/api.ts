import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API base URL - prefer env or fall back to localhost
// Prefer EXPO_PUBLIC_API_BASE_URL; fall back to deployed Render API in production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api-lms-u1ki.onrender.com/api';

class ApiService {
  baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from storage
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Set auth token in storage
  async setAuthToken(token: string) {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Remove auth token from storage
  async removeAuthToken() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Generic HTTP request method
  async request(endpoint: string, options: any = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

  return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('🔐 Login response:', response);

      if (response.success && response.data?.token) {
        await this.setAuthToken(response.data.token);
        console.log('✅ Token saved successfully');
      }

      return {
        success: response.success,
        message: response.message,
        token: response.data?.token,
        user: response.data?.user
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async register(userData: any) {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      console.log('📝 Registration response:', response);

      if (response.success && response.data?.token) {
        await this.setAuthToken(response.data.token);
        console.log('✅ Token saved successfully');
      }

      return {
        success: response.success,
        message: response.message,
        token: response.data?.token,
        user: response.data?.user
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.removeAuthToken();
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const resp = await this.request('/auth/me');
      // Normalize to { success, user }
      return {
        success: resp.success,
        message: resp.message,
        user: resp.data?.user || resp.user
      };
    } catch (error) {
      throw error;
    }
  }

  // Book methods
  async getBooks(params?: any) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.available !== undefined) queryParams.append('available', params.available.toString());
      if (params?.genre) queryParams.append('genre', params.genre);

      const endpoint = `/books${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.request(endpoint);
      return {
        success: response.success,
        message: response.message,
        books: response.data?.books || response.books || [],
        pagination: response.data?.pagination || response.pagination
      };
    } catch (error) {
      throw error;
    }
  }

  async getBookById(bookId: string) {
    try {
      return await this.request(`/books/${bookId}`);
    } catch (error) {
      throw error;
    }
  }

  async getFeaturedBooks() {
    try {
      console.log('🔍 Fetching featured books from:', `${this.baseURL}/books?limit=6`);
  const response = await this.request('/books?limit=6');
      console.log('📚 Featured books response:', response);
      
      // Transform response to match expected format
      const result = {
        success: response.success,
        message: response.message,
        books: response.data?.books || response.books || []
      };
      console.log('📖 Transformed result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching featured books:', error);
      throw error;
    }
  }

  // Borrow methods
  async borrowBook(bookId: string) {
    try {
      return await this.request('/borrow', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });
    } catch (error) {
      throw error;
    }
  }

  async returnBook(borrowId: string) {
    try {
      return await this.request('/borrow/return', {
        method: 'POST',
        body: JSON.stringify({ borrowId }),
      });
    } catch (error) {
      throw error;
    }
  }

  async renewBook(borrowId: string) {
    try {
      return await this.request(`/borrow/renew/${borrowId}`, {
        method: 'PATCH',
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserBorrows() {
    try {
      const resp = await this.request('/borrow/my-books');
      return {
        success: resp.success,
        message: resp.message,
        borrows: resp.data?.borrows || resp.borrows || []
      };
    } catch (error) {
      throw error;
    }
  }

  async getBorrowHistory() {
    try {
      return await this.request('/borrow/history');
    } catch (error) {
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      const response = await this.getCurrentUser();
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
