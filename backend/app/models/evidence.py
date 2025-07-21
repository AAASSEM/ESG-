"""
Evidence model for task documentation.
"""
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Evidence(Base):
    """Evidence model for task compliance documentation."""
    __tablename__ = "evidence"
    
    # Use String ID instead of UUID for SQLite compatibility
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"))
    
    # File information
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)  # in bytes
    file_type = Column(String)
    
    # Evidence details
    description = Column(Text)
    uploaded_by = Column(String, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="evidence")
    
    def __repr__(self):
        return f"<Evidence(id={self.id}, filename={self.filename})>"