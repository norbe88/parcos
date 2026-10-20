import json
import sys

with open('scripts/all_531_tiktok_videos.json', 'r', encoding='utf-8') as f:
    videos = json.load(f)

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

candidates_by_car = {}

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
        elif brand == 'volkswagen':
            brand_match = brand_match or ('vw' in cap) or ('volkswagen' in cap)
        
        # Models
        model_clean = model.replace('sportback', '').replace('stepway', '').replace('seria', '').strip()
        model_tokens = [tok for tok in model_clean.split() if len(tok) >= 2]
        model_match = all(tok in cap for tok in model_tokens) if model_tokens else False
        
        if brand_match and model_match:
            c_id = c['id']
            if c_id not in candidates_by_car:
                candidates_by_car[c_id] = []
            candidates_by_car[c_id].append({
                'url': url,
                'views': views,
                'caption': v['caption']
            })

with open('scripts/candidates_report.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total cars with potential candidates: {len(candidates_by_car)} / 32\n\n")
    for c_id, vids in candidates_by_car.items():
        car_obj = next(c for c in cars if c['id'] == c_id)
        out.write(f"==================================================\n")
        out.write(f"CAR: {car_obj['brand']} {car_obj['model']} ({car_obj['year']}) - {car_obj['color']} - {car_obj['price']} EUR (ID: {c_id})\n")
        out.write(f"Found {len(vids)} matching TikTok videos:\n")
        for v in vids:
            out.write(f"  • Views: {v['views']} | URL: {v['url']}\n")
            out.write(f"    Text: {v['caption']}\n")
        out.write("\n")

print("Wrote scripts/candidates_report.txt")
