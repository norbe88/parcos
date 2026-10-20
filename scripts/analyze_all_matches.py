import json
import re
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/all_531_tiktok_videos.json', 'r', encoding='utf-8') as f:
    videos = json.load(f)

# Load vehicles from src/db/vehicles.ts
with open('src/db/vehicles.ts', 'r', encoding='utf-8') as f:
    vlines = f.readlines()

cars = []
current_car = {}
for line in vlines:
    line = line.strip()
    if line.startswith('id:'):
        current_car = {'id': line.split(':')[1].strip().strip('",')}
    elif line.startswith('brand:'):
        current_car['brand'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('model:'):
        current_car['model'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('year:'):
        current_car['year'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('priceEur:'):
        current_car['price'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('color:'):
        current_car['color'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('olxId:'):
        current_car['olxId'] = line.split(':')[1].strip().strip('",')
        cars.append(current_car)

print(f"Loaded {len(videos)} videos and {len(cars)} vehicles.\n")

# Match by brand, model, and keywords in caption
matches_found = []
for v in videos:
    cap = v['caption'].lower()
    url = v['url']
    views = v['views']
    
    for c in cars:
        brand = c['brand'].lower()
        model = c['model'].lower()
        
        brand_match = brand in cap
        if brand == 'mercedes-benz':
            brand_match = brand_match or ('mercedes' in cap)
        
        # Exact token match
        model_tokens = [tok for tok in model.split() if len(tok) >= 2]
        model_match = any(tok in cap for tok in model_tokens)
        
        if brand_match and model_match:
            matches_found.append({
                'car_id': c['id'],
                'car': f"{c['brand']} {c['model']} ({c['year']}) - {c['color']} - {c['price']} EUR",
                'video_url': url,
                'views': views,
                'caption': v['caption'][:140]
            })

print(f"Total potential candidate matches based on caption text: {len(matches_found)}\n")
for m in matches_found:
    print(f"[CANDIDATE] {m['car_id']}: {m['car']}")
    print(f"   URL: {m['video_url']} | Views: {m['views']}")
    print(f"   Caption: {m['caption']}")
    print("--------------------------------------------------")
