import re

matches = {
    "audi-a6-2011-l0lya": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7694638038659665154",
        "views": "574"
    },
    "audi-a6-2017-kzfce": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7693958276840525078",
        "views": "1.5K"
    },
    "renault-captur-2017-ku9gi": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7694612943895301398",
        "views": "408"
    },
    "volvo-s60-2017-kzknu": {
        "url": "https://www.tiktok.com/@rxm.automobile/video/7693960107616406807",
        "views": "718"
    }
}

with open("src/db/vehicles.ts", "r", encoding="utf-8") as f:
    content = f.read()

for car_id, data in matches.items():
    # Find the car object by id
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

print("Finished updating src/db/vehicles.ts")
