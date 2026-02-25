import re

with open('app/instances/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Token de Acesso + Integracao blocks
pattern = r'(\s*<div className="space-y-3">\s*<label[^>]*>\s*<div[^/]*/>\s*Token de Acesso \(Opcional\).*?</div>\s*</div>\s*<div className="space-y-3">\s*<label[^>]*>\s*<div[^/]*/>\s*Integra)'

info_box = '''
                                {/* Info UazAPI */}
                                 <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20">
                                     <span className="material-symbols-outlined text-[#d4af37] text-xl shrink-0 mt-0.5">info</span>
                                     <div>
                                         <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest mb-1">Token automatico</p>
                                         <p className="text-slate-500 text-xs leading-relaxed">O token sera gerado automaticamente pelo servidor UazAPI.</p>
                                     </div>
                                 </div>
                                 <div className="space-y-3">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                         <div className="size-1 bg-primary rounded-full"></div>
                                         Integra'''

# Find the block and print line info
found = re.search(pattern, content, re.DOTALL)
if found:
    print('Found at pos:', found.start(), '-', found.end())
else:
    print('Pattern NOT found, trying line-by-line approach')

# Line by line approach - simpler
lines = content.split('\n')
out = []
skip_until = None
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # Start skip: Token de Acesso block
    if 'Token de Acesso (Opcional)' in line and skip_until is None:
        # Go back to find opening div
        while out and '<div className="space-y-3">' in out[-1]:
            out.pop()
        # Add info box instead
        out.append('')
        out.append('                                {/* Info UazAPI */}')
        out.append('                                 <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20">')
        out.append('                                     <span className="material-symbols-outlined text-[#d4af37] text-xl shrink-0 mt-0.5">info</span>')
        out.append('                                     <div>')
        out.append('                                         <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest mb-1">Token automático</p>')
        out.append('                                         <p className="text-slate-500 text-xs leading-relaxed">O token será gerado automaticamente pelo UazAPI. Após criar, escaneie o QR Code.</p>')
        out.append('                                     </div>')
        out.append('                                 </div>')
        skip_until = 'TOKEN_END'
        i += 1
        continue
    
    # Skip everything until the end of the second block (Integracao)
    if skip_until == 'TOKEN_END':
        if 'INTEGRATION-WBC' in line:
            skip_until = 'INTEGRATION_CLOSE'
        i += 1
        continue
    
    # Skip until the closing div of integration block
    if skip_until == 'INTEGRATION_CLOSE':
        if stripped == '</div>' and '</div>' in line:
            # This closes the relative group
            i += 1
            if i < len(lines) and '</div>' in lines[i].strip():
                # This closes the space-y-3
                i += 1
            skip_until = None
        else:
            i += 1
        continue
    
    out.append(line)
    i += 1

new_content = '\n'.join(out)
with open('app/instances/page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done! Lines:', len(out))
print('Remaining references:')
for j, l in enumerate(out):
    if 'newInstanceToken' in l or 'newInstanceIntegration' in l or 'Token de Acesso' in l or 'WHATSAPP-BAILEYS' in l:
        print(f'  Line {j+1}: {l.strip()}')
