from PIL import Image
import sys

input_path = 'public/cs-agent.png'
output_path = 'public/cs-agent-transparent.png'

try:
    img = Image.open(input_path)
except FileNotFoundError:
    print(f"Error: Could not find {input_path}")
    sys.exit(1)

img = img.convert("RGBA")
datas = img.getdata()

# The background color is approximately #0f172a (15, 23, 42)
# We will make pixels close to this color transparent
newData = []
bg_color = (15, 23, 42)
tolerance = 15  # Adjust tolerance as needed

for item in datas:
    # Check if the pixel is close to the background color
    r_diff = abs(item[0] - bg_color[0])
    g_diff = abs(item[1] - bg_color[1])
    b_diff = abs(item[2] - bg_color[2])
    
    if r_diff < tolerance and g_diff < tolerance and b_diff < tolerance:
        newData.append((255, 255, 255, 0)) # transparent
    else:
        # optional: do some alpha blending at the edges if needed, but simple cutout first
        newData.append(item)

img.putdata(newData)
img.save(output_path, "PNG")
print(f"Successfully saved transparent image to {output_path}")
