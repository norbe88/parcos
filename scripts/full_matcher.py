import json

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

def get_keywords(car):
    b = car['brand'].lower()
    m = car['model'].lower()
    kw = []
    if b == 'bmw':
        if 'seria 3' in m: kw = ['seria 3', 'bmw 3', 'f30', 'e90', 'f31']
        elif 'seria 4' in m: kw = ['seria 4', 'bmw 4', 'f32', 'f36']
        elif 'seria 5' in m: kw = ['seria 5', 'bmw 5', 'f10', 'f11']
        elif 'x1' in m: kw = ['x1', 'bmwx1']
        elif 'x3' in m: kw = ['x3', 'bmwx3']
    elif b == 'audi':
        if 'a3' in m: kw = ['a3', 'audia3']
        elif 'a4' in m: kw = ['a4', 'audia4']
        elif 'a5' in m: kw = ['a5', 'audia5']
        elif 'a6' in m: kw = ['a6', 'audia6']
        elif 'q3' in m: kw = ['q3', 'audiq3']
        elif 'q5' in m: kw = ['q5', 'audiq5']
    elif b == 'mercedes-benz':
        kw = ['mercedes', 'c-klasse', 'clasa c', 'c220', 'c200', 'c180']
    elif b == 'volkswagen':
        if 'golf' in m: kw = ['golf', 'golf 7', 'golf vii', 'golf 6']
        elif 'passat' in m: kw = ['passat', 'cc', 'alltrack']
        elif 'tiguan' in m: kw = ['tiguan']
    elif b == 'renault':
        if 'captur' in m: kw = ['captur', 'capture']
        elif 'megane' in m: kw = ['megane']
    elif b == 'peugeot':
        if '208' in m: kw = ['208', 'peugeot 208']
        elif '2008' in m: kw = ['2008', 'peugeot 2008']
    elif b == 'dacia':
        kw = ['sandero', 'stepway']
    elif b == 'ford':
        kw = ['focus']
    elif b == 'opel':
        kw = ['insignia']
    elif b == 'skoda':
        kw = ['fabia']
    elif b == 'seat':
        kw = ['leon']
    elif b == 'mini':
        kw = ['countryman', 'mini']
    elif b == 'smart':
        kw = ['smart', 'fortwo']
    elif b == 'jeep':
        kw = ['cherokee', 'jeep']
    return kw

for c in cars:
    kw_list = get_keywords(c)
    brand_l = c['brand'].lower()
    if brand_l == 'mercedes-benz': brand_l = 'mercedes'
    elif brand_l == 'volkswagen': brand_l = 'vw'
    
    matches = []
    for v in videos:
        cap = v['caption'].lower()
        if any(k in cap for k in kw_list):
            matches.append({
                'url': v['url'],
                'views': v['views'],
                'caption': v['caption']
            })
    if matches:
        candidates_by_car[c['id']] = matches

with open('scripts/full_candidates.txt', 'w', encoding='utf-8') as out:
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

print(f"Done. Found candidates for {len(candidates_by_car)} cars.")
