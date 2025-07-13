"""
Enhanced security utilities for ESG platform.
"""
import hashlib
import hmac
import secrets
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from urllib.parse import urlparse
import logging

from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from ..config import settings

logger = logging.getLogger(__name__)

# Security constants
ALLOWED_FILE_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.txt'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
SENSITIVE_HEADERS = {'authorization', 'cookie', 'x-api-key', 'x-auth-token'}


class SecurityValidator:
    """Enhanced security validation utilities."""
    
    @staticmethod
    def validate_file_upload(filename: str, content: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Comprehensive file upload validation.
        
        Args:
            filename: Original filename
            content: File content bytes
            mime_type: MIME type
            
        Returns:
            Validation result with security assessment
            
        Raises:
            HTTPException: If file fails security validation
        """
        result = {
            'valid': True,
            'warnings': [],
            'file_hash': '',
            'secure_filename': '',
            'file_size': len(content)
        }
        
        # File size validation
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Filename validation
        if not SecurityValidator._validate_filename(filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename. Contains potentially dangerous characters."
            )
        
        # File extension validation
        file_ext = SecurityValidator._get_file_extension(filename)
        if file_ext not in ALLOWED_FILE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{file_ext}' not allowed. Allowed types: {', '.join(ALLOWED_FILE_EXTENSIONS)}"
            )
        
        # MIME type validation
        if not SecurityValidator._validate_mime_type(mime_type, file_ext):
            result['warnings'].append(f"MIME type '{mime_type}' doesn't match file extension '{file_ext}'")
        
        # Content validation
        if SecurityValidator._detect_malicious_content(content):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content appears to contain potentially malicious data"
            )
        
        # Generate secure filename and hash
        result['secure_filename'] = SecurityValidator._generate_secure_filename(filename)
        result['file_hash'] = SecurityValidator.calculate_file_hash(content)
        
        return result
    
    @staticmethod
    def _validate_filename(filename: str) -> bool:
        """Validate filename for security threats."""
        if not filename or len(filename) > 255:
            return False
        
        # Check for path traversal attempts
        if '..' in filename or '/' in filename or '\\' in filename:
            return False
        
        # Check for null bytes or control characters
        if '\x00' in filename or any(ord(c) < 32 for c in filename if c not in '\t\n\r'):
            return False
        
        # Check for potentially dangerous patterns
        dangerous_patterns = [
            r'\.exe$', r'\.bat$', r'\.cmd$', r'\.com$', r'\.pif$',
            r'\.scr$', r'\.vbs$', r'\.js$', r'\.jar$', r'\.php$'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, filename, re.IGNORECASE):
                return False
        
        return True
    
    @staticmethod
    def _get_file_extension(filename: str) -> str:
        """Get file extension in lowercase."""
        return '.' + filename.split('.')[-1].lower() if '.' in filename else ''
    
    @staticmethod
    def _validate_mime_type(mime_type: str, file_ext: str) -> bool:
        """Validate MIME type matches file extension."""
        mime_mappings = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain'
        }
        
        expected_mime = mime_mappings.get(file_ext)
        return expected_mime is None or mime_type == expected_mime
    
    @staticmethod
    def _detect_malicious_content(content: bytes) -> bool:
        """Basic malicious content detection."""
        # Check for suspicious patterns in the first 1KB
        header = content[:1024].lower()
        
        # Script injection patterns
        malicious_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'onload=',
            b'onerror=',
            b'eval(',
            b'document.cookie',
            b'document.write'
        ]
        
        for pattern in malicious_patterns:
            if pattern in header:
                return True
        
        return False
    
    @staticmethod
    def _generate_secure_filename(original_filename: str) -> str:
        """Generate a secure filename with timestamp and random component."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        random_component = secrets.token_hex(8)
        extension = SecurityValidator._get_file_extension(original_filename)
        
        return f"{timestamp}_{random_component}{extension}"
    
    @staticmethod
    def calculate_file_hash(content: bytes) -> str:
        """Calculate SHA-256 hash of file content."""
        return hashlib.sha256(content).hexdigest()
    
    @staticmethod
    def validate_input_sanitization(data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize user input to prevent injection attacks."""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Remove potentially dangerous characters
                sanitized_value = SecurityValidator._sanitize_string(value)
                sanitized[key] = sanitized_value
            elif isinstance(value, dict):
                sanitized[key] = SecurityValidator.validate_input_sanitization(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    SecurityValidator._sanitize_string(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    @staticmethod
    def _sanitize_string(text: str) -> str:
        """Sanitize string input."""
        if not text:
            return text
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Basic HTML/Script sanitization
        dangerous_chars = ['<', '>', '"', "'", '&']
        for char in dangerous_chars:
            text = text.replace(char, '')
        
        # Limit length
        return text[:1000] if len(text) > 1000 else text
    
    @staticmethod
    def validate_email_security(email: str) -> bool:
        """Enhanced email validation with security checks."""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            return False
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'\.\.', r'@.*@', r'^\.', r'\.$',
            r'[<>"\']', r'javascript:', r'script:'
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, email, re.IGNORECASE):
                return False
        
        return True
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Comprehensive password strength validation."""
        result = {
            'valid': True,
            'score': 0,
            'feedback': []
        }
        
        if len(password) < 8:
            result['valid'] = False
            result['feedback'].append("Password must be at least 8 characters long")
        else:
            result['score'] += 1
        
        if len(password) >= 12:
            result['score'] += 1
        
        if re.search(r'[a-z]', password):
            result['score'] += 1
        else:
            result['feedback'].append("Password should contain lowercase letters")
        
        if re.search(r'[A-Z]', password):
            result['score'] += 1
        else:
            result['feedback'].append("Password should contain uppercase letters")
        
        if re.search(r'\d', password):
            result['score'] += 1
        else:
            result['feedback'].append("Password should contain numbers")
        
        if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            result['score'] += 1
        else:
            result['feedback'].append("Password should contain special characters")
        
        # Check for common weak patterns
        weak_patterns = [
            r'123456', r'password', r'qwerty', r'abc123',
            r'admin', r'login', r'welcome'
        ]
        
        for pattern in weak_patterns:
            if re.search(pattern, password, re.IGNORECASE):
                result['valid'] = False
                result['feedback'].append("Password contains common weak patterns")
                break
        
        if result['score'] < 3:
            result['valid'] = False
        
        return result


class EncryptionManager:
    """Encryption utilities for sensitive data."""
    
    def __init__(self, encryption_key: Optional[str] = None):
        """Initialize encryption manager."""
        if encryption_key:
            self.key = encryption_key.encode()
        else:
            self.key = settings.secret_key.encode()
        
        # Derive encryption key from secret
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'esg_platform_salt',  # In production, use random salt
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.key))
        self.cipher = Fernet(key)
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        if not data:
            return data
        
        encrypted = self.cipher.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        if not encrypted_data:
            return encrypted_data
        
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt data")
    
    def hash_sensitive_data(self, data: str, salt: Optional[str] = None) -> str:
        """Create a hash of sensitive data for comparison."""
        if not salt:
            salt = secrets.token_hex(16)
        
        combined = f"{data}{salt}".encode()
        hash_obj = hashlib.sha256(combined)
        return f"{salt}:{hash_obj.hexdigest()}"
    
    def verify_hash(self, data: str, hash_with_salt: str) -> bool:
        """Verify data against hash."""
        try:
            salt, expected_hash = hash_with_salt.split(':', 1)
            computed_hash = self.hash_sensitive_data(data, salt)
            return hmac.compare_digest(hash_with_salt, computed_hash)
        except Exception:
            return False


class RateLimitManager:
    """Rate limiting for API endpoints."""
    
    def __init__(self):
        """Initialize rate limit manager."""
        self.limits = {
            'login': {'count': 5, 'window': 300},  # 5 attempts per 5 minutes
            'register': {'count': 3, 'window': 3600},  # 3 attempts per hour
            'file_upload': {'count': 20, 'window': 3600},  # 20 uploads per hour
            'report_generation': {'count': 10, 'window': 3600},  # 10 reports per hour
            'api_general': {'count': 1000, 'window': 3600},  # 1000 requests per hour
        }
        self.attempts = {}  # In production, use Redis or database
    
    def is_rate_limited(self, identifier: str, limit_type: str = 'api_general') -> bool:
        """Check if identifier is rate limited."""
        if limit_type not in self.limits:
            limit_type = 'api_general'
        
        limit_config = self.limits[limit_type]
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=limit_config['window'])
        
        # Clean old attempts
        if identifier in self.attempts:
            self.attempts[identifier] = [
                attempt for attempt in self.attempts[identifier]
                if attempt > window_start
            ]
        else:
            self.attempts[identifier] = []
        
        # Check if limit exceeded
        if len(self.attempts[identifier]) >= limit_config['count']:
            return True
        
        # Record this attempt
        self.attempts[identifier].append(now)
        return False
    
    def get_rate_limit_info(self, identifier: str, limit_type: str = 'api_general') -> Dict[str, Any]:
        """Get rate limit information for identifier."""
        if limit_type not in self.limits:
            limit_type = 'api_general'
        
        limit_config = self.limits[limit_type]
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=limit_config['window'])
        
        current_attempts = 0
        if identifier in self.attempts:
            current_attempts = len([
                attempt for attempt in self.attempts[identifier]
                if attempt > window_start
            ])
        
        return {
            'limit': limit_config['count'],
            'remaining': max(0, limit_config['count'] - current_attempts),
            'reset': int((now + timedelta(seconds=limit_config['window'])).timestamp()),
            'window': limit_config['window']
        }


class SecurityHeaders:
    """Security headers management."""
    
    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Get comprehensive security headers."""
        return {
            # Prevent XSS attacks
            'X-XSS-Protection': '1; mode=block',
            
            # Prevent MIME type sniffing
            'X-Content-Type-Options': 'nosniff',
            
            # Prevent clickjacking
            'X-Frame-Options': 'DENY',
            
            # HSTS (if using HTTPS)
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            
            # Content Security Policy
            'Content-Security-Policy': (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' https:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'none';"
            ),
            
            # Referrer Policy
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            
            # Feature Policy
            'Permissions-Policy': (
                'camera=(), microphone=(), geolocation=(), '
                'payment=(), usb=(), magnetometer=(), gyroscope=()'
            ),
            
            # Custom headers
            'X-ESG-Platform-Version': '1.0.0',
            'X-Content-Duration': '300'  # Cache control
        }


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request."""
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        # Take the first IP in the chain
        return forwarded_for.split(',')[0].strip()
    
    # Check for X-Real-IP header
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip.strip()
    
    # Fall back to direct connection
    return request.client.host if request.client else 'unknown'


def validate_request_origin(request: Request) -> bool:
    """Validate request origin for CSRF protection."""
    origin = request.headers.get('Origin')
    referer = request.headers.get('Referer')
    
    # Allow requests without origin/referer for API clients
    if not origin and not referer:
        return True
    
    allowed_origins = [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://yourdomain.com'  # Replace with actual domain
    ]
    
    # Check origin
    if origin:
        return origin in allowed_origins
    
    # Check referer
    if referer:
        parsed_referer = urlparse(referer)
        referer_origin = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
        return referer_origin in allowed_origins
    
    return False


def sanitize_logs(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize data for logging to prevent sensitive data exposure."""
    sanitized = {}
    
    for key, value in data.items():
        key_lower = key.lower()
        
        # Mask sensitive fields
        if key_lower in SENSITIVE_HEADERS or 'password' in key_lower or 'token' in key_lower:
            sanitized[key] = '***REDACTED***'
        elif isinstance(value, dict):
            sanitized[key] = sanitize_logs(value)
        elif isinstance(value, str) and len(value) > 100:
            sanitized[key] = value[:50] + '...[truncated]'
        else:
            sanitized[key] = value
    
    return sanitized