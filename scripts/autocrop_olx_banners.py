"""
scripts/autocrop_olx_banners.py
Script autonom pentru detectarea și decuparea automată a bannerelor de dealer
din fotografiile importate de pe OLX (anunțuri RXM Automobile).
"""

import os
import sys
from PIL import Image

# Asigură ieșire UTF-8 pe Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def find_banner_boundary(im):
    w, h = im.size
    # Scanăm de la 55% din înălțime până la 88%
    # Bannerul începe cu o linie albă orizontală curată (fond alb al casetei)
    for y in range(int(h * 0.55), int(h * 0.88)):
        row = [im.getpixel((x, y)) for x in range(0, w, 4)]
        white_pct = sum(1 for r, g, b in row if r >= 238 and g >= 238 and b >= 238) / len(row)
        if white_pct > 0.82:
            # Confirmăm pe următoarele 3 rânduri că este într-adevăr bannerul alb
            next_rows = []
            for dy in range(1, 4):
                if y + dy < h:
                    next_row = [im.getpixel((x, y + dy)) for x in range(0, w, 4)]
                    next_rows.append(sum(1 for r, g, b in next_row if r >= 238 and g >= 238 and b >= 238) / len(next_row))
            if len(next_rows) == 3 and all(nr > 0.82 for nr in next_rows):
                return y
    return None

def has_rxm_banner(im):
    w, h = im.size
    # Bannerul RXM conține o bandă portocalie la baza imaginii (ultimii 5% din înălțime)
    bot_y = int(h * 0.96)
    samples = [im.getpixel((x, bot_y)) for x in range(10, w - 10, max(1, int(w / 30)))]
    # Culoare portocalie: R: 220-255, G: 110-180, B: 50-110
    orange_hits = sum(1 for r, g, b in samples if r >= 220 and 110 <= g <= 180 and b <= 110)
    
    # De asemenea, zona de mijloc a bannerului (y ~ 80%) este albă
    mid_y = int(h * 0.80)
    mid_samples = [im.getpixel((x, mid_y)) for x in range(10, w - 10, max(1, int(w / 30)))]
    white_hits = sum(1 for r, g, b in mid_samples if r >= 235 and g >= 235 and b >= 235)
    
    return (orange_hits / len(samples) > 0.35) and (white_hits / len(mid_samples) > 0.50)

def process_cars_directory(cars_dir):
    if not os.path.isdir(cars_dir):
        print(f"Eroare: Directorul {cars_dir} nu există!")
        return 0

    cropped_count = 0
    scanned_count = 0

    print("=" * 65)
    print("🚀 SCANARE & DECUPARE AUTOMATĂ BANNER OLX (RXM AUTOMOBILE)")
    print("=" * 65)

    for folder in sorted(os.listdir(cars_dir)):
        fpath = os.path.join(cars_dir, folder)
        if not os.path.isdir(fpath):
            continue

        for fname in sorted(os.listdir(fpath)):
            if not fname.endswith(('.webp', '.jpg', '.jpeg', '.png')):
                continue

            scanned_count += 1
            img_path = os.path.join(fpath, fname)

            try:
                im = Image.open(img_path).convert('RGB')
                if has_rxm_banner(im):
                    boundary = find_banner_boundary(im)
                    if boundary and boundary > 200:
                        w, h = im.size
                        # Decupăm doar zona mașinii: de sus (0) până la începutul bannerului
                        cropped = im.crop((0, 0, w, boundary))
                        # Salvăm înlocuind imaginea originală cu calitate ridicată (95)
                        cropped.save(img_path, 'WEBP', quality=95)
                        cropped_count += 1
                        print(f"✂️  Decupat: {folder}/{fname} | {w}x{h} -> {w}x{boundary} (eliminat {h - boundary}px banner)")
            except Exception as e:
                print(f"⚠️ Eroare la procesarea {img_path}: {e}")

    print("=" * 65)
    print(f"✅ FINALIZAT: Scanat {scanned_count} fotografii, decupat cu succes {cropped_count} bannere!")
    print("=" * 65)
    return cropped_count

if __name__ == '__main__':
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    target_dir = os.path.join(project_root, 'public', 'cars')
    process_cars_directory(target_dir)
