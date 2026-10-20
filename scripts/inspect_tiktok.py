import urllib.request
import json
import re

url = 'https://www.tiktok.com/@rxm.automobile'
req = urllib.request.Request(
    url,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
    }
)

with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

match = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    scope = data.get('__DEFAULT_SCOPE__', {})
    print("Scope keys:", list(scope.keys()))
    
    # Check webapp.user-detail
    user_detail = scope.get('webapp.user-detail', {})
    print("User detail keys:", list(user_detail.keys()))
    user_info = user_detail.get('userInfo', {})
    user = user_info.get('user', {})
    stats = user_info.get('stats', {})
    print(f"User: {user.get('uniqueId')}, Name: {user.get('nickname')}, Video count: {stats.get('videoCount')}")
    
    itemList = user_detail.get('itemList', [])
    print(f"ItemList length: {len(itemList)}")
    
    # Recursively look for any video objects or item list in scope
    for k, v in scope.items():
        if isinstance(v, dict):
            for sub_k in v:
                if 'item' in sub_k.lower() or 'video' in sub_k.lower():
                    print(f"Interesting key in {k}: {sub_k}")
