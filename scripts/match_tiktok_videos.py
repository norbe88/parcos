import json
import re
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load harvested TikTok videos
with open(r'C:\Users\Norbert\.gemini\antigravity-ide\brain\b7e67ffe-9592-4041-8807-5038af07fc8f\.system_generated\steps\622\output.txt', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('{')
end = text.rfind('}') + 1
data = json.loads(text[start:end])
videos = data['videos']

print(f"Total TikTok videos loaded: {len(videos)}")
# Load vehicles from src/db/vehicles.ts
with open('src/db/vehicles.ts', 'r', encoding='utf-8') as f:
    vlines = f.readlines()

car = {}
cars = []
for line in vlines:
    line = line.strip()
    if line.startswith('id:'):
        car = {'id': line.split(':')[1].strip().strip('",')}
    elif line.startswith('brand:'):
        car['brand'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('model:'):
        car['model'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('year:'):
        car['year'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('priceEur:'):
        car['price'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('color:'):
        car['color'] = line.split(':')[1].strip().strip('",')
    elif line.startswith('olxId:'):
        car['olxId'] = line.split(':')[1].strip().strip('",')
        cars.append(car)

print(f"\n==========================================")
print(f"DATABASE: {len(cars)} mașini în stoc RXM")
print(f"==========================================")
for c in cars:
    print(f"- {c['id']}: {c.get('brand')} {c.get('model')} ({c.get('year')}) | {c.get('color')} | {c.get('price')} €")
