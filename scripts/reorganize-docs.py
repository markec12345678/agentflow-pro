#!/usr/bin/env python3
"""
AgentFlow Pro - Documentation Reorganization Script

Professional documentation reorganization with:
- Content analysis for categorization
- Git mv for history preservation
- Automatic index.md generation
- Link validation and updates

Usage: python scripts/reorganize-docs.py
"""

import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
ROOT_MARKDOWN_DIR = PROJECT_ROOT

# Target directory structure
TARGET_STRUCTURE = {
    "01-GETTING-STARTED": {
        "description": "Quick start guides, installation, setup",
        "patterns": ["quickstart", "getting-started", "setup", "installation", "README"],
    },
    "02-ARCHITECTURE": {
        "description": "System architecture, domain model, design decisions",
        "patterns": ["architecture", "structure", "design", "domain", "system"],
    },
    "03-USER-GUIDES": {
        "description": "End-user documentation for different roles",
        "patterns": ["receptionist", "director", "admin", "user-guide", "guest"],
    },
    "04-DEVELOPER-GUIDES": {
        "description": "Developer documentation, API references, coding guides",
        "patterns": ["developer", "api", "agent-development", "workflow", "template"],
    },
    "05-DEVOPS": {
        "description": "Deployment, monitoring, CI/CD, infrastructure",
        "patterns": ["deploy", "production", "vercel", "docker", "ci", "cd", "monitoring", "sentry"],
    },
    "06-TESTING": {
        "description": "Testing strategies, load testing, QA",
        "patterns": ["test", "load-test", "k6", "playwright", "qa"],
    },
    "07-INTEGRATIONS": {
        "description": "Third-party integrations, PMS, Stripe, OAuth",
        "patterns": ["integration", "stripe", "oauth", "pms", "booking", "firebase"],
    },
    "08-MARKETING": {
        "description": "Marketing, launch, beta, outreach",
        "patterns": ["launch", "beta", "marketing", "product-hunt", "outreach"],
    },
    "09-RESEARCH": {
        "description": "Research documents, roadmap, analysis",
        "patterns": ["research", "roadmap", "analysis", "comparison"],
    },
    "10-SECURITY": {
        "description": "Security audits, compliance, best practices",
        "patterns": ["security", "audit", "compliance"],
    },
    "ARCHIVED/2026-02": {
        "description": "Archived reports from February 2026",
        "patterns": ["PHASE1", "2026-02"],
        "archive": True,
    },
    "ARCHIVED/2026-03": {
        "description": "Archived reports from March 2026",
        "patterns": ["FINAL", "COMPLETE", "STATUS", "GAP-ANALYSIS", "2026-03"],
        "archive": True,
    },
}


@dataclass
class DocumentInfo:
    """Information about a document file."""
    path: Path
    filename: str
    title: str
    content_preview: str
    category: Optional[str] = None
    confidence: float = 0.0
    is_archived: bool = False


def extract_title(content: str) -> str:
    """Extract title from markdown content."""
    lines = content.split('\n')
    for line in lines[:10]:  # Check first 10 lines
        if line.startswith('# '):
            return line[2:].strip()
    return ""


def analyze_document(file_path: Path) -> DocumentInfo:
    """Analyze a document and extract metadata."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"⚠️  Error reading {file_path}: {e}")
        return DocumentInfo(
            path=file_path,
            filename=file_path.name,
            title="",
            content_preview=""
        )
    
    title = extract_title(content)
    preview = content[:200].replace('\n', ' ')
    
    return DocumentInfo(
        path=file_path,
        filename=file_path.name,
        title=title,
        content_preview=preview
    )


def categorize_document(doc: DocumentInfo) -> Tuple[str, float]:
    """
    Categorize a document based on filename and content.
    Returns (category, confidence_score)
    """
    filename_lower = doc.filename.lower()
    title_lower = doc.title.lower()
    preview_lower = doc.content_preview.lower()
    
    scores = {}
    
    for category, config in TARGET_STRUCTURE.items():
        score = 0
        patterns = config.get("patterns", [])
        
        # Check filename matches
        for pattern in patterns:
            if pattern.lower() in filename_lower:
                score += 3
            if pattern.lower() in title_lower:
                score += 2
            if pattern.lower() in preview_lower:
                score += 1
        
        # Special cases
        if "FINAL" in filename_lower or "COMPLETE" in filename_lower:
            if "2026-03" in filename_lower or category.startswith("ARCHIVED/2026-03"):
                score += 10
        if "PHASE1" in filename_lower and category.startswith("ARCHIVED/2026-02"):
            score += 10
        
        if score > 0:
            scores[category] = score
    
    if not scores:
        return ("ARCHIVED/MISC", 0.5)
    
    best_category = max(scores, key=scores.get)
    confidence = min(scores[best_category] / 10.0, 1.0)
    
    return (best_category, confidence)


def get_all_markdown_files() -> List[Path]:
    """Get all markdown files from docs/ and root directory."""
    markdown_files = []
    
    # Root directory markdown files (excluding common non-doc files)
    exclude_patterns = ['CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md']
    for file in ROOT_MARKDOWN_DIR.glob("*.md"):
        if file.name not in exclude_patterns and file.name != "README.md":
            markdown_files.append(file)
    
    # Docs directory (including git-ignored)
    docs_root = DOCS_DIR
    if docs_root.exists():
        # Use os.walk to get all files including git-ignored
        for root, dirs, files in os.walk(docs_root):
            # Skip existing subdirectories that are already organized
            if any(root.endswith(subdir) for subdir in TARGET_STRUCTURE.keys()):
                continue
            
            for file in files:
                if file.endswith('.md') or file.endswith('.txt'):
                    markdown_files.append(Path(root) / file)
    
    return markdown_files


def create_directory_structure():
    """Create target directory structure."""
    print("\n📁 Creating directory structure...")
    
    for category in TARGET_STRUCTURE.keys():
        target_dir = DOCS_DIR / category
        target_dir.mkdir(parents=True, exist_ok=True)
        print(f"   ✓ Created: {target_dir.relative_to(PROJECT_ROOT)}")
    
    print("   ✅ Directory structure ready")


def move_document(doc: DocumentInfo, target_category: str) -> bool:
    """Move a document to its target category using git mv if available."""
    target_dir = DOCS_DIR / target_category
    target_dir.mkdir(parents=True, exist_ok=True)
    
    target_path = target_dir / doc.filename
    
    # Skip if already in correct location
    if doc.path.parent == target_dir:
        return True
    
    # Check if file already exists at target
    if target_path.exists():
        print(f"   ⚠️  Skipping {doc.filename} - already exists in {target_category}")
        return False
    
    # Try git mv first (preserves history)
    try:
        import subprocess
        result = subprocess.run(
            ["git", "mv", str(doc.path), str(target_path)],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )
        if result.returncode == 0:
            print(f"   📦 git mv: {doc.filename} → {target_category}")
            return True
        else:
            # Fall back to regular move
            raise Exception("git mv failed")
    except Exception:
        # Regular move
        try:
            shutil.move(str(doc.path), str(target_path))
            print(f"   📦 mv: {doc.filename} → {target_category}")
            return True
        except Exception as e:
            print(f"   ❌ Error moving {doc.filename}: {e}")
            return False


def generate_index_md(category: str, documents: List[DocumentInfo]) -> str:
    """Generate index.md content for a category."""
    config = TARGET_STRUCTURE.get(category, {})
    description = config.get("description", "Documentation files")
    
    content = f"""# {category.replace('/', ' ')}

{description}

---

## 📚 Documents

"""
    
    # Group by type (archived vs active)
    active_docs = [d for d in documents if not d.is_archived]
    
    if active_docs:
        content += "### Active Documentation\n\n"
        content += "| Document | Description |\n"
        content += "|----------|-------------|\n"
        
        for doc in sorted(active_docs, key=lambda x: x.filename):
            title = doc.title or doc.filename.replace('.md', '').replace('-', ' ').title()
            content += f"| [{title}]({doc.filename}) | {doc.content_preview[:100]}... |\n"
        
        content += "\n"
    
    # Archived docs
    if category.startswith("ARCHIVED/"):
        content += "\n### Archived Reports\n\n"
        content += "These documents are kept for historical reference.\n\n"
    
    content += """
---

## 📋 Navigation

- [**Getting Started**](../01-GETTING-STARTED) - Quick start and setup
- [**Architecture**](../02-ARCHITECTURE) - System design and domain model
- [**User Guides**](../03-USER-GUIDES) - End-user documentation
- [**Developer Guides**](../04-DEVELOPER-GUIDES) - API and development
- [**DevOps**](../05-DEVOPS) - Deployment and infrastructure
- [**Testing**](../06-TESTING) - Testing strategies
- [**Integrations**](../07-INTEGRATIONS) - Third-party services
- [**Marketing**](../08-MARKETING) - Launch and outreach
- [**Research**](../09-RESEARCH) - Analysis and roadmap
- [**Security**](../10-SECURITY) - Security audits
- [**Archived**](../ARCHIVED) - Historical documents

---

*Last updated: {date}*
""".format(date=Path(PROJECT_ROOT).stat().st_mtime)
    
    return content


def update_links_in_file(file_path: Path, old_docs_root: Path, new_docs_root: Path) -> bool:
    """Update internal links in a markdown file after reorganization."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Update relative links
        # Pattern: [text](../old-path/file.md) or [text](old-file.md)
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        
        def update_link(match):
            text = match.group(1)
            link = match.group(2)
            
            # Skip external links and anchors
            if link.startswith('http') or link.startswith('#'):
                return match.group(0)
            
            # Update relative paths
            if link.startswith('../'):
                # Adjust path depth
                new_link = link.replace('../', '../../', 1)
                return f"[{text}]({new_link})"
            elif link.endswith('.md'):
                # Same directory link
                return f"[{text}]({link})"
            
            return match.group(0)
        
        content = re.sub(link_pattern, update_link, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"   ⚠️  Error updating links in {file_path}: {e}")
        return False


def main():
    """Main reorganization workflow."""
    print("=" * 70)
    print("📚 AgentFlow Pro - Documentation Reorganization")
    print("=" * 70)
    
    # Step 1: Get all markdown files
    print("\n🔍 Scanning for markdown files...")
    markdown_files = get_all_markdown_files()
    print(f"   📄 Found {len(markdown_files)} markdown files")
    
    # Step 2: Analyze each document
    print("\n🔬 Analyzing documents...")
    documents = []
    for file_path in markdown_files:
        doc = analyze_document(file_path)
        category, confidence = categorize_document(doc)
        doc.category = category
        doc.confidence = confidence
        doc.is_archived = category.startswith("ARCHIVED")
        documents.append(doc)
        
        confidence_emoji = "✅" if confidence > 0.7 else "⚠️" if confidence > 0.3 else "❓"
        print(f"   {confidence_emoji} {doc.filename} → {category} ({confidence:.1f})")
    
    # Step 3: Create directory structure
    create_directory_structure()
    
    # Step 4: Move documents
    print("\n📦 Moving documents to categories...")
    moved_count = 0
    category_docs = {}
    
    for doc in documents:
        if doc.category:
            category_docs.setdefault(doc.category, []).append(doc)
            if move_document(doc, doc.category):
                moved_count += 1
    
    print(f"\n   ✅ Moved {moved_count}/{len(documents)} documents")
    
    # Step 5: Generate index.md files
    print("\n📑 Generating index.md files...")
    for category, docs in category_docs.items():
        index_path = DOCS_DIR / category / "index.md"
        
        # Skip if index already exists
        if index_path.exists():
            print(f"   ⏭️  Skipping {category}/index.md (already exists)")
            continue
        
        content = generate_index_md(category, docs)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✓ Created: {category}/index.md")
    
    # Step 6: Create main docs/README.md
    print("\n🗺️  Creating main documentation hub...")
    main_readme = generate_main_readme(category_docs)
    main_readme_path = DOCS_DIR / "README.md"
    
    with open(main_readme_path, 'w', encoding='utf-8') as f:
        f.write(main_readme)
    print(f"   ✓ Created: docs/README.md")
    
    # Step 7: Summary
    print("\n" + "=" * 70)
    print("✅ Documentation Reorganization Complete!")
    print("=" * 70)
    
    print("\n📊 Summary:")
    print(f"   • Total documents processed: {len(documents)}")
    print(f"   • Documents moved: {moved_count}")
    print(f"   • Categories created: {len(category_docs)}")
    print(f"   • Index files generated: {len(category_docs)}")
    
    print("\n📁 New Structure:")
    for category in sorted(category_docs.keys()):
        count = len(category_docs[category])
        print(f"   • {category}/ ({count} docs)")
    
    print("\n🎯 Next Steps:")
    print("   1. Review moved documents: cd docs && ls -R")
    print("   2. Check git status: git status")
    print("   3. Commit changes: git commit -m 'docs: reorganize documentation structure'")
    print("   4. Update internal links if needed")
    print("\n" + "=" * 70)


def generate_main_readme(category_docs: Dict[str, List[DocumentInfo]]) -> str:
    """Generate main docs/README.md navigation hub."""
    readme = """# AgentFlow Pro - Documentation Hub

Welcome to the AgentFlow Pro documentation! This is your central navigation point for all project documentation.

---

## 🚀 Quick Start

**New to AgentFlow Pro?** Start here:

1. **[Getting Started](01-GETTING-STARTED)** - Installation and setup
2. **[Architecture Overview](02-ARCHITECTURE)** - Understand the system
3. **[User Guides](03-USER-GUIDES)** - Learn how to use the platform

**Developer?** Go to:

- **[Developer Guides](04-DEVELOPER-GUIDES)** - API reference and coding guides
- **[Architecture](02-ARCHITECTURE)** - System design
- **[Testing](06-TESTING)** - Testing strategies

---

## 📚 Documentation Categories

"""
    
    # Category descriptions with emoji
    categories = {
        "01-GETTING-STARTED": ("🚀", "Quick start, installation, and setup guides"),
        "02-ARCHITECTURE": ("🏗️", "System architecture, domain model, and design decisions"),
        "03-USER-GUIDES": ("👥", "End-user documentation for different roles"),
        "04-DEVELOPER-GUIDES": ("💻", "Developer documentation, API references, and coding guides"),
        "05-DEVOPS": ("🚢", "Deployment, monitoring, CI/CD, and infrastructure"),
        "06-TESTING": ("✅", "Testing strategies, load testing, and QA"),
        "07-INTEGRATIONS": ("🔌", "Third-party integrations: Stripe, OAuth, PMS"),
        "08-MARKETING": ("📢", "Marketing, launch, beta, and outreach"),
        "09-RESEARCH": ("🔬", "Research documents, roadmap, and analysis"),
        "10-SECURITY": ("🔒", "Security audits, compliance, and best practices"),
        "ARCHIVED": ("📦", "Historical documents and archived reports"),
    }
    
    for category, (emoji, description) in categories.items():
        if category in category_docs or category.startswith("0"):
            doc_count = len(category_docs.get(category, []))
            readme += f"### {emoji} [{category.replace('/', ' ')}]({category}/)\n\n"
            readme += f"{description}\n\n"
            if doc_count > 0:
                readme += f"*{doc_count} documents*\n\n"
            readme += "---\n\n"
    
    readme += """
## 🔍 Finding Information

**Looking for something specific?**

- **API Documentation**: [Developer Guides → API Reference](04-DEVELOPER-GUIDES)
- **Deployment Guide**: [DevOps → Deployment](05-DEVOPS)
- **User Manual**: [User Guides](03-USER-GUIDES)
- **System Design**: [Architecture](02-ARCHITECTURE)
- **Testing**: [Testing Guide](06-TESTING)

## 📋 Project Links

- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Project Tasks](../tasks.md)
- [Memory Bank](../memory-bank/current/)

## 🤝 Contributing

To contribute to documentation:

1. Find the relevant category
2. Add or update markdown files
3. Update the category's index.md if needed
4. Submit a pull request

## 📞 Support

Need help? 

- Check the [User Guides](03-USER-GUIDES)
- Review [FAQs](04-DEVELOPER-GUIDES)
- Contact support: [Support Channels](08-MARKETING/support-channels.md)

---

*Documentation last reorganized: March 2026*
*Total documents: """ + str(sum(len(docs) for docs in category_docs.values())) + """*
"""
    
    return readme


if __name__ == "__main__":
    main()
