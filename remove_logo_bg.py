import sys
from PIL import Image

def flood_fill_transparent(image_path, out_path, tolerance=15):
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    bg_color = pixels[0, 0]
    
    def color_diff(c1, c2):
        return sum(abs(c1[i] - c2[i]) for i in range(3))
        
    stack = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set(stack)
    
    while stack:
        x, y = stack.pop()
        
        if color_diff(pixels[x, y], bg_color) <= tolerance:
            pixels[x, y] = (0, 0, 0, 0)
            
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    stack.append((nx, ny))

    img.save(out_path, "PNG")
    print(f"Saved {out_path}")

flood_fill_transparent(r"d:\BimbelSync\public\logo.png", r"d:\BimbelSync\public\logo.png", tolerance=30)
