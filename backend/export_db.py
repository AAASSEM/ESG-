#!/usr/bin/env python3
"""
Export all database tables to CSV files
"""

import sqlite3
import json
import csv
import os
from datetime import datetime

def export_database():
    # Connect to database
    conn = sqlite3.connect('data/esg_platform.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Create export directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    export_dir = f"database_export_{timestamp}"
    os.makedirs(export_dir, exist_ok=True)
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"🗄️  Exporting ESG Platform Database")
    print(f"📁 Export directory: {export_dir}")
    print(f"📊 Tables to export: {len(tables)}")
    print()
    
    exported_files = []
    
    for table_name in tables:
        print(f"📋 Exporting {table_name}...")
        
        # Get data
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        if rows:
            # Convert to dictionaries
            data = [dict(row) for row in rows]
            
            # Export to CSV
            filename = os.path.join(export_dir, f"{table_name}.csv")
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                
                for row in data:
                    # Handle JSON fields for better readability
                    clean_row = {}
                    for key, value in row.items():
                        if value and isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                            try:
                                # Pretty print JSON
                                parsed = json.loads(value)
                                clean_row[key] = json.dumps(parsed, indent=2, ensure_ascii=False)
                            except:
                                clean_row[key] = value
                        else:
                            clean_row[key] = value
                    writer.writerow(clean_row)
            
            exported_files.append(filename)
            print(f"   ✅ {len(rows)} records exported to {filename}")
        else:
            print(f"   ⚪ No data in {table_name}")
    
    # Also create a JSON export for easier reading
    json_filename = os.path.join(export_dir, "full_database.json")
    full_data = {}
    
    for table_name in tables:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        full_data[table_name] = [dict(row) for row in rows]
    
    with open(json_filename, 'w', encoding='utf-8') as jsonfile:
        json.dump(full_data, jsonfile, indent=2, ensure_ascii=False, default=str)
    
    exported_files.append(json_filename)
    
    conn.close()
    
    print()
    print(f"🎉 Export completed!")
    print(f"📁 Directory: {export_dir}")
    print(f"📄 Files created: {len(exported_files)}")
    print()
    print("Files in export:")
    for file in exported_files:
        size = os.path.getsize(file)
        print(f"  • {os.path.basename(file)} ({size:,} bytes)")
    
    return export_dir

if __name__ == "__main__":
    export_database()