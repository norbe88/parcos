import json

with open(r'C:\Users\Norbert\.gemini\antigravity-ide\brain\b7e67ffe-9592-4041-8807-5038af07fc8f\.system_generated\steps\860\output.txt', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('{')
end = text.rfind('}') + 1
data = json.loads(text[start:end])
rxm_videos = [v for v in data['videos'] if 'rxm.automobile' in v['href']]
print(f"Total videos harvested: {data['totalUniqueVideos']}")
print(f"Total RXM videos: {len(rxm_videos)}")

with open('scripts/all_rxm_tiktoks.json', 'w', encoding='utf-8') as f_out:
    json.dump(rxm_videos, f_out, indent=2, ensure_ascii=False)

print("Saved to scripts/all_rxm_tiktoks.json")
