import json
import os
import io
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

mapping = {
    "kebU3": "OLXRXMA9090710648",
    "k8Cta": "OLXRXMA5812246586",
    "kyTQw": "OLXRXMA8445477868",
    "kThcp": "OLXRXMA7008772762",
    "jvsgr": "OLXRXMA4855312082",
    "kBGFP": "OLXRXMA5088976895",
    "kNuug": "OLXRXMA3219887702",
    "kHruD": "OLXRXMA8805112743",
    "kRcZI": "OLXRXMA1422034445"
}

with open('.scratch/raw_extracted_32_cars.json', 'r', encoding='utf-8') as f:
    cars = json.load(f)

def download_and_save(args):
    url, dest_path = args
    try:
        hd_url = url.split(";s=")[0] + ";s=1280x960"
        req = urllib.request.Request(hd_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        
        img = Image.open(io.BytesIO(data)).convert("RGB")
        if img.width > 1280:
            ratio = 1280.0 / img.width
            img = img.resize((1280, int(img.height * ratio)), Image.Resampling.LANCZOS)
        
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        img.save(dest_path, "WEBP", quality=88)
        return True, dest_path
    except Exception as e:
        return False, f"{dest_path}: {e}"

tasks = []
for olx_id, folder_name in mapping.items():
    match = next((c for c in cars if olx_id in c.get('url', '')), None)
    if not match:
        print(f"Warning: No match for {olx_id}")
        continue
    
    images = match.get('images', [])[:8]
    for idx, img_url in enumerate(images):
        dest_filename = f"image_{idx+1:02d}.webp"
        dest_path = os.path.join("public", "cars", folder_name, dest_filename)
        tasks.append((img_url, dest_path))

print(f"Starting clean download for {len(tasks)} images across 9 vehicles...")
with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(download_and_save, tasks))

success_count = sum(1 for ok, _ in results if ok)
print(f"Completed: {success_count}/{len(tasks)} images downloaded successfully.")
for ok, msg in results:
    if not ok:
        print(f"Error: {msg}")
