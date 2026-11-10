"""Download Unsplash photographs and create locally served responsive WebP assets."""
from pathlib import Path
from urllib.request import urlopen
from io import BytesIO
from PIL import Image
sources = {
 'workspace': 'photo-1497366754035-f200968a6e72',
 'experience': 'photo-1522071820081-009f0129c71c',
 'technology': 'photo-1460925895917-afdab827c52f',
 'home': 'photo-1600596542815-ffad4c1539a9',
 'strategy': 'photo-1600210492486-724fe5c67fb0',
}
output=Path('public/images'); output.mkdir(exist_ok=True,parents=True)
for name,photo in sources.items():
 width=2400 if name=='workspace' else 1440
 url=f'https://images.unsplash.com/{photo}?auto=format&fit=crop&w={width}&q=90'
 with urlopen(url,timeout=60) as response: image=Image.open(BytesIO(response.read())).convert('RGB')
 for size in [960,width]:
  resized=image.copy(); resized.thumbnail((size,9999)); resized.save(output/f'{name}-{size}.webp','WEBP',quality=84,method=6)
 print(name,image.size,flush=True)

url='https://images.pexels.com/photos/6474478/pexels-photo-6474478.jpeg?auto=compress&cs=tinysrgb&w=1440'
with urlopen(url,timeout=60) as response: image=Image.open(BytesIO(response.read())).convert('RGB')
for size in [960,1440]:
 resized=image.copy(); resized.thumbnail((size,9999)); resized.save(output/f'connections-{size}.webp','WEBP',quality=84,method=6)
