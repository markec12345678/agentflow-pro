#!/usr/bin/env python3
"""
Convert Prisma schema from PostgreSQL to SQLite-compatible format.
Processes line by line to preserve formatting.
"""

import re
import sys

def convert_schema(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    changes_made = []
    output_lines = []
    in_enum = False
    enum_name = ""
    
    json_count = 0
    text_count = 0
    array_count = 0
    enum_count = 0
    user_role_count = 0
    
    for line in lines:
        original_line = line
        
        # Handle enum definitions
        if re.match(r'^enum\s+\w+\s*\{', line):
            in_enum = True
            enum_name = re.match(r'^enum\s+(\w+)\s*\{', line).group(1)
            output_lines.append(f'// enum {enum_name} {{\n')
            enum_count += 1
            continue
        
        if in_enum:
            if '}' in line and line.strip() == '}':
                output_lines.append('// }\n')
                in_enum = False
            else:
                output_lines.append(f'// {line}')
            continue
        
        # Remove @db.Text
        if '@db.Text' in line:
            line = line.replace('@db.Text', '').rstrip() + '\n'
            text_count += 1
        
        # Convert Json to String
        if re.search(r'\bJson\b', line):
            # Count fields
            field_match = re.match(r'^\s*(\w+)\s+', line)
            if field_match:
                json_count += 1
            
            # Replace Json with String, preserving structure
            line = re.sub(r'\bJson\b', 'String', line)
        
        # Convert String[] to String
        if re.search(r'\bString\[\]\b', line):
            field_match = re.match(r'^\s*(\w+)\s+', line)
            if field_match:
                array_count += 1
            
            # Replace String[] with String
            line = re.sub(r'\bString\[\]\b', 'String', line)
            
            # Fix default values - replace @default([...]) with @default("")
            if re.search(r'@default\(\[.*\]\)', line):
                line = re.sub(r'@default\(\[.*\]\)', '@default("")', line)
            elif '@default' not in line and '?' not in line:
                # Add default for required fields
                line = line.rstrip() + ' @default("")\n'
        
        # Convert UserRole to String
        if 'UserRole' in line:
            if re.search(r'\bUserRole\b', line, re.IGNORECASE):
                user_role_count += 1
                line = re.sub(r'\bUserRole\b', 'String', line)
                # Handle default values
                line = re.sub(r'@default\((ADMIN|EDITOR|VIEWER)\)', r'@default("\1")', line)
        
        output_lines.append(line)
    
    if text_count > 0:
        changes_made.append(f"Removed @db.Text from {text_count} fields")
    if json_count > 0:
        changes_made.append(f"Converted {json_count} Json fields to String")
    if array_count > 0:
        changes_made.append(f"Converted {array_count} String[] fields to String")
    if enum_count > 0:
        changes_made.append(f"Commented out {enum_count} enum definitions")
    if user_role_count > 0:
        changes_made.append(f"Converted {user_role_count} UserRole references to String")
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)
    
    print("Schema Conversion Summary")
    print("=" * 50)
    for change in changes_made:
        print(change)
    print("=" * 50)
    print(f"\nConverted schema saved to: {output_file}")
    print("\nNext steps:")
    print("1. Update your .env file to use: DATABASE_URL=\"file:./dev.db\"")
    print("2. Run: prisma generate")
    print("3. Run: prisma db push")

if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'prisma/schema.prisma'
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file
    
    convert_schema(input_file, output_file)
