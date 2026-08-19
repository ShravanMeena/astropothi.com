import sys, json
d = json.load(sys.stdin)
for k in sys.argv[1].split('.'):
    if k == '': continue
    d = d[int(k)] if k.isdigit() else d[k]
print(d if not isinstance(d, (dict, list)) else json.dumps(d, ensure_ascii=False, indent=2))
