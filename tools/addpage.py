import sys,json,subprocess,re
slug,title,blurb,icon,llms=sys.argv[1:6]
R='/workspace/homebackupcost/'
s=open(R+'src/data/series.js').read()
if f"/{slug}/" not in s:
    s=s.replace("\n];",f"\n  {{ href:'/{slug}/', title:{json.dumps(title)}, blurb:{json.dumps(blurb)}, icon:{json.dumps(icon)} }},\n];")
    open(R+'src/data/series.js','w').write(s)
s=open(R+'src/pages/sitemap.xml.js').read()
if f"'/{slug}/'" not in s:
    s=s.replace("'/winter-storm-power-outage-heat/',",f"'/winter-storm-power-outage-heat/','/{slug}/',");open(R+'src/pages/sitemap.xml.js','w').write(s)
s=open(R+'public/llms.txt').read()
if f"/{slug}/" not in s:
    s=s.replace("(https://homebackupcost.com/calculator/?scenario=winter)\n",f"(https://homebackupcost.com/calculator/?scenario=winter)\n- [{llms}](https://homebackupcost.com/{slug}/)\n");open(R+'public/llms.txt','w').write(s)
