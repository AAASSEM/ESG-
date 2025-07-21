#!/usr/bin/env python3
"""
Simple database viewer for ESG Platform
Provides easy access to view and export database contents
"""

import sqlite3
import json
import csv
import os
from datetime import datetime
from typing import Dict, List, Any

class DatabaseViewer:
    def __init__(self, db_path: str = "data/esg_platform.db"):
        self.db_path = db_path
        if not os.path.exists(db_path):
            print(f"❌ Database not found at: {db_path}")
            exit(1)
        
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row  # This allows column access by name
        
    def list_tables(self) -> List[str]:
        """Get all table names"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        return [row[0] for row in cursor.fetchall()]
    
    def get_table_schema(self, table_name: str) -> List[Dict]:
        """Get table column information"""
        cursor = self.conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        return [dict(row) for row in cursor.fetchall()]
    
    def get_table_data(self, table_name: str, limit: int = None) -> List[Dict]:
        """Get all data from a table"""
        cursor = self.conn.cursor()
        query = f"SELECT * FROM {table_name}"
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        return [dict(row) for row in cursor.fetchall()]
    
    def export_table_to_csv(self, table_name: str, filename: str = None):
        """Export table data to CSV"""
        if not filename:
            filename = f"{table_name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        data = self.get_table_data(table_name)
        if not data:
            print(f"No data to export from {table_name}")
            return
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            if data:
                fieldnames = data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for row in data:
                    # Handle JSON fields
                    clean_row = {}
                    for key, value in row.items():
                        if value and isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                            try:
                                # Pretty print JSON for CSV
                                clean_row[key] = json.dumps(json.loads(value), indent=2)
                            except:
                                clean_row[key] = value
                        else:
                            clean_row[key] = value
                    writer.writerow(clean_row)
        
        print(f"✅ Exported {table_name} to {filename}")
        return filename
    
    def export_all_tables(self):
        """Export all tables to CSV files"""
        export_dir = f"database_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        os.makedirs(export_dir, exist_ok=True)
        
        tables = self.list_tables()
        exported_files = []
        
        for table in tables:
            filename = os.path.join(export_dir, f"{table}.csv")
            self.export_table_to_csv(table, filename)
            exported_files.append(filename)
        
        print(f"\n🗂️  All tables exported to directory: {export_dir}")
        return export_dir, exported_files
    
    def print_table_summary(self, table_name: str):
        """Print a nice summary of a table"""
        schema = self.get_table_schema(table_name)
        data = self.get_table_data(table_name)
        
        print(f"\n📋 TABLE: {table_name}")
        print("=" * 50)
        print(f"Columns: {len(schema)}")
        print(f"Records: {len(data)}")
        
        print("\nSchema:")
        for col in schema:
            print(f"  • {col['name']} ({col['type']}) {'PRIMARY KEY' if col['pk'] else ''}")
        
        if data:
            print(f"\nSample Records (showing max 3):")
            for i, record in enumerate(data[:3]):
                print(f"\n  Record {i+1}:")
                for key, value in record.items():
                    if value and isinstance(value, str) and len(value) > 100:
                        print(f"    {key}: {value[:100]}...")
                    elif value and isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                        try:
                            parsed = json.loads(value)
                            print(f"    {key}: {json.dumps(parsed, indent=6)}")
                        except:
                            print(f"    {key}: {value}")
                    else:
                        print(f"    {key}: {value}")
        
        return len(data)
    
    def search_records(self, table_name: str, column: str, search_term: str):
        """Search for records containing a term"""
        cursor = self.conn.cursor()
        query = f"SELECT * FROM {table_name} WHERE {column} LIKE ?"
        cursor.execute(query, (f"%{search_term}%",))
        return [dict(row) for row in cursor.fetchall()]
    
    def close(self):
        """Close database connection"""
        self.conn.close()

def main():
    print("🗄️  ESG Platform Database Viewer")
    print("=" * 40)
    
    # Initialize viewer
    viewer = DatabaseViewer()
    
    try:
        # Show overview
        tables = viewer.list_tables()
        print(f"Database: {viewer.db_path}")
        print(f"Tables found: {tables}")
        print()
        
        # Interactive menu
        while True:
            print("\n🔍 What would you like to do?")
            print("1. View table summary")
            print("2. Export table to CSV")
            print("3. Export ALL tables to CSV")
            print("4. Search in table")
            print("5. Show all companies")
            print("6. Show all users")
            print("7. Show all tasks")
            print("8. Exit")
            
            choice = input("\nEnter choice (1-8): ").strip()
            
            if choice == "1":
                print(f"\nAvailable tables: {', '.join(tables)}")
                table_name = input("Enter table name: ").strip()
                if table_name in tables:
                    viewer.print_table_summary(table_name)
                else:
                    print("❌ Table not found")
            
            elif choice == "2":
                print(f"\nAvailable tables: {', '.join(tables)}")
                table_name = input("Enter table name: ").strip()
                if table_name in tables:
                    filename = input("Enter filename (or press Enter for auto): ").strip()
                    if not filename:
                        filename = None
                    viewer.export_table_to_csv(table_name, filename)
                else:
                    print("❌ Table not found")
            
            elif choice == "3":
                export_dir, files = viewer.export_all_tables()
                print(f"Files created: {len(files)}")
            
            elif choice == "4":
                print(f"\nAvailable tables: {', '.join(tables)}")
                table_name = input("Enter table name: ").strip()
                if table_name in tables:
                    column = input("Enter column name: ").strip()
                    term = input("Enter search term: ").strip()
                    results = viewer.search_records(table_name, column, term)
                    print(f"\nFound {len(results)} results:")
                    for i, result in enumerate(results[:5]):  # Show max 5
                        print(f"\nResult {i+1}: {dict(result)}")
                else:
                    print("❌ Table not found")
            
            elif choice == "5":
                viewer.print_table_summary("companies")
            
            elif choice == "6":
                viewer.print_table_summary("users")
            
            elif choice == "7":
                viewer.print_table_summary("tasks")
            
            elif choice == "8":
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid choice")
    
    finally:
        viewer.close()

if __name__ == "__main__":
    main()