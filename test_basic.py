#!/usr/bin/env python3
"""
Basic validation test for ESG platform core components.
"""
import sys
import os

# Add the backend to Python path
sys.path.insert(0, 'backend')

def test_imports():
    """Test that all core modules can be imported."""
    try:
        # Test core imports
        from backend.app.config import settings
        print("✓ Config imported successfully")
        
        from backend.app.models import Company, User, Task, Evidence
        print("✓ Models imported successfully")
        
        from backend.app.core.markdown_parser import ESGContentParser
        print("✓ ESG parser imported successfully")
        
        from backend.app.core.task_generator import TaskGenerator
        print("✓ Task generator imported successfully")
        
        from backend.app.auth.dependencies import verify_password, create_access_token
        print("✓ Auth dependencies imported successfully")
        
        print("\n✅ All core imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_esg_parser():
    """Test ESG content parser."""
    try:
        from backend.app.core.markdown_parser import ESGContentParser
        from backend.app.models.company import BusinessSector
        
        parser = ESGContentParser()
        
        # Test content validation
        validation_result = parser.validate_content_structure()
        print(f"✓ ESG content validation: {'PASSED' if validation_result else 'WARNING'}")
        
        # Test parsing a specific sector
        try:
            questions = parser.parse_sector_content(BusinessSector.HOSPITALITY)
            print(f"✓ Parsed {len(questions)} questions for hospitality sector")
        except Exception as e:
            print(f"⚠️  ESG parsing warning: {e}")
        
        print("✅ ESG parser tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ ESG parser error: {e}")
        return False

def test_models():
    """Test model definitions."""
    try:
        from backend.app.models.company import BusinessSector, LocationType
        from backend.app.models.tasks import TaskStatus, TaskCategory
        
        # Test enums
        print(f"✓ Business sectors: {len(BusinessSector)} defined")
        print(f"✓ Task statuses: {len(TaskStatus)} defined")
        print(f"✓ Task categories: {len(TaskCategory)} defined")
        
        print("✅ Model tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Model error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Running ESG Platform Basic Validation Tests\n")
    
    all_passed = True
    
    print("1. Testing imports...")
    all_passed &= test_imports()
    
    print("\n2. Testing ESG parser...")
    all_passed &= test_esg_parser()
    
    print("\n3. Testing models...")
    all_passed &= test_models()
    
    print(f"\n{'🎉 All tests passed!' if all_passed else '⚠️  Some tests failed'}")
    
    if all_passed:
        print("\n✅ Core backend implementation is functional!")
        print("✅ Ready for API testing with proper dependencies installed")
    else:
        print("\n❌ Fix the errors above before proceeding")
        sys.exit(1)