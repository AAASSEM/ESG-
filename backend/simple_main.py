"""
Simple FastAPI app for testing.
"""
from fastapi import FastAPI, HTTPException, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Annotated

app = FastAPI(title="Simple ESG API")

# In-memory user storage for demo
users_db = {}
companies_db = {}

# Request/Response models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    company_name: str
    business_sector: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get current user from token
def get_current_user(authorization: Annotated[str | None, Header()] = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    token = authorization.split(" ")[1]
    if not token.startswith("token_"):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    email = token.replace("token_", "")
    if email not in users_db:
        raise HTTPException(status_code=401, detail="User not found")
    
    return users_db[email]

@app.get("/")
async def root():
    return {"message": "ESG Platform API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/sectors")
async def get_sectors():
    return {
        "sectors": [
            {"value": "hospitality", "label": "Hospitality & Tourism"},
            {"value": "construction", "label": "Construction & Real Estate"},
            {"value": "logistics", "label": "Logistics & Transportation"},
            {"value": "retail", "label": "Retail & E-commerce"},
            {"value": "manufacturing", "label": "Manufacturing"},
            {"value": "education", "label": "Education"},
            {"value": "health", "label": "Healthcare"},
            {"value": "other", "label": "Other"}
        ]
    }

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    # Check if user already exists
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create company
    company_id = len(companies_db) + 1
    companies_db[company_id] = {
        "id": company_id,
        "name": request.company_name,
        "business_sector": request.business_sector,
        "esg_scope": None,
        "tasks": []
    }
    
    # Create user
    user_id = len(users_db) + 1
    users_db[request.email] = {
        "id": user_id,
        "email": request.email,
        "password": request.password,  # In real app, this would be hashed
        "full_name": request.full_name,
        "company_id": company_id,
        "role": "admin"
    }
    
    return {
        "message": "Registration successful",
        "user": {
            "id": user_id,
            "email": request.email,
            "full_name": request.full_name,
            "company_id": company_id,
            "role": "admin"
        }
    }

@app.post("/api/auth/token")
async def login(username: str = Form(), password: str = Form()):
    # Check if user exists and password matches
    if username not in users_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_db[username]
    if user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token with user email
    token = f"token_{user['email']}"
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "company_id": user["company_id"],
            "role": user["role"]
        }
    }

@app.get("/api/companies/current")
async def get_current_company(current_user: dict = Depends(get_current_user)):
    company = companies_db.get(current_user["company_id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company["id"],
        "name": company["name"],
        "business_sector": company["business_sector"],
        "esg_scope": company.get("esg_scope")
    }

@app.get("/api/dashboard/metrics")
async def get_dashboard_metrics():
    return {
        "overall_score": 75,
        "environmental_score": 72,
        "social_score": 78,
        "governance_score": 75,
        "trends": {
            "environmental": [65, 67, 68, 70, 69, 71, 72],
            "social": [70, 72, 74, 75, 76, 77, 78],
            "governance": [68, 69, 70, 71, 72, 73, 75]
        },
        "recent_activity": [
            {
                "id": 1,
                "type": "data_upload",
                "description": "Energy consumption data uploaded",
                "timestamp": "2 hours ago"
            },
            {
                "id": 2,
                "type": "report_generated",
                "description": "ESG report generated successfully",
                "timestamp": "1 day ago"
            }
        ]
    }

@app.get("/api/tasks")
async def get_tasks():
    return {
        "tasks": [
            {
                "id": 1,
                "title": "Energy Consumption Tracking",
                "description": "Upload monthly utility bills and energy usage data",
                "status": "in_progress",
                "category": "environmental",
                "due_date": "2024-12-15",
                "evidence_count": 2,
                "required_evidence": 5
            },
            {
                "id": 2,
                "title": "Employee Training Records",
                "description": "Document employee training programs",
                "status": "todo",
                "category": "social",
                "due_date": "2024-11-30",
                "evidence_count": 0,
                "required_evidence": 3
            }
        ]
    }

@app.get("/api/progress")
async def get_progress():
    return {
        "data_completion": {
            "overall": 68,
            "environmental": 85,
            "social": 72,
            "governance": 48
        },
        "evidence_completion": {
            "overall": 42,
            "environmental": 65,
            "social": 38,
            "governance": 25
        },
        "next_steps": [
            {
                "id": 1,
                "title": "Complete Carbon Emissions Data",
                "description": "Required for Environmental score calculation",
                "priority": "high"
            },
            {
                "id": 2,
                "title": "Upload Supporting Documents",
                "description": "32 files needed for evidence completion",
                "priority": "medium"
            }
        ]
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    company = companies_db.get(current_user["company_id"])
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "company_id": current_user["company_id"],
        "role": current_user["role"],
        "company_name": company["name"] if company else None,
        "business_sector": company["business_sector"] if company else None
    }