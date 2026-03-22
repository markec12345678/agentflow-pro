import os, re, sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

src_dirs = ['src', 'prisma']
# Only look for actual Slovenian text (UI strings, comments, labels)
# Skip: eturizem (proper noun), DDV (tax acronym used in code), WiFi
sl_pattern = re.compile(
    r'[čšžČŠŽćđĆĐ]'
    r'|rezervacij[ae]?|nastanit|gostje|prihod\b|odhod\b'
    r'|nastavit|obvestil|napaka\b|uspesno|opozorilo|prevod\b'
    r'|turisticn|recepcij|direktor\b|receptor\b'
    r'|slovensko|turizem\b|nastanitev'
    r'|gostinsk|prenočitev|postelj'
    r'|sezona\b|sezone\b|sezonsk|cenik\b'
    r'|rezervacija|rezervacije|rezervacijo'
    r'|lastnik|lastnika|lastniku'
    r'|oddaja\b|oddaje\b|oddajo\b'
    r'|počitniška|počitniške|počitniški'
    r'|apartma|apartmaj'
    r'|soba\b|sobe\b|sobi\b|sobo\b'
    r'|kopalnica|kuhinja'
    r'|parkirišč'
    r'|prijaviti|prijavit\b|odjava\b|odjavit'
    r'|plačilo|plačila|plačilu|plačati|plačaj'
    r'|račun\b|računa\b|računu\b|račune\b'
    r'|faktura|fakture|fakturo'
    r'|davek\b|davka\b|davku\b'
    r'|turistična taksa|turisticna taksa'
    r'|nočitev|nočitve'
    r'|prijava\b|odjava\b'
    r'|potrdilo\b|potrdila\b|potrditev\b'
    r'|odpoved\b|odpovedi\b|odpovedati'
    r'|polog\b|pologa\b|pologu\b'
    r'|akontacija|akontacije'
    r'|shrani\b|shranjeno|shranjuj'
    r'|dodaj\b|dodano\b|dodajanje'
    r'|izbriši\b|izbrisano\b'
    r'|posodobi\b|posodobljeno'
    r'|ustvari\b|ustvarjeno'
    r'|prikaži\b|prikazano'
    r'|nalaganje\b|naloži\b'
    r'|pošlji\b|poslano\b'
    r'|odpri\b|odprto\b'
    r'|zapri\b|zaprto\b'
    r'|potrditi\b|potrdi\b|potrjeno'
    r'|preklici\b|prekliči\b'
    r'|uredi\b|urejeno\b'
    r'|preglej\b|pregledano'
    r'|filtriraj\b|filtrirano'
    r'|razvrsti\b'
    r'|izvozi\b|izvoženo'
    r'|uvozi\b|uvoženo'
    r'|tiskaj\b|tiskano\b'
    r'|danes\b|jutri\b|včeraj\b|zdaj\b|sedaj\b'
    r'|januar\b|februar\b|marec\b|april\b|maj\b|junij\b|julij\b|avgust\b|september\b|oktober\b|november\b|december\b'
    r'|ponedeljek\b|torek\b|sreda\b|četrtek\b|petek\b|sobota\b|nedelja\b'
    , re.IGNORECASE
)

skip_dirs = {'node_modules', '.next', 'generated', '__pycache__', '.git'}
extensions = {'.ts', '.tsx'}

results = []
for src_dir in src_dirs:
    if not os.path.exists(src_dir):
        continue
    for root, dirs, files in os.walk(src_dir):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for fname in files:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in extensions:
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, encoding='utf-8', errors='ignore') as f:
                    for i, line in enumerate(f, 1):
                        if sl_pattern.search(line):
                            results.append((fpath, i, line.rstrip()))
            except Exception:
                pass

print(f'Total matches: {len(results)}')
print('='*80)

from collections import defaultdict
by_file = defaultdict(list)
for fpath, lineno, line in results:
    by_file[fpath].append((lineno, line))

for fpath in sorted(by_file.keys()):
    print(f'\n=== {fpath} ===')
    for lineno, line in by_file[fpath]:
        safe_line = line[:140].encode('ascii', errors='replace').decode('ascii')
        print(f'  L{lineno}: {safe_line}')
