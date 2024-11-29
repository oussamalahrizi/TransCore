from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from .models import User, AuthProvider
from rest_framework import status

class AuthUsersTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.test_user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "password2": "testpass123"
        }
        self.login_data = {
            "email": "test@example.com",
            "password": "testpass123"
        }

    def test_user_registration(self):
        """Test user registration endpoint"""
        url = reverse('register-email')
        response = self.client.post(url, self.test_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertTrue(User.objects.filter(email=self.test_user_data['email']).exists())

    def test_user_login(self):
        """Test user login endpoint"""
        # First create a user
        url = reverse('register-email')
        self.client.post(url, self.test_user_data, format='json')
        
        # Then try to login
        url = reverse('login-email')
        response = self.client.post(url, self.login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)

    def test_get_user_info(self):
        """Test getting user information"""
        # Create user and get tokens
        register_url = reverse('register-email')
        response = self.client.post(register_url, self.test_user_data, format='json')
        access_token = response.data['access_token']
        
        # Get user info
        url = reverse('user-info', kwargs={'username': self.test_user_data['username']})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.test_user_data['email'])

    def test_update_user(self):
        """Test updating user information"""
        # Create user and get tokens
        register_url = reverse('register-email')
        response = self.client.post(register_url, self.test_user_data, format='json')
        access_token = response.data['access_token']
        
        # Update user info
        update_data = {"icon_url": "https://example.com/image.jpg"}
        url = reverse('update', kwargs={'username': self.test_user_data['username']})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.patch(url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        user = User.objects.get(username=self.test_user_data['username'])
        self.assertEqual(user.icon_url, update_data['icon_url'])

    

    def test_invalid_registration(self):
        """Test registration with invalid data"""
        url = reverse('register-email')
        invalid_data = self.test_user_data.copy()
        invalid_data['password2'] = 'wrongpass'
        response = self.client.post(url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        # First create a user
        url = reverse('register-email')
        self.client.post(url, self.test_user_data, format='json')
        
        # Try to login with wrong password
        url = reverse('login-email')
        invalid_login = self.login_data.copy()
        invalid_login['password'] = 'wrongpass'
        response = self.client.post(url, invalid_login, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
