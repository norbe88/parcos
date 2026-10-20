import re

additional_matches = {
    "peugeot-2008-2015-kh4hz": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7651664582863342870",
        "views": "1.2K"
    },
    "bmw-seria-5-2015-kugya": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7643048514934590742",
        "views": "2.5K"
    },
    "volkswagen-passat-cc-2014-khrud": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7655048215074442518",
        "views": "3.5K"
    },
    "ford-focus-2021-klwcq": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7662015049300593942",
        "views": "3.3K"
    },
    "audi-a4-2018-kzgfv": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7680108166230609174",
        "views": "3.9K"
    },
    "audi-a5-sportback-2013-kbgfp": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7646075665237757206",
        "views": "1.2K"
    }
}

with open("src/db/vehicles.ts", "r", encoding="utf-8") as f:
    content = f.read()

for car_id, data in additional_matches.items():
    pattern = rf'(id:\s*"{car_id}",.*?)(\n\s*olxUrl:)'
    def repl(m):
        prefix = m.group(1)
        suffix = m.group(2)
        tt_block = f'\n    tiktokUrl: "{data["url"]}",\n    tiktokViews: "{data["views"]}",'
        return prefix + tt_block + suffix
    
    new_content, count = re.subn(pattern, repl, content, count=1, flags=re.DOTALL)
    if count == 1:
        print(f"Successfully injected TikTok link for {car_id}")
        content = new_content
    else:
        print(f"FAILED to inject for {car_id}")

with open("src/db/vehicles.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Finished updating vehicles.ts with additional 6 verified videos!")
