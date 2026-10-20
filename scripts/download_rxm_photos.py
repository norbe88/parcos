import json
import os
import io
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

CARS_DIR = "public/cars"
os.makedirs(CARS_DIR, exist_ok=True)

with open(".scratch/raw_extracted_32_cars.json", "r", encoding="utf-8") as f:
    cars = json.load(f)

# Map existing folders
existing_folders = set(os.listdir(CARS_DIR))

# Existing mapping in vehicles.ts
mapping_existing = {
    "kCF6U": "OLXRXMA7412161342",
    "k8Cta": "OLXRXMA5812246586",
    "kyTQw": "OLXRXMA8445477868",
    "kThcp": "OLXRXMA7008772762",
    "kBGFP": "OLXRXMA5088976895",
    "kHruD": "OLXRXMA8805112743",
    "kNuug": "OLXRXMA3219887702",
    "jvsgr": "OLXRXMA4855312082",
    "kRcZI": "OLXRXMA1422034445",
    "kTvy7": "OLXRXMA7598831972",
    "kebU3": "OLXRXMA9090710648",
    "kVf2b": "OLXRXMA4075395162"
}

def process_single_image(args):
    url, dest_path = args
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 5000:
        return True
    
    try:
        # Request HD image
        hd_url = url.split(";s=")[0] + ";s=1280x960"
        req = urllib.request.Request(hd_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
        
        img = Image.open(io.BytesIO(data)).convert("RGB")
        # Resize to max 1280 width if bigger
        if img.width > 1280:
            ratio = 1280.0 / img.width
            img = img.resize((1280, int(img.height * ratio)), Image.Resampling.LANCZOS)
        
        img.save(dest_path, "WEBP", quality=85)
        return True
    except Exception as e:
        print(f"Failed {dest_path}: {e}")
        return False

tasks = []
car_folder_map = {}

for car in cars:
    olx_id = car.get("olxId")
    folder_name = mapping_existing.get(olx_id)
    if not folder_name:
        folder_name = f"OLXRXM_{olx_id}"
    
    car_folder_map[olx_id] = folder_name
    target_dir = os.path.join(CARS_DIR, folder_name)
    os.makedirs(target_dir, exist_ok=True)
    
    images = car.get("images", [])[:8]
    for idx, img_url in enumerate(images):
        dest_file = os.path.join(target_dir, f"image_{idx+1:02d}.webp")
        tasks.append((img_url, dest_file))

print(f"Total images to process/verify: {len(tasks)}")

with ThreadPoolExecutor(max_workers=6) as executor:
    results = list(executor.map(process_single_image, tasks))

success_count = sum(1 for r in results if r)
print(f"Processing complete! Successfully processed: {success_count}/{len(tasks)} images.")

# Save car folder map
with open(".scratch/car_folder_map.json", "w", encoding="utf-8") as f:
    json.dump(car_folder_map, f, indent=2)
