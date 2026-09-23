"""Build a portable, public-data discovery snapshot from the original course project.

Run: python3 scripts/build_data.py --source /path/to/MUSA-5500-Final-Project
No network access or third-party Python packages required.
"""
import argparse
import csv
import hashlib
import json
import math
import re
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def distance(a, b):
    lat1, lat2 = math.radians(a[1]), math.radians(b[1])
    dlat, dlon = lat2-lat1, math.radians(b[0]-a[0])
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 6371008.8*2*math.asin(min(1, math.sqrt(h)))

def norm(s):
    return re.sub(r'[^a-z0-9]', '', (s or '').casefold())

def street_key(s):
    replacements = {'street':'st','avenue':'ave','road':'rd','boulevard':'blvd','north':'n','south':'s','east':'e','west':'w'}
    return norm(' '.join(replacements.get(w, w) for w in re.findall(r'\w+', s.lower())))

def ring_contains(pt, ring):
    x, y = pt
    inside = False
    for a, b in zip(ring, ring[1:]+ring[:1]):
        if (a[1]>y) != (b[1]>y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:
            inside = not inside
    return inside

def contains(pt, geometry):
    polys = [geometry['coordinates']] if geometry['type']=='Polygon' else geometry['coordinates']
    return any(ring_contains(pt, poly[0]) and not any(ring_contains(pt,h) for h in poly[1:]) for poly in polys)

def category(s):
    s = (s or '').lower()
    if 'super' in s or 'large grocery' in s: return 'Supermarket'
    if any(x in s for x in ['convenience','combination']): return 'Convenience'
    if any(x in s for x in ['fruit','vegetable','farm','produce']): return 'Produce & markets'
    if any(x in s for x in ['specialty','bakery','meat','seafood']): return 'Specialty food'
    return 'Grocery'

def load(source, path):
    return json.loads((source/path).read_text())

def build(source):
    city = load(source, 'data/City_Limits.geojson')['features'][0]['geometry']
    pois, rejected = [], 0
    with (source/'data/Historical SNAP Retailer Locator Data 2004-2024.csv').open(encoding='utf-8-sig', errors='replace') as f:
        for row in csv.DictReader(f):
            if row['County'].upper() != 'PHILADELPHIA' or row['State'] != 'PA' or row['End Date'].strip(): continue
            try: point = [float(row['Longitude']), float(row['Latitude'])]
            except (ValueError, TypeError): rejected += 1; continue
            if not contains(point, city): rejected += 1; continue
            address = ' '.join(x.strip() for x in [row['Street Number'], row['Street Name'], row['Additional Address']] if x.strip())
            pois.append({'id':'snap-'+row['Record ID'], 'name':row['Store Name'].strip().title(), 'point':point,
                'address':address.title(), 'zip':row['Zip Code'][:5], 'category':category(row['Store Type']),
                'snap':'historical', 'sources':['USDA SNAP'], 'sourceIds':[row['Record ID']], 'vintage':'2024 historical file',
                'phone':None,'website':None,'hours':None,'wheelchair':None,'checkDate':None,
                'matchStatus':None, 'geometryMethod':'source coordinate'})
    snapshot = load(source,'cache/8976cb2f48f2b54374b7812cd6bcf176107b84b0.json')
    nodes = {e['id']:[e['lon'],e['lat']] for e in snapshot['elements'] if e['type']=='node'}
    matches = []
    for e in snapshot['elements']:
        t = e.get('tags', {})
        if t.get('shop') not in ['food','grocery','supermarket'] or not t.get('name'): continue
        if e['type']=='node': point, method = nodes[e['id']], 'source coordinate'
        elif e['type']=='way':
            coords = [nodes[n] for n in dict.fromkeys(e.get('nodes',[])) if n in nodes]
            if not coords: continue
            point = [sum(c[i] for c in coords)/len(coords) for i in range(2)]
            method = 'building vertex-average representative point; not an entrance'
        else: continue
        if not contains(point, city): continue
        address = ' '.join([t.get('addr:housenumber',''),t.get('addr:street','')]).strip()
        candidates = [p for p in pois if p['sources']==['USDA SNAP'] and address and street_key(p['address'])==street_key(address) and norm(p['name'])==norm(t['name']) and distance(p['point'],point)<=120]
        if len(candidates)==1:
            p=candidates[0];p['sources'].append('OpenStreetMap');p['sourceIds'].append(f"{e['type']}/{e['id']}")
            p['matchStatus']='Provisional: exact normalized name + address, within 120 m'
            matches.append({'id':p['id'],'osmId':p['sourceIds'][-1],'distanceMeters':round(distance(p['point'],point),1),'status':'unreviewed'})
        else:
            p={'id':f"osm-{e['type']}-{e['id']}",'name':t['name'],'point':point,'address':address,'zip':t.get('addr:postcode',''),
                'category':category(t.get('shop')),'snap':'unknown','sources':['OpenStreetMap'],'sourceIds':[f"{e['type']}/{e['id']}"],
                'matchStatus':None,'geometryMethod':method};pois.append(p)
        p.update({'phone':t.get('phone') or t.get('contact:phone'),'website':t.get('website') or t.get('contact:website'),
            'hours':t.get('opening_hours'),'wheelchair':t.get('wheelchair'),'checkDate':t.get('check_date'),
            'vintage':'2024 SNAP / Nov 2025 OSM' if len(p['sources'])>1 else 'Nov 2025 OSM'})
    tracts=load(source,'outputs/tract_summary.geojson')['features']
    areas=[]
    for f in tracts:
        p=f['properties'];g=f['geometry'];rings=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
        flat=[q for poly in rings for q in poly[0]]
        areas.append({'id':str(p['tract']).zfill(6),'geometry':g,'bounds':[min(q[0] for q in flat),min(q[1] for q in flat),max(q[0] for q in flat),max(q[1] for q in flat)]})
    for p in pois:
        p['area']=next((a['id'] for a in areas if a['bounds'][0]<=p['point'][0]<=a['bounds'][2] and a['bounds'][1]<=p['point'][1]<=a['bounds'][3] and contains(p['point'],a['geometry'])),None)
        p['completeness']=sum(bool(p.get(k)) for k in ['name','address','category','phone','website','hours'])
    roads=load(source,'cache/ab4772f896dc98eb098f3e8f495a48f695d9f5d9.json')
    raw_nodes={e['id']:[round(e['lon'],6),round(e['lat'],6)] for e in roads['elements'] if e['type']=='node'}
    compact, indices, ways=[], {}, []
    # The cache is a drive-network extract. Never interpret its missing sidewalks as walk access.
    for e in roads['elements']:
        t=e.get('tags',{})
        if e['type']!='way' or not t.get('highway'): continue
        access=t.get('motorcar',t.get('motor_vehicle',t.get('vehicle',t.get('access','yes'))))
        if access in ['no','private']: continue
        coords=[raw_nodes[n] for n in e['nodes'] if n in raw_nodes]
        if not any(-75.31<c[0]<-74.93 and 39.84<c[1]<40.16 for c in coords): continue
        seq=[]
        for n in e['nodes']:
            if n not in raw_nodes: continue
            if n not in indices: indices[n]=len(compact);compact.append(raw_nodes[n])
            seq.append(indices[n])
        direction=t.get('oneway')
        oneway=-1 if direction=='-1' else 1 if direction in ['yes','1','true'] or (direction not in ['no','0','false'] and (t.get('junction')=='roundabout' or t.get('highway')=='motorway')) else 0
        if len(seq)>1: ways.append([seq,oneway,t['highway'],t.get('name','')])
    out=ROOT/'data';out.mkdir(parents=True,exist_ok=True)
    manifest={'buildVersion':1,'builtDate':date.today().isoformat(),'poiCount':len(pois),'snapCount':sum(p['snap']=='historical' for p in pois),
        'osmCount':sum('OpenStreetMap' in p['sources'] for p in pois),'provisionalMatches':len(matches),'rejectedSnapCoordinates':rejected,
        'areaCount':len(areas),'roadNodes':len(compact),'roadWays':len(ways),'categories':dict(Counter(p['category'] for p in pois)),
        'sourceProject':'Philadelphia Food Desert Analysis — Tim Wen & Lingxuan Gao',
        'snapVintage':'Historical SNAP Retailer Locator Data 2004–2024; blank End Date, not reverified',
        'osmVintage':snapshot['osm3s']['timestamp_osm_base'],'roadVintage':roads['osm3s']['timestamp_osm_base'],
        'routing':'Directed driving-network shortest distance; illustrative 25 km/h + 5 min parking; connectors max 150 m each. No traffic, turn restrictions, or entrance verification.',
        'sources':[{'name':'USDA SNAP retailer locator','url':'https://www.fns.usda.gov/snap/retailer-locator'},
        {'name':'OpenStreetMap contributors — ODbL','url':'https://www.openstreetmap.org/copyright'}],
        'files':{str(f.relative_to(source)):hashlib.sha256(f.read_bytes()).hexdigest() for f in [source/'data/Historical SNAP Retailer Locator Data 2004-2024.csv',source/'cache/8976cb2f48f2b54374b7812cd6bcf176107b84b0.json',source/'cache/ab4772f896dc98eb098f3e8f495a48f695d9f5d9.json',source/'outputs/tract_summary.geojson',source/'data/City_Limits.geojson']}}
    for filename,obj in [('places.json',pois),('areas.json',areas),('roads.json',{'nodes':compact,'ways':ways}),('city.json',city),('manifest.json',manifest),('match-review.json',matches)]:
        (out/filename).write_text(json.dumps(obj,separators=(',',':'),ensure_ascii=False,allow_nan=False))
    print(json.dumps(manifest,indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);args=parser.parse_args();build(args.source)
