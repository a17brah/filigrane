#!/usr/bin/env python3
"""
Local Filigrane CLI - Watermarking tool for sensitive documents (Passports, IDs, Payslips).
100% Offline and Local. Flattened raster output prevents watermark removal.
"""

import argparse
import math
import os
import sys
from datetime import datetime
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import pymupdf


def get_default_font(size: int):
    """Attempt to load a clean sans-serif system font or fallback."""
    font_names = [
        "arial.ttf",
        "Arial.ttf",
        "calibri.ttf",
        "segoeui.ttf",
        "DejaVuSans.ttf",
        "Helvetica.ttf",
        "FreeSans.ttf",
    ]
    for name in font_names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    try:
        # Try windows fonts directory explicitly if running on Windows
        win_fonts = Path(os.environ.get("WINDIR", "C:\\Windows")) / "Fonts"
        for name in font_names:
            fp = win_fonts / name
            if fp.exists():
                return ImageFont.truetype(str(fp), size)
    except Exception:
        pass
    return ImageFont.load_default()


def apply_watermark_to_image(
    base_image: Image.Image,
    text: str,
    opacity: float = 0.25,
    angle: float = -32.0,
    font_size: int = None,
    color: tuple = (40, 40, 50),
    spacing_factor: float = 2.8,
) -> Image.Image:
    """
    Renders a repeated diagonal watermark pattern across the entire image
    and composites it directly into the pixels (raster flattening).
    """
    w, h = base_image.size
    diag = int(math.hypot(w, h))

    # Auto font size based on image diagonal if not specified
    if font_size is None:
        font_size = max(24, int(diag * 0.024))

    font = get_default_font(font_size)

    # Clean watermark unit string
    unit_text = f"{text.strip()}   •   "

    # Measure unit text dimensions
    dummy_img = Image.new("RGBA", (1, 1))
    dummy_draw = ImageDraw.Draw(dummy_img)
    bbox = dummy_draw.textbbox((0, 0), unit_text, font=font)
    unit_w = bbox[2] - bbox[0]
    unit_h = bbox[3] - bbox[1]

    # Row and column step
    col_step = unit_w
    row_step = int(unit_h * spacing_factor)

    # Create overlay for the rotated grid
    overlay_size = diag * 2
    overlay = Image.new("RGBA", (overlay_size, overlay_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    alpha = int(max(0.0, min(1.0, opacity)) * 255)
    fill_color = (*color[:3], alpha)

    # Fill overlay with alternating staggered rows
    y = 0
    row_idx = 0
    while y < overlay_size:
        x_offset = (col_step // 2) if (row_idx % 2 == 1) else 0
        x = -col_step + x_offset
        while x < overlay_size + col_step:
            draw.text((x, y), unit_text, font=font, fill=fill_color)
            x += col_step
        y += row_step
        row_idx += 1

    # Rotate overlay
    rotated_overlay = overlay.rotate(angle, resample=Image.BICUBIC, expand=False)

    # Crop rotated overlay to center over base_image
    crop_x = (overlay_size - w) // 2
    crop_y = (overlay_size - h) // 2
    cropped_watermark = rotated_overlay.crop((crop_x, crop_y, crop_x + w, crop_y + h))

    # Composite over base_image
    if base_image.mode != "RGBA":
        base_rgba = base_image.convert("RGBA")
    else:
        base_rgba = base_image.copy()

    composited = Image.alpha_composite(base_rgba, cropped_watermark)
    return composited.convert("RGB")


def watermark_file(
    input_path: str,
    output_path: str = None,
    text: str = "DOCUMENT EXCLUSIVEMENT DESTINÉ À LA LOCATION IMMOBILIÈRE",
    opacity: float = 0.25,
    angle: float = -32.0,
    dpi: int = 200,
    color: tuple = (40, 40, 50),
    font_size: int = None,
) -> str:
    """
    Process PDF or image file and output a flattened, watermarked PDF.
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if not output_path:
        output_path = str(input_file.with_name(f"{input_file.stem}_filigrane.pdf"))

    ext = input_file.suffix.lower()

    watermarked_images = []

    if ext == ".pdf":
        doc = pymupdf.open(str(input_file))
        print(f"[*] Processing PDF '{input_file.name}' with {len(doc)} page(s) at {dpi} DPI...")
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=dpi)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            wm_img = apply_watermark_to_image(
                img,
                text=text,
                opacity=opacity,
                angle=angle,
                font_size=font_size,
                color=color,
            )
            watermarked_images.append(wm_img)
            print(f"  [+] Page {i + 1}/{len(doc)} watermarked & rasterized.")
        doc.close()
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"]:
        print(f"[*] Processing image '{input_file.name}'...")
        img = Image.open(str(input_file)).convert("RGB")
        wm_img = apply_watermark_to_image(
            img,
            text=text,
            opacity=opacity,
            angle=angle,
            font_size=font_size,
            color=color,
        )
        watermarked_images.append(wm_img)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported: PDF, JPG, PNG, WEBP.")

    if not watermarked_images:
        raise RuntimeError("No pages were processed.")

    # Save as flattened PDF
    print(f"[*] Compiling flattened PDF to '{output_path}'...")
    first_img = watermarked_images[0]
    other_images = watermarked_images[1:] if len(watermarked_images) > 1 else []
    first_img.save(
        output_path,
        save_all=True,
        append_images=other_images,
        resolution=dpi,
        quality=90,
    )

    print(f"[OK] Success! Watermarked PDF created: {output_path}")
    print(f"    Notice: The document has been flattened into images to prevent watermark removal.")
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Filigrane Local - Sécurisez vos documents sensibles (Passeport, CNI, etc.) sans transfert de données."
    )
    parser.add_argument("input", help="Chemin du document source (PDF, JPG, PNG)")
    parser.add_argument(
        "-t",
        "--text",
        default="DOCUMENT DESTINÉ EXCLUSIVEMENT À LA LOCATION IMMOBILIÈRE",
        help="Texte du filigrane (ex: 'Copie réservée à l'agence X - Date')",
    )
    parser.add_argument("-o", "--output", help="Chemin du fichier PDF de sortie")
    parser.add_argument(
        "--opacity",
        type=float,
        default=0.25,
        help="Opacité du filigrane entre 0.0 et 1.0 (défaut: 0.25)",
    )
    parser.add_argument(
        "--angle",
        type=float,
        default=-32.0,
        help="Angle d'inclinaison en degrés (défaut: -32)",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=200,
        help="Résolution de rastérisation en DPI (défaut: 200 pour une haute netteté)",
    )
    parser.add_argument(
        "--date",
        action="store_true",
        help="Ajoute automatiquement la date du jour à la fin du texte",
    )

    args = parser.parse_args()

    wm_text = args.text
    if args.date:
        today_str = datetime.now().strftime("%d/%m/%Y")
        wm_text = f"{wm_text} - {today_str}"

    try:
        watermark_file(
            input_path=args.input,
            output_path=args.output,
            text=wm_text,
            opacity=args.opacity,
            angle=args.angle,
            dpi=args.dpi,
        )
    except Exception as e:
        print(f"[!] Erreur: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
