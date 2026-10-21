#!/usr/bin/env python3
"""
Nizamlar Baskı — Asset Generator for Realistic Printed Garments and Machinery
Generates high-fidelity vector graphics with fabric textures, garment folds,
realistic print placement, and industrial machinery schematics.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MACHINES_DIR = os.path.join(BASE_DIR, "machines")
PRODUCTS_DIR = os.path.join(BASE_DIR, "products")
TEXTURES_DIR = os.path.join(BASE_DIR, "textures")
SIM_DIR = os.path.join(BASE_DIR, "simulations")

os.makedirs(MACHINES_DIR, exist_ok=True)
os.makedirs(PRODUCTS_DIR, exist_ok=True)
os.makedirs(TEXTURES_DIR, exist_ok=True)
os.makedirs(SIM_DIR, exist_ok=True)

# Common SVG Defs for fabric texture and shadow effects
COMMON_DEFS = """
  <defs>
    <!-- Fabric Weave Filter -->
    <filter id="fabricTexture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.12 0" in="noise" result="coloredNoise" />
      <feComposite operator="in" in2="SourceGraphic" result="textured" />
      <feBlend mode="multiply" in="textured" in2="SourceGraphic" />
    </filter>
    
    <!-- Heavy Fleece Texture -->
    <filter id="fleeceTexture" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="fleeceNoise" />
      <feColorMatrix type="matrix" values="0.2 0.2 0.2 0 0  0.2 0.2 0.2 0 0  0.2 0.2 0.2 0 0  0 0 0 0.18 0" in="fleeceNoise" result="fleeceOverlay" />
      <feComposite operator="in" in2="SourceGraphic" />
      <feBlend mode="overlay" in2="SourceGraphic" />
    </filter>

    <!-- Ink Relief Drop Shadow for Screenprint / Puff -->
    <filter id="inkRelief" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.35" />
    </filter>

    <filter id="goldShine" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Linear Gradients for Garments -->
    <linearGradient id="anthraciteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a2c2f" />
      <stop offset="40%" stop-color="#222325" />
      <stop offset="100%" stop-color="#18191a" />
    </linearGradient>

    <linearGradient id="creamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faf8f2" />
      <stop offset="50%" stop-color="#f3efe7" />
      <stop offset="100%" stop-color="#e7e0d2" />
    </linearGradient>

    <linearGradient id="brownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#554035" />
      <stop offset="50%" stop-color="#49372e" />
      <stop offset="100%" stop-color="#382921" />
    </linearGradient>

    <linearGradient id="goldInkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4ba88" />
      <stop offset="45%" stop-color="#b29460" />
      <stop offset="100%" stop-color="#8a6f3e" />
    </linearGradient>

    <linearGradient id="vibrantDtfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3b69" />
      <stop offset="35%" stop-color="#ff8e3c" />
      <stop offset="70%" stop-color="#ffdc3c" />
      <stop offset="100%" stop-color="#00d2ff" />
    </linearGradient>
  </defs>
"""

# ==============================================================================
# 1. PRODUCTS: REALISTIC T-SHIRTS
# ==============================================================================

def make_tee_svg(color_grad="anthraciteGrad", artwork="", is_back=False, seam_color="rgba(255,255,255,0.06)", neck_rib_color="#18191a"):
    back_cue = """
    <!-- Back of Neck Rib / Label -->
    <path d="M 235 90 Q 300 115 365 90 Q 300 95 235 90 Z" fill="#121314" />
    <text x="300" y="112" font-family="'JetBrains Mono', monospace" font-size="7" fill="#b29460" font-weight="600" text-anchor="middle" letter-spacing="1">NİZAMLAR LAB / 100% COTTON</text>
    """ if is_back else """
    <!-- Front Collar Ribbing Curve -->
    <path d="M 235 90 Q 300 145 365 90 Q 300 135 235 90 Z" fill="{neck_rib_color}" />
    <path d="M 238 93 Q 300 142 362 93" fill="none" stroke="#b29460" stroke-width="0.8" opacity="0.3" stroke-dasharray="2,2" />
    """.format(neck_rib_color=neck_rib_color)

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">
  {COMMON_DEFS}
  
  <!-- Background Canvas Studio Tone -->
  <rect width="600" height="680" fill="#1a1b1d" rx="16" />
  <radialGradient id="studioLight" cx="50%" cy="30%" r="60%">
    <stop offset="0%" stop-color="#323337" stop-opacity="0.6" />
    <stop offset="100%" stop-color="#161718" stop-opacity="0.9" />
  </radialGradient>
  <rect width="600" height="680" fill="url(#studioLight)" rx="16" />

  <!-- Studio Floor Shadow -->
  <ellipse cx="300" cy="635" rx="210" ry="24" fill="#090a0b" opacity="0.65" filter="blur(8px)" />

  <!-- Garment Body Silhouette -->
  <g id="tshirtBody">
    <!-- Left Sleeve -->
    <path d="M 235 90 L 105 175 L 140 260 L 195 225 L 190 235 L 190 590 L 410 590 L 410 235 L 405 225 L 460 260 L 495 175 L 365 90 Z" 
          fill="url(#{color_grad})" filter="url(#fabricTexture)" />

    <!-- Sleeve & Side Creases & Shading Folds -->
    <path d="M 190 230 C 185 300 195 480 188 590" fill="none" stroke="{seam_color}" stroke-width="2" />
    <path d="M 410 230 C 415 300 405 480 412 590" fill="none" stroke="{seam_color}" stroke-width="2" />
    
    <!-- Realistic Drape Shadows -->
    <path d="M 215 150 Q 230 350 220 585" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="12" filter="blur(6px)" />
    <path d="M 385 150 Q 370 350 380 585" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="12" filter="blur(6px)" />
    
    <!-- Chest highlight curve -->
    <path d="M 250 200 Q 300 240 350 200" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18" filter="blur(10px)" />

    <!-- Sleeve Cuffs & Hem Double Stitches -->
    <path d="M 105 175 L 140 260" fill="none" stroke="{seam_color}" stroke-width="1" />
    <path d="M 109 178 L 142 257" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.8" stroke-dasharray="3,2" />
    
    <path d="M 495 175 L 460 260" fill="none" stroke="{seam_color}" stroke-width="1" />
    <path d="M 491 178 L 458 257" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.8" stroke-dasharray="3,2" />

    <!-- Bottom Hem Stitches -->
    <path d="M 190 575 L 410 575" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
    <path d="M 190 578 L 410 578" fill="none" stroke="{seam_color}" stroke-width="0.8" stroke-dasharray="4,2" />

    <!-- Collar Structure -->
    {back_cue}
  </g>

  <!-- PRINTED ARTWORK LAYER -->
  <g id="printedArtwork" filter="url(#inkRelief)">
    {artwork}
  </g>

  <!-- Spec Tag / Badge -->
  <g transform="translate(30, 30)">
    <rect width="130" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">240 GSM PENYE</text>
  </g>
</svg>"""

# 1. Büyük Sırt Baskılı Tişört (Streetwear Back Art)
tee_back_art = """
  <g transform="translate(195, 160)">
    <!-- Main Back Graphic Frame -->
    <rect x="0" y="0" width="210" height="280" fill="none" stroke="#b29460" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.8" />
    
    <!-- Large Halftone / Screenprint Artwork -->
    <rect x="10" y="10" width="190" height="170" fill="#1b1c1d" />
    
    <!-- Abstract Architectural Screenprint Graphic -->
    <circle cx="105" cy="85" r="55" fill="none" stroke="#d4ba88" stroke-width="2" />
    <circle cx="105" cy="85" r="42" fill="none" stroke="#ff4757" stroke-width="1.5" stroke-dasharray="4,2" />
    <polygon points="105,35 150,115 60,115" fill="none" stroke="#f3efe7" stroke-width="2" />
    <circle cx="105" cy="88" r="14" fill="#d4ba88" />
    
    <!-- Industrial Screen Rays -->
    <line x1="25" y1="85" x2="185" y2="85" stroke="rgba(243,239,231,0.3)" stroke-width="1" />
    <line x1="105" y1="20" x2="105" y2="150" stroke="rgba(243,239,231,0.3)" stroke-width="1" />
    <line x1="45" y1="40" x2="165" y2="130" stroke="rgba(178,148,96,0.4)" stroke-width="1" />

    <!-- Typography -->
    <text x="105" y="202" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">NİZAMLAR STUDIO</text>
    <text x="105" y="218" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="500" fill="#b29460" text-anchor="middle" letter-spacing="2">HEAVYWEIGHT SCREENPRINT // 01-A</text>
    
    <line x1="30" y1="228" x2="180" y2="228" stroke="#b29460" stroke-width="1" />
    
    <text x="105" y="244" font-family="'JetBrains Mono', monospace" font-size="7" fill="#9e9587" text-anchor="middle" letter-spacing="1">LIMITED EDITION TEXTILE SERIES</text>
    <text x="105" y="258" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="#e84118" text-anchor="middle" letter-spacing="4">PRECISION INK LAB</text>
    <text x="105" y="272" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="#f3efe7" text-anchor="middle">41°00'49"N 28°57'18"E // ISTANBUL</text>
  </g>
"""

# 2. Ön Göğüs Vintage Baskılı Tişört
tee_front_vintage_art = """
  <g transform="translate(205, 170)">
    <!-- Botanical / Heritage Vintage Screenprint Emblem -->
    <circle cx="95" cy="95" r="75" fill="#49372e" stroke="#b29460" stroke-width="2.5" />
    <circle cx="95" cy="95" r="68" fill="none" stroke="#ded9cf" stroke-width="1" stroke-dasharray="3,2" />
    
    <!-- Central Motif -->
    <path d="M 95 45 Q 115 75 95 105 Q 75 75 95 45 Z" fill="#b29460" />
    <path d="M 65 95 Q 95 115 125 95 Q 95 75 65 95 Z" fill="#b29460" opacity="0.8" />
    <circle cx="95" cy="95" r="8" fill="#f3efe7" />
    
    <!-- Curved Typography -->
    <text x="95" y="132" font-family="'Cormorant Garamond', serif" font-size="15" font-weight="700" fill="#f3efe7" text-anchor="middle" letter-spacing="2">HERITAGE CRAFT</text>
    <text x="95" y="146" font-family="'JetBrains Mono', monospace" font-size="7" fill="#ded9cf" text-anchor="middle" letter-spacing="1.5">NİZAMLAR TEXTILE // EST. 1998</text>
    
    <!-- Subtitle Banner -->
    <rect x="25" y="156" width="140" height="18" fill="#b29460" rx="3" />
    <text x="95" y="169" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="800" fill="#222325" text-anchor="middle" letter-spacing="1.2">ORGANIC WATER-BASED</text>
  </g>
"""

# 3. Minimal Logolu Lüks Tişört
tee_minimal_logo_art = """
  <g transform="translate(325, 175)">
    <!-- Subtle Minimal Chest Logo Badge -->
    <rect x="0" y="0" width="46" height="46" fill="#1b1c1e" stroke="#b29460" stroke-width="1.2" rx="4" />
    <path d="M 12 34 L 12 12 L 23 27 L 34 12 L 34 34" fill="none" stroke="#d4ba88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="23" cy="33" r="2" fill="#b29460" />
    <text x="23" y="42" font-family="'JetBrains Mono', monospace" font-size="4.5" fill="#9e9587" text-anchor="middle" letter-spacing="0.5">NZM-01</text>
  </g>
"""

# 4. Oversize Grafik Baskılı Tişört
tee_oversize_graphic_art = """
  <g transform="translate(190, 180)">
    <!-- High-density Puff Print & Streetwear Grid Artwork -->
    <rect x="0" y="0" width="220" height="240" fill="#202226" stroke="#b29460" stroke-width="1.5" />
    
    <!-- Vivid Acid Colors Graphic Grid -->
    <g transform="translate(15, 15)">
      <rect x="0" y="0" width="90" height="90" fill="#ff4757" />
      <circle cx="45" cy="45" r="30" fill="#222325" />
      <text x="45" y="50" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#f3efe7" text-anchor="middle">OVER</text>

      <rect x="100" y="0" width="90" height="90" fill="#ffa502" />
      <polygon points="145,15 175,75 115,75" fill="#222325" />
      <text x="145" y="62" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700" fill="#f3efe7" text-anchor="middle">SIZE</text>

      <rect x="0" y="100" width="190" height="75" fill="#2f3542" stroke="#b29460" stroke-width="1" />
      <text x="95" y="128" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">SPECTRUM</text>
      <text x="95" y="148" font-family="'JetBrains Mono', monospace" font-size="8" fill="#b29460" text-anchor="middle" letter-spacing="2">HIGH-DENSITY 3D PUFF INK</text>
      <text x="95" y="162" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="#ded9cf" text-anchor="middle">DTF + PLASTISOL DUAL HYBRID // 2026</text>
    </g>

    <line x1="0" y1="210" x2="220" y2="210" stroke="#b29460" stroke-width="2" />
    <text x="110" y="228" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="700" fill="#f3efe7" text-anchor="middle" letter-spacing="2">INDUSTRIAL TEXTILE RUN 400</text>
  </g>
"""

# 5. Tipografik Baskılı Tişört (Editorial Typography)
tee_typographic_art = """
  <g transform="translate(195, 175)">
    <!-- High-End Editorial Typographic Artwork -->
    <text x="105" y="40" font-family="'Cormorant Garamond', serif" font-size="34" font-weight="400" font-style="italic" fill="#222325" text-anchor="middle" letter-spacing="1">The Silence</text>
    <text x="105" y="75" font-family="'Plus Jakarta Sans', sans-serif" font-size="24" font-weight="800" fill="#49372e" text-anchor="middle" letter-spacing="4">OF TEXTURE</text>
    
    <line x1="25" y1="92" x2="185" y2="92" stroke="#b29460" stroke-width="1.5" />
    
    <text x="105" y="112" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#222325" text-anchor="middle" letter-spacing="1.5">NİZAMLAR BASKI // ATELIER ISTANBUL</text>
    
    <!-- Paragraph column style -->
    <rect x="25" y="125" width="160" height="90" fill="none" stroke="#c9c1b5" stroke-width="0.8" />
    <text x="35" y="145" font-family="'Plus Jakarta Sans', sans-serif" font-size="7.5" fill="#3f4247" font-weight="600">PRECISE MICRON ALIGNMENT</text>
    <text x="35" y="160" font-family="'Plus Jakarta Sans', sans-serif" font-size="6.8" fill="#5c473c">Deep pigment penetration into 100%</text>
    <text x="35" y="172" font-family="'Plus Jakarta Sans', sans-serif" font-size="6.8" fill="#5c473c">combed ringspun cotton fibers with</text>
    <text x="35" y="184" font-family="'Plus Jakarta Sans', sans-serif" font-size="6.8" fill="#5c473c">zero hand-feel water discharge base.</text>
    <text x="35" y="202" font-family="'JetBrains Mono', monospace" font-size="7" font-weight="700" fill="#b29460">SERIES NO: 084 / 500</text>
  </g>
"""

# 6. Çok Renkli Sanatsal Desenli Tişört (DTF Multicolor Art)
tee_multicolor_art = """
  <g transform="translate(190, 160)">
    <!-- High-res Full Color DTF Gradient Artwork -->
    <circle cx="110" cy="110" r="85" fill="url(#vibrantDtfGrad)" />
    
    <!-- Overlay Masking Geometric cuts -->
    <path d="M 30 110 Q 110 30 190 110 Q 110 190 30 110 Z" fill="#18191a" opacity="0.85" />
    
    <!-- Floating Gold Elements -->
    <circle cx="110" cy="110" r="38" fill="none" stroke="#f3efe7" stroke-width="3" />
    <circle cx="110" cy="110" r="28" fill="#b29460" />
    <text x="110" y="115" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#18191a" text-anchor="middle">1440</text>
    
    <text x="110" y="215" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">CHROMATIC DTF</text>
    <text x="110" y="232" font-family="'JetBrains Mono', monospace" font-size="8" fill="#00d2ff" text-anchor="middle" letter-spacing="2">FULL-TONE HIGH RESOLUTION</text>
    <text x="110" y="248" font-family="'JetBrains Mono', monospace" font-size="7" fill="#b29460" text-anchor="middle">60°C INDUSTRIAL WASH TESTED</text>
  </g>
"""

# Blank Tee for Comparison
tee_blank_art = "<!-- Blank Tee - Clean cotton fabric ready for print -->"

# Save All Tees
with open(os.path.join(PRODUCTS_DIR, "tee-back-streetwear.svg"), "w") as f:
    f.write(make_tee_svg("anthraciteGrad", tee_back_art, is_back=True))

with open(os.path.join(PRODUCTS_DIR, "tee-front-vintage.svg"), "w") as f:
    f.write(make_tee_svg("creamGrad", tee_front_vintage_art, is_back=False, seam_color="rgba(0,0,0,0.12)", neck_rib_color="#e2dbcb"))

with open(os.path.join(PRODUCTS_DIR, "tee-minimal-logo.svg"), "w") as f:
    f.write(make_tee_svg("brownGrad", tee_minimal_logo_art, is_back=False, seam_color="rgba(255,255,255,0.08)", neck_rib_color="#33241d"))

with open(os.path.join(PRODUCTS_DIR, "tee-oversize-graphic.svg"), "w") as f:
    f.write(make_tee_svg("anthraciteGrad", tee_oversize_graphic_art, is_back=False))

with open(os.path.join(PRODUCTS_DIR, "tee-typographic-editorial.svg"), "w") as f:
    f.write(make_tee_svg("creamGrad", tee_typographic_art, is_back=False, seam_color="rgba(0,0,0,0.12)", neck_rib_color="#e2dbcb"))

with open(os.path.join(PRODUCTS_DIR, "tee-multicolor-artistic.svg"), "w") as f:
    f.write(make_tee_svg("anthraciteGrad", tee_multicolor_art, is_back=False))

with open(os.path.join(PRODUCTS_DIR, "tee-blank-cotton.svg"), "w") as f:
    f.write(make_tee_svg("anthraciteGrad", tee_blank_art, is_back=False))


# ==============================================================================
# 2. PRODUCTS: SWEATSHIRTS & HOODIES
# ==============================================================================

def make_sweat_svg(color_grad="anthraciteGrad", artwork="", is_hoodie=False, seam_color="rgba(255,255,255,0.08)"):
    hood_markup = """
    <!-- Hoodie Hood Silhouette -->
    <path d="M 220 100 Q 185 30 300 25 Q 415 30 380 100 Q 300 135 220 100 Z" fill="url(#{color_grad})" filter="url(#fleeceTexture)" />
    <path d="M 245 105 Q 300 125 355 105" fill="none" stroke="{seam_color}" stroke-width="2" />
    <!-- Drawstrings with Metal Aglets -->
    <path d="M 265 110 C 260 170 250 200 255 225" fill="none" stroke="#ded9cf" stroke-width="3" stroke-linecap="round" />
    <rect x="252" y="225" width="6" height="14" rx="2" fill="#b29460" />
    <path d="M 335 110 C 340 170 350 200 345 225" fill="none" stroke="#ded9cf" stroke-width="3" stroke-linecap="round" />
    <rect x="342" y="225" width="6" height="14" rx="2" fill="#b29460" />
    """.format(color_grad=color_grad, seam_color=seam_color) if is_hoodie else """
    <!-- Crewneck Thick Ribbed Collar -->
    <path d="M 225 90 Q 300 145 375 90 Q 300 120 225 90 Z" fill="#141516" />
    <path d="M 230 92 Q 300 140 370 92" fill="none" stroke="#b29460" stroke-width="1.2" opacity="0.4" stroke-dasharray="3,2" />
    <!-- V-Insert Stitch Detail -->
    <polygon points="285,130 315,130 300,150" fill="none" stroke="{seam_color}" stroke-width="1.5" />
    """.format(seam_color=seam_color)

    pouch_pocket = """
    <!-- Kangaroo Pocket for Hoodie -->
    <path d="M 215 440 L 385 440 L 405 520 L 195 520 Z" fill="none" stroke="{seam_color}" stroke-width="2" />
    <path d="M 215 440 L 195 520" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="3" />
    <path d="M 385 440 L 405 520" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="3" />
    """.format(seam_color=seam_color) if is_hoodie else ""

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">
  {COMMON_DEFS}
  
  <rect width="600" height="680" fill="#18191b" rx="16" />
  <radialGradient id="sweatLight" cx="50%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#2c2d30" stop-opacity="0.7" />
    <stop offset="100%" stop-color="#121314" stop-opacity="0.95" />
  </radialGradient>
  <rect width="600" height="680" fill="url(#sweatLight)" rx="16" />
  <ellipse cx="300" cy="640" rx="220" ry="22" fill="#080809" opacity="0.7" filter="blur(8px)" />

  <!-- Heavyweight Sweatshirt Body -->
  <g id="sweatBody">
    <!-- Sleeves & Raglan/Set-in Shape with Ribbed Cuffs -->
    <path d="M 225 90 L 85 190 L 115 285 L 175 250 L 180 580 L 420 580 L 425 250 L 485 285 L 515 190 L 375 90 Z" 
          fill="url(#{color_grad})" filter="url(#fleeceTexture)" />

    <!-- Heavy Sleeve Cuffs -->
    <rect x="92" y="270" width="30" height="22" transform="rotate(-30, 92, 270)" fill="#141516" stroke="{seam_color}" stroke-width="1.5" />
    <rect x="480" y="255" width="30" height="22" transform="rotate(30, 480, 255)" fill="#141516" stroke="{seam_color}" stroke-width="1.5" />

    <!-- Heavy Waistband Rib -->
    <rect x="180" y="560" width="240" height="35" fill="#141516" stroke="{seam_color}" stroke-width="1.5" />
    <line x1="180" y1="565" x2="420" y2="565" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="4,2" />

    <!-- Side seam shadowing -->
    <path d="M 200 170 Q 215 380 205 560" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="16" filter="blur(8px)" />
    <path d="M 400 170 Q 385 380 395 560" fill="none" stroke="rgba(0,0,0,0.22)" stroke-width="16" filter="blur(8px)" />

    {hood_markup}
    {pouch_pocket}
  </g>

  <!-- PRINTED ARTWORK LAYER -->
  <g id="sweatArtwork" filter="url(#inkRelief)">
    {artwork}
  </g>

  <g transform="translate(30, 30)">
    <rect width="145" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">380 GSM FLEECE</text>
  </g>
</svg>"""

# 7. Oversize Sweatshirt Sırt Desenli (Back Art Sweatshirt)
sweat_back_art = """
  <g transform="translate(190, 160)">
    <!-- Heavy Industrial Statement Backprint -->
    <rect x="0" y="0" width="220" height="270" fill="none" stroke="#d4ba88" stroke-width="2" />
    <rect x="8" y="8" width="204" height="254" fill="#202124" />
    
    <text x="110" y="45" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="4">NİZAMLAR</text>
    <text x="110" y="65" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#b29460" text-anchor="middle" letter-spacing="3">PRINTING ARCHIVE // 2026</text>
    
    <!-- Bold Screenprint Graphic Motif -->
    <circle cx="110" cy="130" r="50" fill="none" stroke="#ff4757" stroke-width="3" />
    <polygon points="110,85 145,155 75,155" fill="#b29460" />
    <circle cx="110" cy="132" r="14" fill="#f3efe7" />
    
    <text x="110" y="205" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="2">INDUSTRIAL EMBOSS</text>
    <text x="110" y="222" font-family="'JetBrains Mono', monospace" font-size="7.5" fill="#9e9587" text-anchor="middle">HIGH DENSITY PLASTISOL FINISH</text>
    
    <!-- Barcode style vector graphic -->
    <g transform="translate(45, 232)">
      <line x1="0" y1="0" x2="0" y2="18" stroke="#f3efe7" stroke-width="3" />
      <line x1="8" y1="0" x2="8" y2="18" stroke="#f3efe7" stroke-width="1.5" />
      <line x1="16" y1="0" x2="16" y2="18" stroke="#f3efe7" stroke-width="4" />
      <line x1="28" y1="0" x2="28" y2="18" stroke="#f3efe7" stroke-width="1" />
      <line x1="36" y1="0" x2="36" y2="18" stroke="#f3efe7" stroke-width="2.5" />
      <line x1="48" y1="0" x2="48" y2="18" stroke="#f3efe7" stroke-width="5" />
      <line x1="62" y1="0" x2="62" y2="18" stroke="#f3efe7" stroke-width="1.5" />
      <line x1="75" y1="0" x2="75" y2="18" stroke="#f3efe7" stroke-width="3" />
      <line x1="90" y1="0" x2="90" y2="18" stroke="#f3efe7" stroke-width="4" />
      <line x1="105" y1="0" x2="105" y2="18" stroke="#f3efe7" stroke-width="2" />
      <line x1="120" y1="0" x2="120" y2="18" stroke="#f3efe7" stroke-width="3.5" />
      <line x1="130" y1="0" x2="130" y2="18" stroke="#f3efe7" stroke-width="1" />
    </g>
  </g>
"""

# 8. Ön Baskılı Ağır Kumaş Sweatshirt
sweat_front_art = """
  <g transform="translate(195, 180)">
    <!-- Luxury Gold & Anthracite Front Chest Crest -->
    <rect x="0" y="0" width="210" height="190" fill="#202225" stroke="#b29460" stroke-width="2" rx="8" />
    <circle cx="105" cy="70" r="42" fill="#49372e" stroke="#d4ba88" stroke-width="2" />
    <text x="105" y="78" font-family="'Cormorant Garamond', serif" font-size="28" font-weight="700" fill="#d4ba88" text-anchor="middle">N</text>
    
    <text x="105" y="132" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">NİZAMLAR BASKI</text>
    <text x="105" y="150" font-family="'JetBrains Mono', monospace" font-size="8" fill="#b29460" text-anchor="middle" letter-spacing="1.5">ATELIER DU TEXTILE</text>
    <line x1="30" y1="162" x2="180" y2="162" stroke="#b29460" stroke-width="1" />
    <text x="105" y="176" font-family="'JetBrains Mono', monospace" font-size="7" fill="#9e9587" text-anchor="middle">ISTANBUL // 380 GSM COMBED</text>
  </g>
"""

# 9. Grafik Desenli Hoodie (Streetwear Hoodie)
hoodie_graphic_art = """
  <g transform="translate(200, 240)">
    <!-- Heavy Center Chest Artwork above Kangaroo Pocket -->
    <rect x="0" y="0" width="200" height="150" fill="#1d1e21" stroke="#ff4757" stroke-width="2" rx="4" />
    
    <text x="100" y="40" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">STREET LAB</text>
    <line x1="20" y1="52" x2="180" y2="52" stroke="#ff4757" stroke-width="1.5" />
    
    <!-- Neon Accent Geometry -->
    <polygon points="100,65 130,115 70,115" fill="#ffa502" />
    <circle cx="100" cy="98" r="8" fill="#222325" />
    
    <text x="100" y="136" font-family="'JetBrains Mono', monospace" font-size="8" fill="#f3efe7" text-anchor="middle" letter-spacing="1.5">DTF HIGH ACCURACY</text>
  </g>

  <!-- Left Sleeve Typographic Print -->
  <g transform="translate(100, 240) rotate(-65)">
    <text x="0" y="0" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" fill="#b29460" letter-spacing="3">NİZAMLAR ENGINEERING</text>
  </g>
"""

# 10. Ton Sür Ton Baskılı Sweatshirt (Tone-on-Tone Gloss Puff)
sweat_ton_sur_ton_art = """
  <g transform="translate(195, 200)">
    <!-- Gloss / Puff Clear Varnish on Matte Fabric -->
    <rect x="0" y="0" width="210" height="150" fill="#1b1c1e" stroke="rgba(255,255,255,0.06)" stroke-width="1" rx="6" />
    
    <!-- Embossed / Tone-on-tone Graphic with Subtle Highlight -->
    <text x="105" y="65" font-family="'Plus Jakarta Sans', sans-serif" font-size="26" font-weight="800" fill="#2c2e33" text-anchor="middle" letter-spacing="4">MONOCHROME</text>
    <text x="105" y="64" font-family="'Plus Jakarta Sans', sans-serif" font-size="26" font-weight="800" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1" text-anchor="middle" letter-spacing="4">MONOCHROME</text>
    
    <text x="105" y="95" font-family="'JetBrains Mono', monospace" font-size="9" fill="#3a3c42" text-anchor="middle" letter-spacing="3">TONE-ON-TONE PUFF INK</text>
    <text x="105" y="94" font-family="'JetBrains Mono', monospace" font-size="9" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" text-anchor="middle" letter-spacing="3">TONE-ON-TONE PUFF INK</text>

    <line x1="30" y1="115" x2="180" y2="115" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
    <text x="105" y="132" font-family="'JetBrains Mono', monospace" font-size="7.5" fill="#555862" text-anchor="middle">SUBTLE LUXURY TACTILE EMBOSS</text>
  </g>
"""

# Blank Sweatshirt for Comparison
sweat_blank_art = "<!-- Blank Sweatshirt - Raw combed fleece -->"

with open(os.path.join(PRODUCTS_DIR, "sweat-oversize-back.svg"), "w") as f:
    f.write(make_sweat_svg("brownGrad", sweat_back_art, is_hoodie=False, seam_color="rgba(255,255,255,0.08)"))

with open(os.path.join(PRODUCTS_DIR, "sweat-front-artwork.svg"), "w") as f:
    f.write(make_sweat_svg("creamGrad", sweat_front_art, is_hoodie=False, seam_color="rgba(0,0,0,0.12)"))

with open(os.path.join(PRODUCTS_DIR, "hoodie-graphic-streetwear.svg"), "w") as f:
    f.write(make_sweat_svg("anthraciteGrad", hoodie_graphic_art, is_hoodie=True))

with open(os.path.join(PRODUCTS_DIR, "sweat-ton-sur-ton.svg"), "w") as f:
    f.write(make_sweat_svg("anthraciteGrad", sweat_ton_sur_ton_art, is_hoodie=False))

with open(os.path.join(PRODUCTS_DIR, "sweat-blank-fleece.svg"), "w") as f:
    f.write(make_sweat_svg("anthraciteGrad", sweat_blank_art, is_hoodie=False))


# ==============================================================================
# 3. PRODUCTS: PANTS & JOGGERS
# ==============================================================================

def make_pants_svg(color_grad="anthraciteGrad", artwork="", seam_color="rgba(255,255,255,0.08)"):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">
  {COMMON_DEFS}
  
  <rect width="600" height="680" fill="#18191b" rx="16" />
  <radialGradient id="pantsLight" cx="50%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#2c2d30" stop-opacity="0.7" />
    <stop offset="100%" stop-color="#121314" stop-opacity="0.95" />
  </radialGradient>
  <rect width="600" height="680" fill="url(#pantsLight)" rx="16" />
  <ellipse cx="300" cy="650" rx="220" ry="18" fill="#080809" opacity="0.7" filter="blur(8px)" />

  <!-- Pants / Joggers Silhouette -->
  <g id="pantsBody">
    <!-- Waistband with Drawstrings -->
    <rect x="200" y="60" width="200" height="35" rx="4" fill="#141516" stroke="{seam_color}" stroke-width="1.5" />
    <line x1="200" y1="78" x2="400" y2="78" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,2" />
    
    <!-- Drawstring -->
    <path d="M 285 85 C 280 120 270 145 275 165" fill="none" stroke="#ded9cf" stroke-width="2.5" stroke-linecap="round" />
    <rect x="272" y="165" width="5" height="12" rx="1.5" fill="#b29460" />
    <path d="M 315 85 C 320 120 330 145 325 165" fill="none" stroke="#ded9cf" stroke-width="2.5" stroke-linecap="round" />
    <rect x="323" y="165" width="5" height="12" rx="1.5" fill="#b29460" />

    <!-- Legs Silhouette -->
    <!-- Left Leg -->
    <path d="M 200 95 L 180 320 L 210 610 L 270 610 L 285 300 L 300 240 L 300 95 Z" 
          fill="url(#{color_grad})" filter="url(#fleeceTexture)" />
    <!-- Right Leg -->
    <path d="M 400 95 L 420 320 L 390 610 L 330 610 L 315 300 L 300 240 L 300 95 Z" 
          fill="url(#{color_grad})" filter="url(#fleeceTexture)" />

    <!-- Inseam & Pockets -->
    <path d="M 300 95 L 300 245" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" />
    <!-- Left Pocket -->
    <path d="M 205 110 Q 235 150 215 190" fill="none" stroke="{seam_color}" stroke-width="2" />
    <!-- Right Pocket -->
    <path d="M 395 110 Q 365 150 385 190" fill="none" stroke="{seam_color}" stroke-width="2" />

    <!-- Ribbed Ankle Cuffs -->
    <rect x="210" y="610" width="60" height="25" fill="#141516" stroke="{seam_color}" stroke-width="1.5" />
    <rect x="330" y="610" width="60" height="25" fill="#141516" stroke="{seam_color}" stroke-width="1.5" />

    <!-- Shading Folds -->
    <path d="M 240 200 Q 255 420 245 590" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="12" filter="blur(6px)" />
    <path d="M 360 200 Q 345 420 355 590" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="12" filter="blur(6px)" />
  </g>

  <!-- PRINTED ARTWORK LAYER -->
  <g id="pantsArtwork" filter="url(#inkRelief)">
    {artwork}
  </g>

  <g transform="translate(30, 30)">
    <rect width="145" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">340 GSM JOGGER</text>
  </g>
</svg>"""

# 11. Yan Paça Baskılı Eşofman (Vertical Leg Typography)
jogger_leg_print_art = """
  <!-- Left Leg Long Vertical Print -->
  <g transform="translate(195, 260) rotate(90)">
    <rect x="0" y="-22" width="280" height="26" fill="#1d1e21" rx="3" />
    <text x="140" y="-5" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="4">NİZAMLAR TECHNICAL TEXTILE</text>
    <line x1="0" y1="4" x2="280" y2="4" stroke="#b29460" stroke-width="1.5" />
  </g>
"""

# 12. Grafik Desenli Thigh Jogger (Upper Thigh Monogram)
jogger_thigh_art = """
  <g transform="translate(210, 160)">
    <!-- High-res Monogram & Coordinates Screenprint -->
    <circle cx="28" cy="28" r="24" fill="#202226" stroke="#b29460" stroke-width="1.8" />
    <text x="28" y="34" font-family="'Cormorant Garamond', serif" font-size="20" font-weight="700" fill="#d4ba88" text-anchor="middle">NZM</text>
    <text x="28" y="64" font-family="'JetBrains Mono', monospace" font-size="7" fill="#f3efe7" font-weight="700" text-anchor="middle" letter-spacing="1">SERIES 26</text>
    <text x="28" y="74" font-family="'JetBrains Mono', monospace" font-size="5.5" fill="#b29460" text-anchor="middle">OEKO-TEX CERT</text>
  </g>
"""

# 13. Büyük Tipografik Baskılı Eşofman
sweatpants_bold_art = """
  <g transform="translate(365, 250) rotate(90)">
    <text x="140" y="0" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="900" fill="#b29460" text-anchor="middle" letter-spacing="5">INDUSTRIAL</text>
    <text x="140" y="16" font-family="'JetBrains Mono', monospace" font-size="9" fill="#f3efe7" text-anchor="middle" letter-spacing="2">HEAVY ATHLETIC WEAR</text>
  </g>
"""

# Blank Pants for Comparison
pants_blank_art = "<!-- Blank Jogger -->"

with open(os.path.join(PRODUCTS_DIR, "jogger-side-leg.svg"), "w") as f:
    f.write(make_pants_svg("anthraciteGrad", jogger_leg_print_art))

with open(os.path.join(PRODUCTS_DIR, "jogger-graphic-thigh.svg"), "w") as f:
    f.write(make_pants_svg("creamGrad", jogger_thigh_art, seam_color="rgba(0,0,0,0.12)"))

with open(os.path.join(PRODUCTS_DIR, "sweatpants-bold-typo.svg"), "w") as f:
    f.write(make_pants_svg("brownGrad", sweatpants_bold_art))

with open(os.path.join(PRODUCTS_DIR, "jogger-blank.svg"), "w") as f:
    f.write(make_pants_svg("anthraciteGrad", pants_blank_art))


# ==============================================================================
# 4. OTHER TEXTILE PRODUCTS (Tote Bag, Sports Jersey, Workwear, Shorts, Jacket)
# ==============================================================================

# 14. Baskılı Bez Çanta (Heavy Canvas Tote Bag)
tote_bag_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">
  {COMMON_DEFS}
  <rect width="600" height="680" fill="#18191b" rx="16" />
  <ellipse cx="300" cy="620" rx="200" ry="20" fill="#090a0b" opacity="0.6" filter="blur(8px)" />

  <!-- Tote Handles -->
  <path d="M 230 200 C 230 60 370 60 370 200" fill="none" stroke="#d5cebf" stroke-width="18" stroke-linecap="round" />
  <path d="M 230 200 C 230 60 370 60 370 200" fill="none" stroke="#222325" stroke-width="1" stroke-dasharray="3,3" />

  <!-- Tote Body (Unbleached Raw Canvas) -->
  <path d="M 160 200 L 440 200 L 420 580 L 180 580 Z" fill="url(#creamGrad)" filter="url(#fabricTexture)" />
  <line x1="160" y1="210" x2="440" y2="210" stroke="rgba(0,0,0,0.15)" stroke-width="2" />
  <line x1="160" y1="214" x2="440" y2="214" stroke="rgba(0,0,0,0.1)" stroke-width="1" stroke-dasharray="4,2" />

  <!-- Handle Stitches Box -->
  <rect x="220" y="210" width="22" height="28" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
  <line x1="220" y1="210" x2="242" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />
  <line x1="242" y1="210" x2="220" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />

  <rect x="360" y="210" width="22" height="28" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
  <line x1="360" y1="210" x2="382" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />
  <line x1="382" y1="210" x2="360" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="1" />

  <!-- PRINT ON TOTE BAG -->
  <g transform="translate(200, 260)" filter="url(#inkRelief)">
    <rect x="0" y="0" width="200" height="240" fill="#222325" rx="4" />
    <circle cx="100" cy="90" r="50" fill="none" stroke="#b29460" stroke-width="2.5" />
    <path d="M 70 90 L 130 90 M 100 60 L 100 120" stroke="#f3efe7" stroke-width="2" />
    <text x="100" y="165" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">ORGANIC CANVASES</text>
    <text x="100" y="182" font-family="'JetBrains Mono', monospace" font-size="8" fill="#b29460" text-anchor="middle" letter-spacing="2">SERIGRAPHIE D'ART</text>
    <line x1="25" y1="195" x2="175" y2="195" stroke="#b29460" stroke-width="1" />
    <text x="100" y="212" font-family="'JetBrains Mono', monospace" font-size="7" fill="#9e9587" text-anchor="middle">320 GSM RAW HEAVY COTTON</text>
  </g>

  <g transform="translate(30, 30)">
    <rect width="135" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">CANVAS TOTE</text>
  </g>
</svg>"""

with open(os.path.join(PRODUCTS_DIR, "tote-bag-canvas.svg"), "w") as f:
    f.write(tote_bag_svg)

# 15. Baskılı Spor Forması (Performance Athletic Jersey)
jersey_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">
  {COMMON_DEFS}
  <rect width="600" height="680" fill="#18191b" rx="16" />
  <ellipse cx="300" cy="635" rx="210" ry="22" fill="#080809" opacity="0.65" filter="blur(8px)" />

  <!-- Athletic Jersey Body with Side Mesh Inserts -->
  <g id="jerseyBody">
    <path d="M 235 90 L 115 175 L 145 255 L 195 225 L 190 590 L 410 590 L 405 225 L 455 255 L 485 175 L 365 90 Z" 
          fill="#1c2024" />

    <!-- Dynamic Athletic Sublimation Stripes -->
    <path d="M 190 230 L 230 590 L 255 590 L 210 230 Z" fill="#ff4757" opacity="0.85" />
    <path d="M 410 230 L 370 590 L 345 590 L 390 230 Z" fill="#b29460" opacity="0.85" />

    <!-- V-Neck Collar with Contrast Band -->
    <polygon points="235,90 300,160 365,90 300,105" fill="#b29460" />
    <polygon points="245,90 300,150 355,90 300,108" fill="#1c2024" />

    <!-- Breathable Mesh Texture lines -->
    <line x1="195" y1="300" x2="195" y2="520" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="2,2" />
    <line x1="405" y1="300" x2="405" y2="520" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="2,2" />
  </g>

  <!-- PRINT ON ATHLETIC JERSEY -->
  <g transform="translate(200, 180)" filter="url(#inkRelief)">
    <!-- Team Crest -->
    <polygon points="100,20 135,45 135,90 100,115 65,90 65,45" fill="#b29460" stroke="#f3efe7" stroke-width="2" />
    <text x="100" y="75" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="900" fill="#1c2024" text-anchor="middle">NZ</text>

    <!-- Sponsor Print -->
    <rect x="15" y="140" width="170" height="40" fill="#222325" stroke="#f3efe7" stroke-width="1.5" rx="4" />
    <text x="100" y="165" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="800" fill="#f3efe7" text-anchor="middle" letter-spacing="3">PERFORMANCE</text>

    <!-- Jersey Number on Bottom -->
    <text x="100" y="270" font-family="'Plus Jakarta Sans', sans-serif" font-size="82" font-weight="900" fill="#f3efe7" text-anchor="middle" letter-spacing="2">10</text>
    <text x="100" y="268" font-family="'Plus Jakarta Sans', sans-serif" font-size="82" font-weight="900" fill="none" stroke="#b29460" stroke-width="2" text-anchor="middle" letter-spacing="2">10</text>
  </g>

  <g transform="translate(30, 30)">
    <rect width="145" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">DRY-FIT JERSEY</text>
  </g>
</svg>"""

with open(os.path.join(PRODUCTS_DIR, "sports-jersey.svg"), "w") as f:
    f.write(jersey_svg)

# 16. Baskılı Endüstriyel İş Kıyafeti (Reflective Workwear Vest / Jacket)
workwear_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680" width="100%" height="100%">
  {COMMON_DEFS}
  <rect width="600" height="680" fill="#18191b" rx="16" />
  <ellipse cx="300" cy="635" rx="210" ry="22" fill="#080809" opacity="0.65" filter="blur(8px)" />

  <!-- Heavy Duty Work Vest Body -->
  <g id="workwearBody">
    <path d="M 235 90 L 140 160 L 175 240 L 190 220 L 190 590 L 410 590 L 410 220 L 425 240 L 460 160 L 365 90 Z" 
          fill="#25272a" filter="url(#fabricTexture)" />

    <!-- Center Heavy Duty Metal Zipper -->
    <line x1="300" y1="120" x2="300" y2="590" stroke="#71757d" stroke-width="6" />
    <line x1="300" y1="120" x2="300" y2="590" stroke="#161718" stroke-width="2" stroke-dasharray="4,2" />

    <!-- High-Vis 3M Reflective Bands (Silver Neon) -->
    <rect x="190" y="320" width="220" height="28" fill="#e4e7eb" opacity="0.9" />
    <line x1="190" y1="334" x2="410" y2="334" stroke="#ff8e3c" stroke-width="4" />

    <rect x="190" y="480" width="220" height="28" fill="#e4e7eb" opacity="0.9" />
    <line x1="190" y1="494" x2="410" y2="494" stroke="#ff8e3c" stroke-width="4" />

    <!-- Reinforced Cordura Shoulder Panels -->
    <path d="M 235 90 L 140 160 L 190 190 L 260 130 Z" fill="#1a1b1d" />
    <path d="M 365 90 L 460 160 L 410 190 L 340 130 Z" fill="#1a1b1d" />
  </g>

  <!-- PRINT ON WORKWEAR -->
  <g transform="translate(205, 180)" filter="url(#inkRelief)">
    <!-- Right Chest ID Badge -->
    <rect x="0" y="0" width="80" height="45" fill="#18191a" stroke="#b29460" stroke-width="1.5" rx="3" />
    <text x="40" y="18" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="800" fill="#f3efe7" text-anchor="middle">NİZAMLAR</text>
    <text x="40" y="30" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="#ff8e3c" text-anchor="middle">INDUSTRIAL</text>
    <text x="40" y="40" font-family="'JetBrains Mono', monospace" font-size="5.5" fill="#ded9cf" text-anchor="middle">CREW #08</text>
  </g>

  <g transform="translate(200, 360)" filter="url(#inkRelief)">
    <!-- Huge Back Identification Print (when displayed back or front) -->
    <rect x="0" y="0" width="200" height="75" fill="#161718" stroke="#ff8e3c" stroke-width="1.5" rx="4" />
    <text x="100" y="30" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="900" fill="#f3efe7" text-anchor="middle" letter-spacing="3">SAFETY & PRINT</text>
    <text x="100" y="48" font-family="'JetBrains Mono', monospace" font-size="8" fill="#b29460" text-anchor="middle" letter-spacing="2">INDUSTRIAL GRADE WORKWEAR</text>
    <text x="100" y="62" font-family="'JetBrains Mono', monospace" font-size="6.5" fill="#ded9cf" text-anchor="middle">HIGH-VIS // EN ISO 20471 COMPLIANT</text>
  </g>

  <g transform="translate(30, 30)">
    <rect width="145" height="26" rx="4" fill="rgba(22,23,24,0.85)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#ff8e3c" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">WORKWEAR VEST</text>
  </g>
</svg>"""

with open(os.path.join(PRODUCTS_DIR, "workwear-jacket.svg"), "w") as f:
    f.write(workwear_svg)


# ==============================================================================
# 5. MACHINERY SCHEMATICS & PRODUCTION ANIMATIONS
# ==============================================================================

# A. DTF Printer Machine Station (Detailed Industrial Schematic)
dtf_machine_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" height="100%">
  {COMMON_DEFS}
  
  <rect width="800" height="520" fill="#18191a" rx="16" />
  <rect x="2" y="2" width="796" height="516" fill="none" stroke="rgba(178,148,96,0.25)" stroke-width="1.5" rx="15" />

  <!-- Studio Ambient Lighting Glow -->
  <radialGradient id="machGlow" cx="50%" cy="40%" r="60%">
    <stop offset="0%" stop-color="#2d3035" stop-opacity="0.8" />
    <stop offset="100%" stop-color="#141516" stop-opacity="0.95" />
  </radialGradient>
  <rect width="800" height="520" fill="url(#machGlow)" rx="16" />

  <!-- Machine Base Stand & Heavy Cast Frame -->
  <rect x="100" y="380" width="600" height="30" fill="#222325" stroke="#383a3e" stroke-width="2" rx="4" />
  <!-- Heavy Leg Columns -->
  <rect x="140" y="410" width="45" height="70" fill="#1b1c1e" stroke="#333" stroke-width="1.5" />
  <rect x="615" y="410" width="45" height="70" fill="#1b1c1e" stroke="#333" stroke-width="1.5" />
  <rect x="120" y="475" width="85" height="15" rx="3" fill="#121314" />
  <rect x="595" y="475" width="85" height="15" rx="3" fill="#121314" />

  <!-- Main Chassis / Printer Housing -->
  <rect x="80" y="160" width="640" height="220" rx="8" fill="#26272b" stroke="#3f4247" stroke-width="2" />
  
  <!-- Viewing Window (Smoked Acrylic) -->
  <rect x="120" y="190" width="560" height="120" rx="6" fill="#111213" stroke="#b29460" stroke-width="1.5" />
  
  <!-- Internal LED Illumination Glow (Golden Amber) -->
  <rect x="125" y="195" width="550" height="110" fill="rgba(178,148,96,0.08)" />

  <!-- PET Roll Feeder (Back Section) -->
  <rect x="60" y="220" width="40" height="130" rx="4" fill="#3a3c42" stroke="#555" />
  <!-- PET Roll Cylinder -->
  <ellipse cx="80" cy="285" rx="14" ry="45" fill="#52555e" stroke="#71757d" />
  <!-- Film Sheet Feeding into Carriage Platen -->
  <path d="M 80 270 L 150 270 L 650 270 L 720 270" stroke="rgba(255,255,255,0.7)" stroke-width="4" stroke-linecap="round" />

  <!-- Precision Linear Guide Rail -->
  <rect x="135" y="210" width="530" height="12" fill="#8e929b" stroke="#555" rx="2" />
  <line x1="135" y1="216" x2="665" y2="216" stroke="#fff" stroke-width="1" opacity="0.6" />

  <!-- Moving Dual-Head Print Carriage Unit -->
  <g id="dtfPrintCarriage" transform="translate(320, 202)">
    <rect x="0" y="0" width="110" height="75" rx="4" fill="#1b1c1e" stroke="#b29460" stroke-width="2" />
    <rect x="10" y="10" width="90" height="25" fill="#282a2f" />
    <circle cx="28" cy="22" r="5" fill="#00d2ff" />
    <circle cx="46" cy="22" r="5" fill="#ff4757" />
    <circle cx="64" cy="22" r="5" fill="#ffa502" />
    <circle cx="82" cy="22" r="5" fill="#ffffff" />
    
    <!-- Micro Piezo Nozzle Head -->
    <rect x="25" y="60" width="60" height="12" fill="#b29460" />
    <!-- Spray Jets (Simulated droplets) -->
    <line x1="35" y1="72" x2="35" y2="82" stroke="#00d2ff" stroke-width="1.5" stroke-dasharray="2,2" />
    <line x1="45" y1="72" x2="45" y2="82" stroke="#ff4757" stroke-width="1.5" stroke-dasharray="2,2" />
    <line x1="55" y1="72" x2="55" y2="82" stroke="#ffa502" stroke-width="1.5" stroke-dasharray="2,2" />
    <line x1="65" y1="72" x2="65" y2="82" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2,2" />
    <line x1="75" y1="72" x2="75" y2="82" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2,2" />
  </g>

  <!-- Printed Film Emergence Section with Pattern Developing -->
  <g transform="translate(180, 265)">
    <rect x="0" y="0" width="130" height="65" fill="#1b1c1e" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
    <circle cx="45" cy="32" r="20" fill="url(#vibrantDtfGrad)" />
    <text x="95" y="36" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="800" fill="#f3efe7">1440 DPI</text>
  </g>

  <!-- Digital Control Panel / Touchscreen -->
  <g transform="translate(650, 110)">
    <rect x="0" y="0" width="115" height="75" rx="6" fill="#121314" stroke="#b29460" stroke-width="1.5" />
    <!-- Touchscreen Display -->
    <rect x="8" y="8" width="99" height="59" fill="#1a1c20" rx="3" />
    <text x="14" y="24" font-family="'JetBrains Mono', monospace" font-size="7.5" fill="#00d2ff" font-weight="700">STATUS: ACTIVE</text>
    <text x="14" y="38" font-family="'JetBrains Mono', monospace" font-size="7" fill="#f3efe7">SPEED: 18 m²/h</text>
    <text x="14" y="50" font-family="'JetBrains Mono', monospace" font-size="7" fill="#b29460">HEAD TEMP: 32°C</text>
    <circle cx="95" cy="22" r="3.5" fill="#2ed573" />
  </g>

  <!-- Header Machine Brand Plaque -->
  <g transform="translate(110, 120)">
    <rect x="0" y="0" width="260" height="30" rx="4" fill="#161718" stroke="#383a3e" stroke-width="1" />
    <circle cx="16" cy="15" r="4" fill="#b29460" />
    <text x="30" y="19" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#f3efe7" letter-spacing="1">NİZAMLAR INDUSTRIAL DTF-600</text>
  </g>

  <g transform="translate(40, 40)">
    <rect width="180" height="26" rx="4" fill="rgba(22,23,24,0.9)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">DİJİTAL DTF BASKI HATTI</text>
  </g>
</svg>"""

with open(os.path.join(MACHINES_DIR, "dtf-printer-station.svg"), "w") as f:
    f.write(dtf_machine_svg)

# B. Screen Printing Carousel Machine (12-Arm Octopus Schematic)
screen_press_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" height="100%">
  {COMMON_DEFS}
  
  <rect width="800" height="520" fill="#18191a" rx="16" />
  <rect x="2" y="2" width="796" height="516" fill="none" stroke="rgba(178,148,96,0.25)" stroke-width="1.5" rx="15" />

  <radialGradient id="octGlow" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#2c2f35" stop-opacity="0.8" />
    <stop offset="100%" stop-color="#141516" stop-opacity="0.95" />
  </radialGradient>
  <rect width="800" height="520" fill="url(#octGlow)" rx="16" />

  <!-- Center Rotary Hub & Heavy Cast Iron Base -->
  <circle cx="400" cy="260" r="85" fill="#222325" stroke="#b29460" stroke-width="3" />
  <circle cx="400" cy="260" r="55" fill="#161718" stroke="#383a3e" stroke-width="2" />
  <circle cx="400" cy="260" r="25" fill="#b29460" />

  <!-- 8 Radial Print Arms & Pallet Beds -->
  <!-- Pallet 1: North (Up) -->
  <g transform="translate(400, 260) rotate(0)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <!-- Screen Frame with Mesh -->
    <rect x="-65" y="-235" width="130" height="95" rx="4" fill="#1c1d20" stroke="#d4ba88" stroke-width="2" />
    <rect x="-55" y="-225" width="110" height="75" fill="rgba(243,239,231,0.2)" stroke="#b29460" stroke-width="0.8" stroke-dasharray="3,3" />
    <!-- Squeegee (Rakle) Blade Assembly -->
    <rect x="-45" y="-195" width="90" height="12" fill="#e84118" rx="2" />
    <rect x="-35" y="-208" width="70" height="14" fill="#222" stroke="#888" stroke-width="1" />
  </g>

  <!-- Pallet 2: North-East (45 deg) -->
  <g transform="translate(400, 260) rotate(45)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <rect x="-65" y="-235" width="130" height="95" rx="4" fill="#1c1d20" stroke="#71757d" stroke-width="2" />
    <rect x="-55" y="-225" width="110" height="75" fill="rgba(0,210,255,0.15)" />
  </g>

  <!-- Pallet 3: East (90 deg) -->
  <g transform="translate(400, 260) rotate(90)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <rect x="-65" y="-235" width="130" height="95" rx="4" fill="#1c1d20" stroke="#b29460" stroke-width="2" />
    <!-- T-Shirt Platen Bed -->
    <path d="M -45 -225 L 45 -225 L 40 -150 L -40 -150 Z" fill="#222325" stroke="#b29460" stroke-width="1.5" />
  </g>

  <!-- Pallet 4: South-East (135 deg) -->
  <g transform="translate(400, 260) rotate(135)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <rect x="-65" y="-235" width="130" height="95" rx="4" fill="#1c1d20" stroke="#71757d" stroke-width="2" />
  </g>

  <!-- Pallet 5: South (180 deg) -->
  <g transform="translate(400, 260) rotate(180)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <!-- Finished Printed Shirt on South Platen -->
    <path d="M -50 -225 L 50 -225 L 45 -145 L -45 -145 Z" fill="#161718" stroke="#383a3e" stroke-width="1.5" />
    <circle cx="0" cy="-185" r="22" fill="#b29460" />
    <text x="0" y="-180" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="800" fill="#161718" text-anchor="middle">NZM</text>
  </g>

  <!-- Pallet 6: South-West (225 deg) -->
  <g transform="translate(400, 260) rotate(225)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <!-- Flash Cure Heating Unit -->
    <rect x="-70" y="-240" width="140" height="105" rx="6" fill="#26272b" stroke="#ff4757" stroke-width="2" />
    <rect x="-60" y="-230" width="120" height="85" fill="rgba(255,71,87,0.25)" />
    <text x="0" y="-185" font-family="'JetBrains Mono', monospace" font-size="9" fill="#ff4757" font-weight="700" text-anchor="middle">FLASH CURE 160°C</text>
  </g>

  <!-- Pallet 7: West (270 deg) -->
  <g transform="translate(400, 260) rotate(270)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <rect x="-65" y="-235" width="130" height="95" rx="4" fill="#1c1d20" stroke="#71757d" stroke-width="2" />
  </g>

  <!-- Pallet 8: North-West (315 deg) -->
  <g transform="translate(400, 260) rotate(315)">
    <rect x="-18" y="-230" width="36" height="150" fill="#2b2c30" stroke="#444" stroke-width="1.5" />
    <rect x="-65" y="-235" width="130" height="95" rx="4" fill="#1c1d20" stroke="#b29460" stroke-width="2" />
  </g>

  <!-- Machine Overlay Spec Plaque -->
  <g transform="translate(560, 430)">
    <rect width="200" height="60" rx="4" fill="rgba(22,23,24,0.9)" stroke="#b29460" stroke-width="1" />
    <text x="15" y="24" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#f3efe7">12 RENK AHTAPOT</text>
    <text x="15" y="42" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#b29460">PNÖMATİK RAKLE KONTROL</text>
  </g>

  <g transform="translate(40, 40)">
    <rect width="210" height="26" rx="4" fill="rgba(22,23,24,0.9)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">OTOMATİK SERİGRAFİ HATTI</text>
  </g>
</svg>"""

with open(os.path.join(MACHINES_DIR, "screen-print-carousel.svg"), "w") as f:
    f.write(screen_press_svg)

# C. Pneumatic Heat Press Station (Clamshell / Swing-Away)
heat_press_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" height="100%">
  {COMMON_DEFS}
  
  <rect width="800" height="520" fill="#18191a" rx="16" />
  <rect x="2" y="2" width="796" height="516" fill="none" stroke="rgba(178,148,96,0.25)" stroke-width="1.5" rx="15" />

  <radialGradient id="pressGlow" cx="50%" cy="40%" r="55%">
    <stop offset="0%" stop-color="#2f3137" stop-opacity="0.8" />
    <stop offset="100%" stop-color="#141516" stop-opacity="0.95" />
  </radialGradient>
  <rect width="800" height="520" fill="url(#pressGlow)" rx="16" />

  <!-- Heavy Workbench Stand -->
  <rect x="120" y="380" width="560" height="25" fill="#25262a" stroke="#444" stroke-width="2" rx="3" />
  <rect x="160" y="405" width="40" height="75" fill="#1a1b1d" />
  <rect x="600" y="405" width="40" height="75" fill="#1a1b1d" />

  <!-- Lower Platen Base (Garment Table with Silicone Mat) -->
  <rect x="220" y="330" width="360" height="40" rx="4" fill="#222325" stroke="#b29460" stroke-width="2" />
  <!-- Blue Silicone Heat Sponge -->
  <rect x="235" y="322" width="330" height="12" rx="2" fill="#2e86de" stroke="#54a0ff" stroke-width="1" />
  
  <!-- T-Shirt on Bottom Platen -->
  <path d="M 270 322 L 530 322 L 515 365 L 285 365 Z" fill="#161718" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
  <!-- Transfer Film on Chest -->
  <rect x="360" y="318" width="80" height="4" fill="#fff" opacity="0.8" />

  <!-- Upper Heated Platen (Teflon Coated 160°C Heat Surface) -->
  <g transform="translate(0, -30)">
    <rect x="230" y="220" width="340" height="35" rx="4" fill="#b29460" stroke="#f3efe7" stroke-width="2" />
    <rect x="240" y="250" width="320" height="8" fill="#e84118" filter="blur(1px)" />
    <!-- Heat Thermal Radiance Wave -->
    <path d="M 260 265 Q 280 275 300 265 Q 320 255 340 265 Q 360 275 380 265 Q 400 255 420 265 Q 440 275 460 265 Q 480 255 500 265 Q 520 275 540 265" 
          fill="none" stroke="rgba(232,65,24,0.6)" stroke-width="2" />
  </g>

  <!-- Heavy Pneumatic Twin Cylinders -->
  <rect x="375" y="110" width="50" height="90" fill="#222325" stroke="#71757d" stroke-width="2" rx="4" />
  <!-- Chrome Piston Shaft -->
  <rect x="390" y="195" width="20" height="40" fill="#ced6e0" stroke="#999" />
  
  <!-- Air Pressure Gauge -->
  <circle cx="400" cy="85" r="24" fill="#161718" stroke="#b29460" stroke-width="2" />
  <circle cx="400" cy="85" r="20" fill="#f3efe7" />
  <line x1="400" y1="85" x2="412" y2="76" stroke="#e84118" stroke-width="2.5" />
  <text x="400" y="100" font-family="'JetBrains Mono', monospace" font-size="6" fill="#161718" text-anchor="middle">5.5 BAR</text>

  <!-- Digital PID Controller & Auto-Timer Screen -->
  <g transform="translate(600, 150)">
    <rect x="0" y="0" width="140" height="90" rx="6" fill="#161718" stroke="#b29460" stroke-width="2" />
    <rect x="10" y="10" width="120" height="70" fill="#1b1c20" rx="4" />
    <text x="18" y="28" font-family="'JetBrains Mono', monospace" font-size="8" fill="#e84118" font-weight="700">TEMP: 160°C</text>
    <text x="18" y="45" font-family="'JetBrains Mono', monospace" font-size="8" fill="#2ed573" font-weight="700">TIMER: 15 SEC</text>
    <text x="18" y="62" font-family="'JetBrains Mono', monospace" font-size="8" fill="#00d2ff">PRES: PNÖMATİK</text>
    <circle cx="118" cy="25" r="4" fill="#2ed573" />
  </g>

  <g transform="translate(40, 40)">
    <rect width="210" height="26" rx="4" fill="rgba(22,23,24,0.9)" stroke="rgba(178,148,96,0.3)" stroke-width="1" />
    <circle cx="14" cy="13" r="3.5" fill="#b29460" />
    <text x="26" y="17" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#f3efe7" font-weight="600" letter-spacing="0.5">PNÖMATİK ISI TRANSFER PRESİ</text>
  </g>
</svg>"""

with open(os.path.join(MACHINES_DIR, "heat-press-station.svg"), "w") as f:
    f.write(heat_press_svg)

print("All realistic printed garments and industrial machine assets successfully generated!")
