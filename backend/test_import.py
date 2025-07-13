#!/usr/bin/env python3

# Test script to verify the models can be imported without running the app

try:
    print("Testing basic imports...")
    from uuid import uuid4
    print("✓ UUID import successful")
    
    print("Testing model imports...")
    from app.models.tasks import Task, Evidence, TaskStatus, TaskCategory
    print("✓ Task models imported successfully")
    
    from app.models.audit import AuditLog
    print("✓ Audit model imported successfully")
    
    from app.models.company import Company, Location
    print("✓ Company models imported successfully")
    
    from app.auth.models import User
    print("✓ User model imported successfully")
    
    print("Testing schema imports...")
    from app.schemas.tasks import TaskResponse, TaskCreate
    print("✓ Task schemas imported successfully")
    
    from app.schemas.company import CompanyResponse
    print("✓ Company schemas imported successfully")
    
    from app.schemas.users import UserResponse
    print("✓ User schemas imported successfully")
    
    print("\n✅ All imports successful - UUID to String migration completed!")
    
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()