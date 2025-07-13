"""
Integration tests for authentication endpoints.
"""
import pytest
from httpx import AsyncClient

from app.auth.dependencies import verify_password


class TestAuthEndpoints:
    """Integration tests for authentication API endpoints."""
    
    @pytest.mark.asyncio
    async def test_register_user_success(self, client: AsyncClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@testcompany.ae",
            "password": "SecurePassword123!",
            "full_name": "New Test User",
            "company_name": "New Test Company",
            "business_sector": "hospitality",
            "main_location": "Dubai"
        }
        
        response = await client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "user" in data
        assert "company" in data
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["full_name"] == user_data["full_name"]
        assert data["company"]["name"] == user_data["company_name"]
        assert data["company"]["business_sector"] == user_data["business_sector"]
    
    @pytest.mark.asyncio
    async def test_register_user_duplicate_email(self, client: AsyncClient, test_user):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,  # Use existing email
            "password": "SecurePassword123!",
            "full_name": "Duplicate User",
            "company_name": "Duplicate Company",
            "business_sector": "hospitality",
            "main_location": "Dubai"
        }
        
        response = await client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_register_user_invalid_data(self, client: AsyncClient):
        """Test registration with invalid data."""
        user_data = {
            "email": "invalid-email",  # Invalid email format
            "password": "weak",  # Weak password
            "full_name": "",  # Empty name
            "company_name": "",  # Empty company name
            "business_sector": "invalid_sector",
            "main_location": ""
        }
        
        response = await client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user):
        """Test successful login."""
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        
        response = await client.post(
            "/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient, test_user):
        """Test login with invalid credentials."""
        login_data = {
            "username": test_user.email,
            "password": "wrongpassword"
        }
        
        response = await client.post(
            "/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user."""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "somepassword"
        }
        
        response = await client.post(
            "/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, auth_headers):
        """Test getting current user information."""
        response = await client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "email" in data
        assert "full_name" in data
        assert "role" in data
        assert "company_id" in data
    
    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authentication."""
        response = await client.get("/api/auth/me")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/auth/me", headers=invalid_headers)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient, test_user):
        """Test token refresh functionality."""
        # First login to get tokens
        login_data = {
            "username": test_user.email,
            "password": "testpassword123"
        }
        
        login_response = await client.post(
            "/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        login_data = login_response.json()
        refresh_token = login_data["refresh_token"]
        
        # Use refresh token to get new access token
        refresh_data = {"refresh_token": refresh_token}
        
        response = await client.post("/api/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test token refresh with invalid refresh token."""
        refresh_data = {"refresh_token": "invalid_refresh_token"}
        
        response = await client.post("/api/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_update_user_profile(self, client: AsyncClient, auth_headers):
        """Test updating user profile."""
        update_data = {
            "full_name": "Updated Full Name",
            "phone": "+971-4-555-0123"
        }
        
        response = await client.put("/api/auth/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["full_name"] == update_data["full_name"]
    
    @pytest.mark.asyncio
    async def test_change_password(self, client: AsyncClient, auth_headers, test_user):
        """Test password change functionality."""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "NewSecurePassword123!"
        }
        
        response = await client.post("/api/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 200
        
        # Verify password was actually changed by attempting login with new password
        login_data = {
            "username": test_user.email,
            "password": "NewSecurePassword123!"
        }
        
        login_response = await client.post(
            "/api/auth/token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert login_response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, client: AsyncClient, auth_headers):
        """Test password change with wrong current password."""
        password_data = {
            "current_password": "wrongcurrentpassword",
            "new_password": "NewSecurePassword123!"
        }
        
        response = await client.post("/api/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "current password" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient, auth_headers):
        """Test user logout functionality."""
        response = await client.post("/api/auth/logout", headers=auth_headers)
        
        # Note: Logout implementation may vary (token blacklist, etc.)
        # This test verifies the endpoint exists and returns appropriate response
        assert response.status_code in [200, 204]