import pdfplumber
import json
from pathlib import Path
from datetime import datetime

# Configuration
PDF_PATH = r"f:\ffff\agentflow-pro\Odstranjevanje strogosti_ Arhitektura modularnih vmesnikov za turistične sisteme leta 2026.pdf"
OUTPUT_JSON = "pdf_extracted_content.json"
OUTPUT_TXT = "pdf_extracted_content.txt"

def extract_pdf_content(pdf_path: str) -> dict:
    """Extract text content and metadata from PDF file."""
    
    metadata = {
        "extracted_at": datetime.now().isoformat(),
        "source_file": Path(pdf_path).name,
        "tool": "pdfplumber",
        "tool_version": pdfplumber.__version__
    }
    
    with pdfplumber.open(pdf_path) as pdf:
        content = []
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            content.append({
                "page": i + 1,
                "text": text,
                "char_count": len(text) if text else 0,
                "word_count": len(text.split()) if text else 0
            })
        
        total_chars = sum(item["char_count"] for item in content)
        total_words = sum(item["word_count"] for item in content)
        
        return {
            "metadata": metadata,
            "statistics": {
                "total_pages": len(pdf.pages),
                "total_characters": total_chars,
                "total_words": total_words,
                "avg_words_per_page": round(total_words / len(pdf.pages), 1) if pdf.pages else 0
            },
            "content": content
        }

def print_summary(data: dict) -> None:
    """Print extraction summary to console."""
    stats = data["statistics"]
    meta = data["metadata"]
    
    print(f"\n{'='*80}")
    print(f"📄 PDF EXTRACTION SUMMARY")
    print(f"{'='*80}")
    print(f"Source: {meta['source_file']}")
    print(f"Extracted: {meta['extracted_at']}")
    print(f"{'='*80}")
    print(f"Total pages: {stats['total_pages']}")
    print(f"Total characters: {stats['total_characters']:,}")
    print(f"Total words: {stats['total_words']:,}")
    print(f"Avg words/page: {stats['avg_words_per_page']}")
    print(f"{'='*80}\n")

def print_content(data: dict) -> None:
    """Print full content page by page."""
    for item in data["content"]:
        print(f"\n{'='*80}")
        print(f"PAGE {item['page']} ({item['word_count']} words)")
        print(f"{'='*80}\n")
        print(item['text'] or "[No text extracted]")

def save_output(data: dict, json_path: str, txt_path: str) -> None:
    """Save extraction results to JSON and TXT files."""
    # Save JSON with full structure
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Save TXT with readable format
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"PDF Extraction Report\n")
        f.write(f"{'='*80}\n")
        f.write(f"Source: {data['metadata']['source_file']}\n")
        f.write(f"Extracted: {data['metadata']['extracted_at']}\n")
        f.write(f"Pages: {data['statistics']['total_pages']}\n")
        f.write(f"Words: {data['statistics']['total_words']:,}\n")
        f.write(f"{'='*80}\n\n")
        
        for item in data["content"]:
            f.write(f"\n{'='*80}\n")
            f.write(f"PAGE {item['page']} ({item['word_count']} words)\n")
            f.write(f"{'='*80}\n\n")
            f.write(item['text'] or "[No text extracted]")
            f.write("\n")
    
    print(f"✅ JSON saved to: {json_path}")
    print(f"✅ TXT saved to: {txt_path}")

def main():
    """Main extraction function."""
    try:
        # Validate input file
        if not Path(PDF_PATH).exists():
            print(f"❌ Error: PDF file not found at {PDF_PATH}")
            return 1
        
        # Extract content
        print("🔄 Extracting PDF content...")
        data = extract_pdf_content(PDF_PATH)
        
        # Print summary
        print_summary(data)
        
        # Print full content
        print_content(data)
        
        # Save output
        save_output(data, OUTPUT_JSON, OUTPUT_TXT)
        
        print(f"\n✅ Extraction complete!")
        return 0
        
    except Exception as e:
        print(f"❌ Error extracting PDF: {e}")
        return 1

if __name__ == "__main__":
    exit(main())
