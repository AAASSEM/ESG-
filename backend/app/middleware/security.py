"""
Security middleware for ESG platform.
"""
import time
import json
from typing import Callable, Dict, Any
from datetime import datetime
import logging

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from ..core.security import (
    SecurityHeaders, RateLimitManager, get_client_ip, 
    validate_request_origin, sanitize_logs
)
from ..config import settings

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Global rate limit manager
rate_limit_manager = RateLimitManager()


async def security_headers_middleware(request: Request, call_next: Callable) -> Response:
    """Add comprehensive security headers to all responses."""
    response = await call_next(request)
    
    # Add security headers
    security_headers = SecurityHeaders.get_security_headers()
    for header, value in security_headers.items():
        response.headers[header] = value
    
    return response


async def rate_limiting_middleware(request: Request, call_next: Callable) -> Response:
    """Apply rate limiting based on endpoint and user."""
    client_ip = get_client_ip(request)
    path = request.url.path
    method = request.method
    
    # Determine rate limit type based on endpoint
    limit_type = _determine_rate_limit_type(path, method)
    
    # Check if rate limited
    if rate_limit_manager.is_rate_limited(client_ip, limit_type):
        # Log rate limit violation
        logger.warning(
            f"Rate limit exceeded for IP {client_ip} on {method} {path}",
            extra={
                'ip_address': client_ip,
                'endpoint': path,
                'method': method,
                'limit_type': limit_type
            }
        )
        
        # Get rate limit info for headers
        limit_info = rate_limit_manager.get_rate_limit_info(client_ip, limit_type)
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                'error': 'Rate limit exceeded',
                'detail': f'Too many requests. Try again later.',
                'retry_after': limit_info['reset']
            },
            headers={
                'X-RateLimit-Limit': str(limit_info['limit']),
                'X-RateLimit-Remaining': str(limit_info['remaining']),
                'X-RateLimit-Reset': str(limit_info['reset']),
                'Retry-After': str(limit_info['window'])
            }
        )
    
    response = await call_next(request)
    
    # Add rate limit headers to successful responses
    limit_info = rate_limit_manager.get_rate_limit_info(client_ip, limit_type)
    response.headers['X-RateLimit-Limit'] = str(limit_info['limit'])
    response.headers['X-RateLimit-Remaining'] = str(limit_info['remaining'])
    response.headers['X-RateLimit-Reset'] = str(limit_info['reset'])
    
    return response


def _determine_rate_limit_type(path: str, method: str) -> str:
    """Determine appropriate rate limit type for endpoint."""
    if '/auth/token' in path and method == 'POST':
        return 'login'
    elif '/auth/register' in path and method == 'POST':
        return 'register'
    elif '/evidence' in path and method == 'POST':
        return 'file_upload'
    elif '/reports' in path and method == 'GET':
        return 'report_generation'
    else:
        return 'api_general'


async def request_validation_middleware(request: Request, call_next: Callable) -> Response:
    """Validate request security and log suspicious activity."""
    start_time = time.time()
    client_ip = get_client_ip(request)
    
    # Validate request origin for state-changing operations
    if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
        if not validate_request_origin(request):
            logger.warning(
                f"Invalid request origin from IP {client_ip}",
                extra={
                    'ip_address': client_ip,
                    'origin': request.headers.get('Origin'),
                    'referer': request.headers.get('Referer'),
                    'endpoint': request.url.path
                }
            )
            
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={'error': 'Invalid request origin'}
            )
    
    # Check for suspicious request patterns
    if _is_suspicious_request(request):
        logger.warning(
            f"Suspicious request detected from IP {client_ip}",
            extra={
                'ip_address': client_ip,
                'endpoint': request.url.path,
                'method': request.method,
                'user_agent': request.headers.get('User-Agent'),
                'headers': sanitize_logs(dict(request.headers))
            }
        )
    
    response = await call_next(request)
    
    # Log request completion
    process_time = time.time() - start_time
    _log_request_completion(request, response, process_time, client_ip)
    
    return response


def _is_suspicious_request(request: Request) -> bool:
    """Detect potentially suspicious request patterns."""
    # Check for SQL injection patterns in URL
    sql_patterns = [
        'union', 'select', 'insert', 'delete', 'drop', 'create',
        'alter', 'exec', 'script', 'javascript:', 'vbscript:'
    ]
    
    url_path = request.url.path.lower()
    for pattern in sql_patterns:
        if pattern in url_path:
            return True
    
    # Check for excessively long paths (potential buffer overflow)
    if len(request.url.path) > 2000:
        return True
    
    # Check for suspicious user agents
    user_agent = request.headers.get('User-Agent', '').lower()
    suspicious_agents = [
        'sqlmap', 'nmap', 'nikto', 'dirb', 'burp', 'crawler',
        'bot', 'scanner', 'exploit'
    ]
    
    for agent in suspicious_agents:
        if agent in user_agent:
            return True
    
    # Check for missing or suspicious headers for browser requests
    if request.method in ['GET', 'POST'] and request.url.path.startswith('/api/'):
        if not request.headers.get('User-Agent'):
            return True
    
    return False


def _log_request_completion(request: Request, response: Response, process_time: float, client_ip: str):
    """Log request completion with security context."""
    log_data = {
        'ip_address': client_ip,
        'method': request.method,
        'endpoint': request.url.path,
        'status_code': response.status_code,
        'process_time': round(process_time, 3),
        'user_agent': request.headers.get('User-Agent'),
        'content_length': response.headers.get('Content-Length', 0)
    }
    
    # Add authentication context if available
    if hasattr(request.state, 'user'):
        log_data['user_id'] = request.state.user.id
        log_data['user_role'] = request.state.user.role
    
    # Log at appropriate level based on status code
    if response.status_code >= 500:
        logger.error("Request completed with server error", extra=log_data)
    elif response.status_code >= 400:
        logger.warning("Request completed with client error", extra=log_data)
    else:
        logger.info("Request completed successfully", extra=log_data)


async def audit_logging_middleware(request: Request, call_next: Callable) -> Response:
    """Enhanced audit logging for compliance."""
    # Skip logging for health checks and static assets
    if request.url.path in ['/health', '/docs', '/redoc', '/openapi.json']:
        return await call_next(request)
    
    audit_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'ip_address': get_client_ip(request),
        'method': request.method,
        'endpoint': request.url.path,
        'query_params': dict(request.query_params),
        'user_agent': request.headers.get('User-Agent'),
        'content_type': request.headers.get('Content-Type')
    }
    
    # Add authentication context
    if hasattr(request.state, 'user'):
        audit_data.update({
            'user_id': request.state.user.id,
            'user_email': request.state.user.email,
            'user_role': request.state.user.role,
            'company_id': request.state.user.company_id
        })
    
    # For sensitive operations, log request body (sanitized)
    if _is_audit_worthy_endpoint(request.url.path, request.method):
        try:
            if request.headers.get('Content-Type', '').startswith('application/json'):
                body = await request.body()
                if body:
                    body_data = json.loads(body.decode())
                    audit_data['request_body'] = sanitize_logs(body_data)
        except Exception as e:
            audit_data['request_body_error'] = str(e)
    
    response = await call_next(request)
    
    # Add response context
    audit_data.update({
        'status_code': response.status_code,
        'response_size': len(response.body) if hasattr(response, 'body') else 0
    })
    
    # Log to audit trail
    logger.info("Audit log entry", extra={'audit': audit_data})
    
    # For compliance, also log to separate audit file
    if _requires_compliance_logging(request.url.path, request.method):
        _log_compliance_event(audit_data)
    
    return response


def _is_audit_worthy_endpoint(path: str, method: str) -> bool:
    """Determine if endpoint requires detailed audit logging."""
    audit_patterns = [
        ('/auth/', ['POST']),
        ('/tasks/', ['POST', 'PUT', 'DELETE']),
        ('/evidence/', ['POST', 'DELETE']),
        ('/companies/', ['POST', 'PUT', 'DELETE']),
        ('/reports/', ['GET']),
        ('/esg/scoping/', ['POST'])
    ]
    
    for pattern, methods in audit_patterns:
        if pattern in path and method in methods:
            return True
    
    return False


def _requires_compliance_logging(path: str, method: str) -> bool:
    """Determine if endpoint requires compliance logging."""
    compliance_patterns = [
        '/evidence/',
        '/reports/',
        '/esg/scoping/',
        '/auth/register',
        '/auth/change-password'
    ]
    
    return any(pattern in path for pattern in compliance_patterns)


def _log_compliance_event(audit_data: Dict[str, Any]):
    """Log compliance event to separate audit trail."""
    # In production, this would write to a separate audit database
    # or send to a SIEM system
    compliance_logger = logging.getLogger('compliance')
    compliance_logger.info(
        "Compliance audit event",
        extra={
            'event_type': 'user_action',
            'compliance_data': audit_data
        }
    )


async def content_security_middleware(request: Request, call_next: Callable) -> Response:
    """Additional content security measures."""
    # Check content length for potential DoS attacks
    content_length = request.headers.get('Content-Length')
    if content_length:
        try:
            length = int(content_length)
            max_content_length = 100 * 1024 * 1024  # 100MB
            
            if length > max_content_length:
                logger.warning(
                    f"Request with excessive content length: {length} bytes from {get_client_ip(request)}"
                )
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={'error': 'Request entity too large'}
                )
        except ValueError:
            pass
    
    # Check for potential request smuggling
    transfer_encoding = request.headers.get('Transfer-Encoding')
    if transfer_encoding and 'chunked' in transfer_encoding.lower():
        if content_length:
            logger.warning(
                f"Potential request smuggling attempt from {get_client_ip(request)}: "
                f"Both Content-Length and Transfer-Encoding headers present"
            )
    
    response = await call_next(request)
    
    # Remove potentially sensitive headers from response
    sensitive_headers = [
        'Server', 'X-Powered-By', 'X-AspNet-Version',
        'X-AspNetMvc-Version', 'X-Runtime'
    ]
    
    for header in sensitive_headers:
        if header in response.headers:
            del response.headers[header]
    
    return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """Combined security middleware class."""
    
    def __init__(self, app):
        """Initialize security middleware."""
        super().__init__(app)
        self.rate_limiter = RateLimitManager()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply all security measures."""
        # Apply middleware in order
        middlewares = [
            content_security_middleware,
            request_validation_middleware,
            rate_limiting_middleware,
            audit_logging_middleware,
            security_headers_middleware
        ]
        
        # Chain middlewares
        for middleware in reversed(middlewares):
            call_next = lambda req, middleware=middleware, next_call=call_next: middleware(req, next_call)
        
        return await call_next(request)