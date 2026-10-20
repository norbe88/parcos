import json

with open(r'C:\Users\Norbert\.gemini\antigravity-ide\brain\b7e67ffe-9592-4041-8807-5038af07fc8f\.system_generated\steps\880\output.txt', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('[')
end = text.rfind(']') + 1
videos = json.loads(text[start:end])

print(f"Loaded {len(videos)} videos with full captions and views.")

with open('scripts/all_531_tiktok_videos.json', 'w', encoding='utf-8') as f_out:
    json.dump(videos, f_out, indent=2, ensure_ascii=False)

print("Saved to scripts/all_531_tiktok_videos.json")
