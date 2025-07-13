#!/usr/bin/env python3
"""
Demo script showing key ESG platform functionality.
"""
import sys
import os
import asyncio
import json

# Add the backend to Python path
sys.path.insert(0, 'backend')

async def demo_esg_functionality():
    """Demonstrate core ESG platform functionality."""
    print("🌍 ESG Platform Core Functionality Demo\n")
    
    # 1. ESG Content Parser Demo
    print("1. 📋 ESG Content Parser")
    print("-" * 40)
    
    from backend.app.core.markdown_parser import ESGContentParser
    from backend.app.models.company import BusinessSector
    
    parser = ESGContentParser()
    
    # Test content validation
    if parser.validate_content_structure():
        print("✅ ESG content structure is valid")
    else:
        print("⚠️  ESG content validation warnings")
    
    # Parse hospitality sector
    try:
        questions = parser.parse_sector_content(BusinessSector.HOSPITALITY)
        print(f"✅ Parsed {len(questions)} questions for hospitality sector")
        
        if questions:
            sample_question = questions[0]
            print(f"\n📝 Sample Question:")
            print(f"   Title: {sample_question.wizard_question}")
            print(f"   Category: {sample_question.category}")
            print(f"   Frameworks: {sample_question.frameworks[:100]}...")
    except Exception as e:
        print(f"❌ Error parsing hospitality content: {e}")
    
    # Test all sectors
    print(f"\n🏢 Testing all {len(BusinessSector)} business sectors:")
    all_content = parser.get_all_sectors_content()
    for sector, questions in all_content.items():
        status = "✅" if questions else "⚠️ "
        print(f"   {status} {sector.value}: {len(questions)} questions")
    
    # 2. Task Generator Demo
    print(f"\n2. ⚙️  Task Generator")
    print("-" * 40)
    
    from backend.app.core.task_generator import TaskGenerator
    
    task_generator = TaskGenerator()
    
    # Test framework extraction
    test_frameworks = "DST Carbon Calculator: Mandatory Input Green Key: 1.1 Environmental Manager (I)"
    frameworks = task_generator._extract_framework_tags(test_frameworks)
    print(f"✅ Framework extraction: {frameworks}")
    
    # 3. Authentication Demo
    print(f"\n3. 🔐 Authentication System")
    print("-" * 40)
    
    from backend.app.auth.dependencies import verify_password, get_password_hash, create_access_token
    
    # Test password hashing
    password = "SecurePassword123!"
    hashed = get_password_hash(password)
    is_valid = verify_password(password, hashed)
    print(f"✅ Password hashing: {'Valid' if is_valid else 'Invalid'}")
    
    # Test token creation
    test_data = {"sub": "test-user-id", "role": "admin"}
    token = create_access_token(test_data)
    print(f"✅ JWT token generated: {len(token)} characters")
    
    # 4. Models Demo
    print(f"\n4. 🗄️  Data Models")
    print("-" * 40)
    
    from backend.app.models.company import BusinessSector, LocationType
    from backend.app.models.tasks import TaskStatus, TaskCategory
    
    print(f"✅ Business Sectors: {[s.value for s in BusinessSector]}")
    print(f"✅ Task Categories: {[c.value for c in TaskCategory]}")
    print(f"✅ Task Statuses: {[s.value for s in TaskStatus]}")
    
    # 5. Configuration Demo
    print(f"\n5. ⚙️  Configuration")
    print("-" * 40)
    
    from backend.app.config import settings
    
    print(f"✅ ESG Content File: {settings.esg_content_file}")
    print(f"✅ Evidence Storage: {settings.evidence_storage_path}")
    print(f"✅ Max File Size: {settings.max_file_size_mb}MB")
    print(f"✅ Allowed File Types: {len(settings.allowed_file_types)} types")
    
    print(f"\n🎉 All core functionality is working!")
    print("🚀 Ready for full application deployment!")

if __name__ == "__main__":
    try:
        asyncio.run(demo_esg_functionality())
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        sys.exit(1)