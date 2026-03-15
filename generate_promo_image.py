import requests
from urllib.parse import quote
import os
import time
import json

def generate_image_simple(prompt, output_file, width=1280, height=720):
    """
    Generate image using Pollinations.ai - simplest approach
    """
    encoded_prompt = quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
    
    print(f"Generating image...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=120)
        
        if response.status_code == 200:
            with open(output_file, "wb") as f:
                f.write(response.content)
            
            file_size = os.path.getsize(output_file)
            print(f"Success! Image saved to: {output_file}")
            print(f"File size: {file_size} bytes")
            
            # Return the shareable URL
            shareable_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true"
            return True, shareable_url
        else:
            print(f"Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(response.text[:500] if response.text else "No response text")
            return False, None
            
    except Exception as e:
        print(f"Exception: {e}")
        return False, None

# Generate promotional image for AgentFlow Pro
prompt = "Professional software dashboard interface, modern clean UI design, blue and white colors, analytics charts and graphs, calendar view, booking management system, sleek professional look, high quality mockup"

print("=" * 60)
print("AgentFlow Pro Promotional Image Generation")
print("=" * 60)
print(f"Prompt: {prompt}\n")

success, shareable_url = generate_image_simple(
    prompt=prompt,
    output_file="agentflow-pro-promo.png",
    width=1280,
    height=720
)

if success:
    print("\n" + "=" * 60)
    print("IMAGE GENERATION COMPLETE!")
    print("=" * 60)
    print(f"Output file: {os.path.abspath('agentflow-pro-promo.png')}")
    print(f"Shareable URL: {shareable_url}")
    print("\nYou can view the image by opening the output file or sharing the URL.")
else:
    print("\nImage generation failed.")
    print("The Pollinations.ai service may be experiencing high load.")
