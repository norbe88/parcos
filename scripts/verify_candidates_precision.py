import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load full vehicle items from src/db/vehicles.ts
with open('src/db/vehicles.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Parse all vehicles into dicts
car_blocks = re.findall(r'{\s*id:\s*"([^"]+)",(.*?)\n\s*features:', text, re.DOTALL)
cars = {}
for cid, block in car_blocks:
    c = {'id': cid}
    for field in ['brand', 'model', 'year', 'mileageKm', 'priceEur', 'fuelType', 'transmission', 'color', 'powerHp']:
        m = re.search(rf'{field}:\s*"?([^",\n]+)"?', block)
        if m:
            c[field] = m.group(1).strip()
    cars[cid] = c

# Check specific candidate videos
candidates = [
    {
        "car_id": "peugeot-2008-2015-kh4hz",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7651664582863342870",
        "caption": "🚗 Peugeot 2008 | 12.2014 | 128.000 km | 5.690€| Rata de la 137€ Tu ai alege-o? 👇 #foryoupage❤️❤️ #tbi #peugeot2008 #masinish #clujnapoca",
        "views": "1.2K"
    },
    {
        "car_id": "bmw-seria-5-2015-kugya",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7643048514934590742",
        "caption": "BMW Seria 5 M-Pachet, 2.0 l-143 CP, an fabricație 2015, 202.000km #parcauto #dealerauto #autorulate #tik #tik_tok",
        "views": "2.5K"
    },
    {
        "car_id": "volkswagen-passat-cc-2014-khrud",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7655048215074442518",
        "caption": "Passat CC🚘 : mașina care încă întoarce priviri în 2026, acum disponibila în stocul Rxm Automobile. #flypシ #romanian #viral #foryoupage❤️❤️ #masinisecondhand",
        "views": "3.5K"
    },
    {
        "car_id": "ford-focus-2021-klwcq",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7662015049300593942",
        "caption": "Cine caută un Ford Focus 2021? Tocmai a ajuns în stoc! 🔥 #clujnapoca #masinisecondhand #flypシ #viral #ford",
        "views": "3.3K"
    },
    {
        "car_id": "audi-a4-2018-kzgfv",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7680108166230609174",
        "caption": "‼️ Nou în stoc la RXM Automobile ‼️🚘 Audi A4 Quattro #cash #foryoupage❤️❤️ #viral #masinisecondhand #clujnapoca",
        "views": "3.9K"
    },
    {
        "car_id": "bmw-seria-3-2018-kmc2f",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7663514285305400599",
        "caption": "Cauți un BMW F31? Tocmai a intrat în regim de consignație! Dacă vrei mai detalii , lasă un comentariu sau scrie-ne în privat. 🚗💙 #foryoupage❤️❤️ #masinisecondhand #flypシ #viral #bmwlife",
        "views": "1.0K"
    },
    {
        "car_id": "audi-a5-sportback-2013-kbgfp",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7646075665237757206",
        "caption": "Audi A5 disponibilă acum la RXM Automobile.🚘 Rate rapide și garanție inclusă.✔️ #audiquattro #foryoupage❤️❤️ #for #masini #tik_tok_love",
        "views": "1.2K"
    },
    {
        "car_id": "bmw-x3-2012-kuuod",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7671587574649064706",
        "caption": "🔥 BMW X3 – 174.000 km 🔥 Eleganță, confort și plăcerea de a conduce, într-un SUV care se impune din prima. 😎 📍 174.000 km ✨ Aspect premium",
        "views": "906"
    },
    {
        "car_id": "audi-q3-2012-knuug",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7668314821372398870",
        "caption": "Audi Q3 – SUV-ul care nu se demodează niciodată. 🔥 ✔️ Aspect premium ✔️ Confort la drum lung ✔️ Perfect pentru oraș și vacanțe Tu ai alege un Q3 sau ai merge pe alt SUV? 👇 📍RXM Automobile 📞 0748 892 937 | 0758 042 979",
        "views": "1.0K"
    },
    {
        "car_id": "mercedes-benz-c-2016-kebu3",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7663151268671835414",
        "caption": "⭐ Mercedes-Benz C-Class disponibil în regim de consignație! Eleganță, confort și fiabilitate într-un singur pachet. Dacă îți cauți următoarea mașină, merită văzută! 📩 Scrie-ne pentru detalii, istoric și finanțare.",
        "views": "1.1K"
    },
    {
        "car_id": "dacia-sandero-stepway-2015-kouvb",
        "url": "https://www.tiktok.com/@rxm.automobile/video/7668597768432405763",
        "caption": "‼️ Nou în stoc la RXM Automobile‼️ 🚘 Dacia Stepway #viral #masinisecondhand #foryoupage❤️❤️ #flypシ #clujnapoca",
        "views": "2.6K"
    }
]

print("=== VERIFICARE EXACTĂ ÎNTRE CATALOG ȘI CAPTIONS TIKTOK ===")
for cand in candidates:
    car = cars.get(cand['car_id'])
    if not car:
        print(f"NOT FOUND: {cand['car_id']}")
        continue
    print(f"\n🚗 CAR: {car.get('brand')} {car.get('model')} ({car.get('year')}) | {car.get('mileageKm')} km | {car.get('powerHp')} CP | {car.get('priceEur')} € | {car.get('color')}")
    print(f"   TIKTOK: {cand['caption']}")
    print(f"   URL: {cand['url']} | Views: {cand['views']}")
