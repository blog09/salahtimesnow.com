"""One-off: named mosques near each city from OpenStreetMap (ODbL), written to src/data/mosques.json.
One small Overpass query per city, paced, with saved progress so a rerun only fetches what is missing.
Run by hand when refreshing; the daily build does not call it."""
import json, math, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src/data/mosques.json"
cities = json.loads((ROOT / "scripts/cities.json").read_text(encoding="utf-8"))
RADIUS = 20000
PAUSE = 4
SERVERS = ["https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"]
out = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}


def fetch(c):
    query = f'[out:json][timeout:50];nwr["amenity"="place_of_worship"]["religion"="muslim"]["name"](around:{RADIUS},{c["lat"]},{c["lon"]});out center tags;'
    for attempt, url in enumerate(SERVERS * 2):
        try:
            req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": query}).encode(), headers={"User-Agent": "salahtimesnow-build/1.0 (hello@salahtimesnow.com)"})
            with urllib.request.urlopen(req, timeout=70) as r:
                return json.loads(r.read().decode("utf-8"))["elements"]
        except Exception as e:
            print("  failed", url.split("/")[2], repr(e)[:70], flush=True)
            time.sleep(10 + attempt * 10)
    return None


def km(a, b, c, d):
    p = math.pi / 180
    h = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


missing = 0
for c in cities:
    if c["slug"] in out:
        continue
    els = fetch(c)
    if els is None:
        missing += 1
        print(c["slug"], "NOT FETCHED", flush=True)
        continue
    near, seen = [], set()
    for e in els:
        t = e.get("tags", {})
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        name = " ".join((t.get("name:en") or t.get("name") or "").split())
        if lat and re.search(r"[A-Za-z]", name):
            web = t.get("website") or t.get("contact:website") or ""
            near.append((km(c["lat"], c["lon"], lat, lon), name, t.get("addr:suburb") or t.get("addr:city") or "", web if web.startswith("http") else ""))
    rows = []
    for d, name, area, web in sorted(near, key=lambda x: x[0]):
        k = re.sub(r"[^a-z]", "", name.lower())
        if k not in seen:
            seen.add(k)
            rows.append(dict(name=name, km=round(d, 1), area=area, web=web))
        if len(rows) == 8:
            break
    out[c["slug"]] = rows
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
    print(c["slug"], len(rows), flush=True)
    time.sleep(PAUSE)
print("done", len(out), "cities, missing", missing, flush=True)
sys.exit(1 if missing else 0)
