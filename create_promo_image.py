from PIL import Image, ImageDraw, ImageFont
import os

def create_promotional_image(output_file="agentflow-pro-promo.png", width=1920, height=1080):
    """
    Create a professional promotional image for AgentFlow Pro
    """
    # Create image with gradient background
    img = Image.new('RGB', (width, height), color='#1e3a5f')
    draw = ImageDraw.Draw(img)
    
    # Create gradient background (dark blue to lighter blue)
    for y in range(height):
        r = int(30 + (y / height) * 50)
        g = int(58 + (y / height) * 80)
        b = int(95 + (y / height) * 100)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Add decorative circles/shapes
    for i in range(20):
        x = (i * 100) % width
        y = (i * 70) % height
        radius = 30 + (i * 5) % 50
        alpha = 20 + (i * 10) % 30
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], 
                    fill=(255, 255, 255, alpha), outline=(100, 180, 255, 50))
    
    # Add dashboard-like rectangles (representing UI elements)
    # Main dashboard area
    draw.rounded_rectangle([100, 200, 900, 600], radius=20, fill='#ffffff15', outline='#4a90d9', width=2)
    draw.rounded_rectangle([1020, 200, 1820, 500], radius=20, fill='#ffffff15', outline='#4a90d9', width=2)
    draw.rounded_rectangle([1020, 520, 1820, 880], radius=20, fill='#ffffff15', outline='#4a90d9', width=2)
    
    # Add chart-like lines
    chart_points = [(200, 500), (300, 450), (400, 480), (500, 400), (600, 420), (700, 350), (800, 380)]
    draw.line(chart_points, fill='#4a90d9', width=3)
    for point in chart_points:
        draw.ellipse([point[0]-5, point[1]-5, point[0]+5, point[1]+5], fill='#64b5f6')
    
    # Add smaller UI elements
    draw.rounded_rectangle([150, 250, 350, 290], radius=10, fill='#ffffff20')
    draw.rounded_rectangle([400, 250, 600, 290], radius=10, fill='#ffffff20')
    draw.rounded_rectangle([650, 250, 850, 290], radius=10, fill='#ffffff20')
    
    # Add calendar grid
    for row in range(5):
        for col in range(7):
            x = 1070 + col * 105
            y = 250 + row * 48
            draw.rounded_rectangle([x, y, x + 95, y + 40], radius=5, fill='#ffffff10', outline='#4a90d940')
    
    # Try to use default font, fall back to basic if not available
    try:
        title_font = ImageFont.truetype("arial.ttf", 72)
        subtitle_font = ImageFont.truetype("arial.ttf", 36)
        feature_font = ImageFont.truetype("arial.ttf", 24)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        feature_font = ImageFont.load_default()
    
    # Add title
    title = "AgentFlow Pro"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, 80), title, fill='#ffffff', font=title_font)
    
    # Add subtitle
    subtitle = "Multi-Agent AI Platform for Business Automation"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, 160), subtitle, fill='#a0c4ff', font=subtitle_font)
    
    # Add feature labels
    features = [
        (200, 620, "Analytics Dashboard"),
        (500, 620, "Calendar & Booking"),
        (1200, 920, "Task Management"),
        (1500, 920, "Revenue Tracking")
    ]
    
    for x, y, text in features:
        draw.text((x, y), text, fill='#80c0ff', font=feature_font)
    
    # Add logo placeholder (circle with initials)
    draw.ellipse([1750, 50, 1870, 170], fill='#4a90d9', outline='#ffffff', width=3)
    draw.text((1780, 90), "AF", fill='#ffffff', font=title_font)
    
    # Save image
    img.save(output_file, 'PNG')
    
    file_size = os.path.getsize(output_file)
    print(f"Image created successfully!")
    print(f"Output file: {os.path.abspath(output_file)}")
    print(f"Dimensions: {width}x{height}")
    print(f"File size: {file_size} bytes")
    
    return output_file

# Create the promotional image
print("=" * 60)
print("AgentFlow Pro Promotional Image Creation")
print("=" * 60)
print("\nCreating professional promotional image...\n")

create_promotional_image()

print("\n" + "=" * 60)
print("DONE!")
print("=" * 60)
