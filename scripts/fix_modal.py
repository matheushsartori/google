
# Fix broken modal in instances page - replace lines 599-611 with clean info box
lines = open('app/instances/page.tsx', 'r', encoding='utf-8').readlines()

# Print current state of problematic area
print("CURRENT STATE (lines 598-614):")
for i in range(597, 614):
    print(f"  {i+1}: {lines[i].rstrip()}")

# Replace lines 599 to 611 (0-indexed: 599-611) with just the info box
# Line 599 = blank line
# Lines 600-611 = broken label/div/info mix

info_box_lines = [
    '\n',
    '                                {/* Info UazAPI */}\n',
    '                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/20">\n',
    '                                    <span className="material-symbols-outlined text-[#d4af37] text-xl shrink-0 mt-0.5">info</span>\n',
    '                                    <div>\n',
    '                                        <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest mb-1">Token automático</p>\n',
    '                                        <p className="text-slate-500 text-xs leading-relaxed">O token será gerado automaticamente pelo servidor UazAPI. Após criar, conecte escaneando o QR Code.</p>\n',
    '                                    </div>\n',
    '                                </div>\n',
]

# Replace lines 598-611 (indices 598-611, which is 0-based 599-612)
new_lines = lines[:598] + info_box_lines + lines[611:]

with open('app/instances/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\nDone! Total lines: {len(new_lines)}")
print("\nNEW STATE (lines 596-612):")
for i in range(595, 612):
    if i < len(new_lines):
        print(f"  {i+1}: {new_lines[i].rstrip()}")
