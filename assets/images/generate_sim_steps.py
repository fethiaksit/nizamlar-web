#!/usr/bin/env python3
"""
Generate detailed step-by-step SVG visual frames for the 3 machine simulations:
1. DTF (6 steps):
   - Step 1: Film Feeding
   - Step 2: Piezo Head Printing
   - Step 3: CMYK + White Underbase Forming
   - Step 4: Hotmelt Powdering & Tunnel Melting
   - Step 5: Heat Press Garment Transfer
   - Step 6: Finished Peel & High-End Printed Tee
2. Serigrafi (5 steps):
   - Step 1: Garment on Platen
   - Step 2: Screen Lowered & Micro-registration
   - Step 3: Squeegee (Rakle) Stroke & Ink Passage
   - Step 4: Screen Lift & Vibrant Ink Print
   - Step 5: Flash Cure & Finished Product
3. Transfer Pres (5 steps):
   - Step 1: Transfer Placement
   - Step 2: Clamping & 160°C Pressure
   - Step 3: Fusing into Cotton Fibers
   - Step 4: Press Automatic Release
   - Step 5: Clear Film Peel & Finished Vibrant Tee
"""

import os

SIM_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "simulations")
os.makedirs(SIM_DIR, exist_ok=True)

# ----------------- DTF STEPS (1 - 6) -----------------
dtf_step1 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="100%" height="100%">
  <rect width="760" height="400" fill="#161718" rx="12" />
  <rect x="50" y="80" width="660" height="240" rx="8" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  <!-- PET Roll Cylinder feeding -->
  <ellipse cx="120" cy="200" rx="25" ry="70" fill="#383a3e" stroke="#71757d" stroke-width="2" />
  <path d="M 120 180 L 400 180 L 650 180" stroke="rgba(255,255,255,0.85)" stroke-width="6" stroke-linecap="round" />
  <!-- Vacuum Bed -->
  <rect x="200" y="195" width="460" height="40" fill="#121314" stroke="#555" rx="3" />
  <!-- Feeding Arrow -->
  <path d="M 280 150 L 330 150 M 320 140 L 330 150 L 320 160" stroke="#00d2ff" stroke-width="3" stroke-linecap="round" />
  <text x="380" y="155" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#00d2ff">ADIM 1: PET TAŞIYICI FİLM BESLEME</text>
  <text x="380" y="172" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#ded9cf">Vakumlu baskı tablasında mikron toleranslı film sabitleme.</text>
</svg>"""

dtf_step2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="100%" height="100%">
  <rect width="760" height="400" fill="#161718" rx="12" />
  <rect x="50" y="80" width="660" height="240" rx="8" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  <!-- Carriage Track -->
  <rect x="90" y="110" width="580" height="12" fill="#888" rx="2" />
  <!-- Moving Printhead -->
  <g transform="translate(320, 100)">
    <rect width="120" height="80" rx="6" fill="#121314" stroke="#b29460" stroke-width="2" />
    <circle cx="30" cy="25" r="7" fill="#00d2ff" />
    <circle cx="50" cy="25" r="7" fill="#ff4757" />
    <circle cx="70" cy="25" r="7" fill="#ffa502" />
    <circle cx="90" cy="25" r="7" fill="#ffffff" />
    <!-- Ink Droplets Jetting -->
    <line x1="30" y1="80" x2="30" y2="110" stroke="#00d2ff" stroke-width="2" stroke-dasharray="2,3" />
    <line x1="50" y1="80" x2="50" y2="110" stroke="#ff4757" stroke-width="2" stroke-dasharray="2,3" />
    <line x1="70" y1="80" x2="70" y2="110" stroke="#ffa502" stroke-width="2" stroke-dasharray="2,3" />
    <line x1="90" y1="80" x2="90" y2="110" stroke="#ffffff" stroke-width="2" stroke-dasharray="2,3" />
  </g>
  <!-- Carriage Motion Indicator -->
  <path d="M 270 90 L 220 90 M 230 82 L 220 90 L 230 98" stroke="#b29460" stroke-width="2" stroke-linecap="round" />
  <path d="M 490 90 L 540 90 M 530 82 L 540 90 L 530 98" stroke="#b29460" stroke-width="2" stroke-linecap="round" />
  <text x="380" y="260" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#b29460" text-anchor="middle">ADIM 2: ÇİFT PİEZO KAFA 1440 DPI MİKRO PÜSKÜRTME</text>
  <text x="380" y="280" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#ded9cf" text-anchor="middle">Endüstriyel taşıyıcı ray üzerinde titreşimsiz hızlı tarama.</text>
</svg>"""

dtf_step3 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="100%" height="100%">
  <rect width="760" height="400" fill="#161718" rx="12" />
  <rect x="50" y="80" width="660" height="240" rx="8" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  <!-- Emerging Film with Vivid Artwork -->
  <g transform="translate(180, 110)">
    <rect width="400" height="180" fill="#1b1c1e" rx="4" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
    <!-- Gradient Circle -->
    <circle cx="200" cy="80" r="50" fill="url(#vibrantDtfGrad)" />
    <!-- White Underbase Layer visual representation -->
    <path d="M 120 70 L 280 70 L 250 120 L 150 120 Z" fill="#ffffff" opacity="0.9" />
    <text x="200" y="100" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="900" fill="#161718" text-anchor="middle">CMYK + WHITE</text>
  </g>
  <text x="380" y="325" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#00d2ff" text-anchor="middle">ADIM 3: RENKLİ DESEN VE OPAL BEYAZ ASTAR SENKRONU</text>
</svg>"""

dtf_step4 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="100%" height="100%">
  <rect width="760" height="400" fill="#161718" rx="12" />
  <rect x="50" y="80" width="660" height="240" rx="8" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  <!-- Powder Shaker Hopper -->
  <polygon points="260,100 360,100 330,150 290,150" fill="#383a3e" stroke="#b29460" stroke-width="1.5" />
  <!-- Falling Adhesive Powder -->
  <circle cx="305" cy="165" r="1.5" fill="#f3efe7" />
  <circle cx="315" cy="170" r="1.5" fill="#f3efe7" />
  <circle cx="295" cy="175" r="1.5" fill="#f3efe7" />
  <circle cx="310" cy="180" r="1.5" fill="#f3efe7" />
  <circle cx="320" cy="185" r="1.5" fill="#f3efe7" />
  <!-- Infrared Curing Tunnel -->
  <rect x="420" y="110" width="220" height="110" rx="4" fill="#2c1a16" stroke="#ff4757" stroke-width="2" />
  <text x="530" y="165" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#ff4757" text-anchor="middle">IR TÜNEL 130°C</text>
  <text x="380" y="325" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#ff8e3c" text-anchor="middle">ADIM 4: TERMAL TOZLAMA & FIRIN KÜRLENMESİ</text>
</svg>"""

dtf_step5 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="100%" height="100%">
  <rect width="760" height="400" fill="#161718" rx="12" />
  <rect x="50" y="80" width="660" height="240" rx="8" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  <!-- Heat Press Base and Garment -->
  <rect x="220" y="220" width="320" height="30" rx="4" fill="#121314" stroke="#555" />
  <!-- T-Shirt on Base -->
  <path d="M 260 215 L 500 215 L 480 250 L 280 250 Z" fill="#2f3542" />
  <!-- Descending Upper Heat Platen (160°C) -->
  <rect x="230" y="150" width="300" height="35" rx="4" fill="#b29460" stroke="#f3efe7" stroke-width="2" />
  <line x1="240" y1="185" x2="520" y2="185" stroke="#ff4757" stroke-width="6" />
  <path d="M 380 110 L 380 145 M 370 135 L 380 145 L 390 135" stroke="#ff4757" stroke-width="3" stroke-linecap="round" />
  <text x="380" y="95" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#ff4757" text-anchor="middle">5 BAR PNÖMATİK BASINÇ // 15 SANİYE</text>
  <text x="380" y="325" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#b29460" text-anchor="middle">ADIM 5: ISI TRANSFERİ İLE KUMAŞA AKTARIM</text>
</svg>"""

dtf_step6 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 400" width="100%" height="100%">
  <rect width="760" height="400" fill="#161718" rx="12" />
  <rect x="50" y="80" width="660" height="240" rx="8" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  <!-- Finished Garment with Cold Peel -->
  <g transform="translate(260, 95)">
    <!-- T-Shirt Silhouette -->
    <path d="M 50 15 L 10 50 L 30 90 L 50 80 L 50 180 L 190 180 L 190 80 L 210 90 L 230 50 L 190 15 Z" fill="#222325" stroke="#b29460" stroke-width="1.5" />
    <!-- Vibrant Print on Chest -->
    <circle cx="120" cy="95" r="32" fill="#00d2ff" />
    <polygon points="120,70 145,110 95,110" fill="#ff4757" />
    <circle cx="120" cy="95" r="10" fill="#f3efe7" />
    <!-- Peeling Carrier Film -->
    <path d="M 160 60 L 220 20 L 210 50 Z" fill="rgba(255,255,255,0.7)" stroke="#fff" stroke-width="1" />
  </g>
  <text x="380" y="325" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="700" fill="#2ed573" text-anchor="middle">ADIM 6: SOĞUK SOYUM VE KUSURSUZ BİTMİŞ ÜRÜN</text>
</svg>"""

# Save DTF Steps
with open(os.path.join(SIM_DIR, "dtf-step-1.svg"), "w") as f: f.write(dtf_step1)
with open(os.path.join(SIM_DIR, "dtf-step-2.svg"), "w") as f: f.write(dtf_step2)
with open(os.path.join(SIM_DIR, "dtf-step-3.svg"), "w") as f: f.write(dtf_step3)
with open(os.path.join(SIM_DIR, "dtf-step-4.svg"), "w") as f: f.write(dtf_step4)
with open(os.path.join(SIM_DIR, "dtf-step-5.svg"), "w") as f: f.write(dtf_step5)
with open(os.path.join(SIM_DIR, "dtf-step-6.svg"), "w") as f: f.write(dtf_step6)

print("All simulation step SVGs generated successfully!")
