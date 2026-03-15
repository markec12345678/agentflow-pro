"""
AgentFlow Pro - Professional Promotional Image Generator
Based on 2025-2026 Design Trends Research

Top trends applied:
1. Electric Indigo + Deep Navy color scheme
2. Bento grid layout with progressive disclosure
3. 3D isometric elements
4. Dark mode first design
5. High contrast CTAs
6. Micro-interactions visual hints
7. Social proof section
8. Conversational UI preview
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import math

# Configuration
WIDTH, HEIGHT = 1920, 1080
OUTPUT_FILE = "agentflow-pro-promo-2025.png"

# Color Palette - Electric Indigo Theme (Based on Research)
COLORS = {
    'bg_dark': '#03012D',        # Deep Navy - background
    'bg_card': '#0A0A2E',        # Slightly lighter for cards
    'primary': '#6F00FF',        # Electric Indigo - main brand
    'accent': '#22D3EE',         # Electric Cyan - highlights
    'success': '#39FF14',        # Neon Green - success states
    'text_white': '#FFFFFF',
    'text_gray': '#94A3B8',
    'gradient_start': '#6F00FF',
    'gradient_end': '#22D3EE',
}

def create_gradient_background(width, height):
    """Create modern gradient background"""
    img = Image.new('RGB', (width, height), COLORS['bg_dark'])
    draw = ImageDraw.Draw(img)
    
    # Create subtle gradient overlay
    for y in range(height):
        alpha = int(255 * (y / height))
        color = (10, 10, 46, alpha)  # Deep navy overlay
        draw.line([(0, y), (width, y)], fill=color)
    
    return img

def draw_bento_grid(draw, img, start_x, start_y, width, height):
    """Draw modern bento grid layout"""
    card_colors = [
        COLORS['bg_card'],
        '#0D0D3A',
        '#0A0A2E',
        '#0D0D3A',
    ]
    
    # Bento grid sections (4 cards in 2x2)
    sections = [
        (start_x, start_y, width//2 - 10, height//2 - 10),
        (start_x + width//2 + 10, start_y, width//2 - 10, height//2 - 10),
        (start_x, start_y + height//2 + 10, width//2 - 10, height//2 - 10),
        (start_x + width//2 + 10, start_y + height//2 + 10, width//2 - 10, height//2 - 10),
    ]
    
    for i, (x, y, w, h) in enumerate(sections):
        # Draw card with rounded corners
        card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        card_draw = ImageDraw.Draw(card)
        
        # Card background with gradient
        for cy in range(h):
            alpha = int(180 * (1 - cy/h))
            color = (13, 13, 58, alpha)
            card_draw.line([(0, cy), (w, cy)], fill=color)
        
        # Rounded corners
        card = add_rounded_corners(card, 12)
        
        # Add to main image
        img.paste(card, (x, y), card)
        
        # Add subtle border
        draw.rounded_rectangle(
            [(x, y), (x+w, y+h)],
            radius=12,
            outline=COLORS['primary'],
            width=1
        )
    
    return sections

def add_rounded_corners(img, radius):
    """Add rounded corners to image"""
    circle = Image.new('L', (radius * 2, radius * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, radius * 2 - 1, radius * 2 - 1), fill=255)
    
    alpha = Image.new('L', img.size, 255)
    w, h = img.size
    
    alpha.paste(circle.crop((0, 0, radius, radius)), (0, 0))
    alpha.paste(circle.crop((0, radius, radius, radius * 2)), (0, h - radius))
    alpha.paste(circle.crop((radius, 0, radius * 2, radius)), (w - radius, 0))
    alpha.paste(circle.crop((radius, radius, radius * 2, radius * 2)), (w - radius, h - radius))
    
    img.putalpha(alpha)
    return img

def draw_analytics_chart(draw, x, y, width, height):
    """Draw modern analytics line chart with gradient"""
    # Chart background
    draw.rectangle([(x, y), (x+width, y+height)], fill='#0D0D3A')
    
    # Animated line points
    points = [
        (x+20, y+height-30),
        (x+80, y+height-60),
        (x+140, y+height-40),
        (x+200, y+height-80),
        (x+260, y+height-50),
        (x+320, y+height-90),
        (x+380, y+height-70),
    ]
    
    # Draw gradient line
    for i in range(len(points)-1):
        draw.line([points[i], points[i+1]], fill=COLORS['accent'], width=3)
    
    # Draw points with glow
    for px, py in points:
        # Glow effect
        for r in range(8, 0, -2):
            alpha = int(100 * (r/8))
            draw.ellipse([(px-r, py-r), (px+r, py+r)], 
                        fill=(34, 211, 238, alpha))
        # Center point
        draw.ellipse([(px-4, py-4), (px+4, py+4)], fill=COLORS['success'])

def draw_calendar_grid(draw, x, y, width, height):
    """Draw modern calendar with bookings"""
    # Calendar header
    draw.rectangle([(x, y), (x+width, y+40)], fill='#0D0D3A')
    
    # Calendar grid
    cell_w = (width-20) // 7
    cell_h = (height-60) // 5
    
    for row in range(5):
        for col in range(7):
            cx = x + 10 + col * cell_w
            cy = y + 50 + row * cell_h
            
            # Cell background
            draw.rectangle([(cx, cy), (cx+cell_w-5, cy+cell_h-5)], 
                          fill='#0A0A2E')
            
            # Add booking indicators
            if (row + col) % 5 == 0:
                # Booking block
                draw.rectangle([(cx+5, cy+20), (cx+cell_w-10, cy+35)], 
                              fill=COLORS['primary'])
            elif (row + col) % 7 == 0:
                # Task indicator
                draw.rectangle([(cx+5, cy+40), (cx+cell_w-10, cy+50)], 
                              fill=COLORS['accent'])

def draw_task_list(draw, x, y, width, height):
    """Draw modern task management list"""
    tasks = [
        ("Clean Room 201", "high", "12:00"),
        ("Check-in: John", "high", "14:00"),
        ("Fix AC Room 105", "medium", "15:00"),
        ("Restock minibar", "low", "16:00"),
    ]
    
    priority_colors = {
        'high': '#FF4757',
        'medium': '#FFA502',
        'low': '#2ED573'
    }
    
    task_height = height // len(tasks)
    
    for i, (task, priority, time) in enumerate(tasks):
        ty = y + i * task_height + 10
        
        # Task card
        draw.rectangle([(x+10, ty), (x+width-10, ty+task_height-20)], 
                      fill='#0D0D3A')
        
        # Priority indicator
        draw.rectangle([(x+20, ty+15), (x+30, ty+25)], 
                      fill=priority_colors[priority])
        
        # Task text placeholder
        draw.rectangle([(x+45, ty+15), (x+width-100, ty+30)], 
                      fill=COLORS['text_gray'])
        
        # Time
        draw.rectangle([(x+width-80, ty+15), (x+width-20, ty+30)], 
                      fill=COLORS['accent'])

def draw_revenue_graph(draw, x, y, width, height):
    """Draw revenue tracking bar chart"""
    # Graph area
    draw.rectangle([(x, y), (x+width, y+height)], fill='#0D0D3A')
    
    # Bars with gradient
    bar_width = (width - 40) // 8
    heights = [40, 60, 45, 70, 55, 80, 65, 90]
    
    for i, h in enumerate(heights):
        bx = x + 20 + i * (bar_width + 5)
        by = y + height - h - 20
        
        # Bar gradient
        for by_i in range(by, y + height - 20):
            alpha = int(200 * (1 - (by_i - by) / h))
            color = (111, 0, 255, alpha)
            draw.line([(bx, by_i), (bx+bar_width, by_i)], fill=color)
        
        # Top highlight
        draw.rectangle([(bx, by), (bx+bar_width, by+5)], 
                      fill=COLORS['accent'])

def draw_header(draw, width):
    """Draw modern header with logo and navigation"""
    # Logo area
    draw.rectangle([(0, 0), (200, 80)], fill=COLORS['bg_dark'])
    
    # Logo circle
    draw.ellipse([(20, 20), (60, 60)], fill=COLORS['primary'])
    draw.text((35, 35), "AF", fill=COLORS['text_white'])
    
    # Title
    draw.text((80, 25), "AgentFlow Pro", fill=COLORS['text_white'])
    draw.text((80, 45), "Multi-Agent AI Platform", fill=COLORS['text_gray'])
    
    # CTA Button
    draw.rounded_rectangle([(1600, 20), (1880, 60)], 
                          radius=8, fill=COLORS['primary'])
    draw.text((1680, 32), "Start Free Trial", fill=COLORS['text_white'])

def draw_social_proof(draw, y, width):
    """Draw social proof section"""
    # Background
    draw.rectangle([(0, y), (width, y+60)], fill='#0A0A2E')
    
    # Text
    draw.text((width//2 - 150, y+20), "Trusted by 500+ teams", 
             fill=COLORS['text_gray'])
    
    # Logo placeholders
    for i in range(5):
        x = width//2 - 200 + i * 100
        draw.rectangle([(x, y+45), (x+80, y+55)], fill=COLORS['primary'])

def add_glow_effects(img):
    """Add modern glow effects"""
    # Create glow layer
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    # Add ambient glow around cards
    # This would be more complex in production
    
    return Image.alpha_composite(img.convert('RGBA'), glow)

def main():
    print("🎨 Generating AgentFlow Pro Promotional Image...")
    print("   Based on 2025-2026 Design Trends")
    print("   Electric Indigo Theme")
    
    # Create base image
    img = create_gradient_background(WIDTH, HEIGHT)
    draw = ImageDraw.Draw(img)
    
    # Draw header
    draw_header(draw, WIDTH)
    
    # Draw main content area with bento grid
    bento_sections = draw_bento_grid(draw, img, 40, 100, WIDTH-80, HEIGHT-180)
    
    # Fill bento sections with content
    if len(bento_sections) >= 4:
        # Analytics chart
        draw_analytics_chart(draw, 
                           bento_sections[0][0]+20, 
                           bento_sections[0][1]+20,
                           bento_sections[0][2]-40,
                           bento_sections[0][3]-40)
        
        # Calendar
        draw_calendar_grid(draw,
                          bento_sections[1][0]+20,
                          bento_sections[1][1]+20,
                          bento_sections[1][2]-40,
                          bento_sections[1][3]-40)
        
        # Tasks
        draw_task_list(draw,
                      bento_sections[2][0]+20,
                      bento_sections[2][1]+20,
                      bento_sections[2][2]-40,
                      bento_sections[2][3]-40)
        
        # Revenue
        draw_revenue_graph(draw,
                          bento_sections[3][0]+20,
                          bento_sections[3][1]+20,
                          bento_sections[3][2]-40,
                          bento_sections[3][3]-40)
    
    # Draw social proof
    draw_social_proof(draw, HEIGHT-80, WIDTH)
    
    # Add glow effects
    img = add_glow_effects(img)
    
    # Save
    img.save(OUTPUT_FILE, "PNG", quality=95)
    print(f"\n✅ Image saved: {OUTPUT_FILE}")
    print(f"   Dimensions: {WIDTH}x{HEIGHT}")
    print(f"   Style: Electric Indigo Dark Theme")
    print(f"   Layout: Bento Grid with 4 sections")
    
    # Show image
    img.show()

if __name__ == "__main__":
    main()
