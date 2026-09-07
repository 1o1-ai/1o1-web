# Author: Yogabrata Mukhopadhyay
# Organization: Brahmexa
# Copyright (c) 2026 Brahmexa. All rights reserved.
"""Generate high-resolution MP4 video reel playing JSI offerings."""

import sys
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

YM_ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = YM_ROOT / "assets"
OUT_MP4 = ASSETS_DIR / "offerings-reel.mp4"

WIDTH, HEIGHT = 1280, 720
FPS = 30
SLIDE_DURATION = 3.0  # seconds per slide
FADE_DURATION = 0.5   # transition duration

FONT_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"

try:
    font_title = ImageFont.truetype(FONT_BOLD_PATH, 44)
    font_heading = ImageFont.truetype(FONT_BOLD_PATH, 32)
    font_body = ImageFont.truetype(FONT_PATH, 24)
    font_badge = ImageFont.truetype(FONT_BOLD_PATH, 16)
    font_sub = ImageFont.truetype(FONT_PATH, 20)
except Exception:
    font_title = ImageFont.load_default()
    font_heading = font_title
    font_body = font_title
    font_badge = font_title
    font_sub = font_title

SLIDES = [
    {
        "eyebrow": "JSI SOFTWARE SOLUTIONS",
        "title": "Field Deployments & Products",
        "desc": "Practical AI infrastructure, smart classroom displays, and enterprise tools.",
        "badge": "IN FLIGHT PREVIEW",
        "badge_color": (194, 65, 12),
        "badge_bg": (255, 237, 213),
        "img_name": "swan-hero.webp",
    },
    {
        "eyebrow": "OFFERING 01 · HARDWARE",
        "title": "SWAN Interactive Smart Boards",
        "desc": "Classroom & meeting panels. 65\", 75\", and 86\" 4K UHD touch displays with dual OS.",
        "badge": "AVAILABLE",
        "badge_color": (4, 120, 87),
        "badge_bg": (209, 250, 229),
        "img_name": "swan-boards.webp",
    },
    {
        "eyebrow": "OFFERING 02 · FACILITIES",
        "title": "Computer Lab Turnkey Setup",
        "desc": "Complete computer lab setups for schools and institutes on rental or purchase.",
        "badge": "ENQUIRY",
        "badge_color": (4, 120, 87),
        "badge_bg": (209, 250, 229),
        "img_name": "swan-ops.webp",
    },
    {
        "eyebrow": "OFFERING 03 · ASSESSMENT",
        "title": "Abhyas Online Exam Portal",
        "desc": "Online examinations, question banks, candidate analytics, and automated evaluation.",
        "badge": "ENQUIRY",
        "badge_color": (4, 120, 87),
        "badge_bg": (209, 250, 229),
        "img_name": "swan-hero.webp",
    },
    {
        "eyebrow": "OFFERING 04 · ERP PLATFORM",
        "title": "ChitrGupt School ERP",
        "desc": "Complete school management: student records, fees, attendance, exams, and parent app.",
        "badge": "ENQUIRY",
        "badge_color": (4, 120, 87),
        "badge_bg": (209, 250, 229),
        "img_name": "swan-boards.webp",
    },
    {
        "eyebrow": "OFFERING 05 · AI ASSISTANT",
        "title": "Chat X LLM Chatbot",
        "desc": "JSI conversational AI chatbot for customer support, school websites, and portals.",
        "badge": "PROPOSED",
        "badge_color": (194, 65, 12),
        "badge_bg": (255, 237, 213),
        "img_name": "swan-ops.webp",
    },
    {
        "eyebrow": "OFFERING 06 · DIGITAL DELIVERY",
        "title": "Managed Hosting, Apps & Software",
        "desc": "Custom web software, mobile applications, cloud hosting, and system integration.",
        "badge": "ENQUIRY",
        "badge_color": (4, 120, 87),
        "badge_bg": (209, 250, 229),
        "img_name": "swan-hero.webp",
    },
]


def load_image_thumb(img_name: str, target_w: int, target_h: int) -> Image.Image:
    path = ASSETS_DIR / img_name
    if not path.is_file():
        img = Image.new("RGB", (target_w, target_h), (240, 240, 240))
        return img
    img = Image.open(path).convert("RGB")
    # aspect ratio crop
    img_ratio = img.width / img.height
    target_ratio = target_w / target_h
    if img_ratio > target_ratio:
        new_w = int(img.height * target_ratio)
        offset = (img.width - new_w) // 2
        img = img.crop((offset, 0, offset + new_w, img.height))
    else:
        new_h = int(img.width / target_ratio)
        offset = (img.height - new_h) // 2
        img = img.crop((0, offset, img.width, offset + new_h))
    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)


def render_slide_image(slide: dict) -> Image.Image:
    # Very clean light canvas
    canvas = Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    # Subtle top border line
    draw.rectangle([0, 0, WIDTH, 6], fill=(15, 23, 42))

    # Outer border / card container
    margin = 40
    card_w = WIDTH - (margin * 2)
    card_h = HEIGHT - (margin * 2) - 20
    draw.rounded_rectangle([margin, margin + 10, margin + card_w, margin + 10 + card_h], radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)

    # Left content column
    left_x = margin + 48
    top_y = margin + 50

    # Eyebrow
    draw.text((left_x, top_y), slide["eyebrow"], font=font_badge, fill=(100, 116, 139))
    top_y += 32

    # Status Badge
    badge_text = slide["badge"]
    tb = font_badge.getbbox(badge_text)
    bw, bh = tb[2] - tb[0] + 20, tb[3] - tb[1] + 12
    draw.rounded_rectangle([left_x, top_y, left_x + bw, top_y + bh], radius=4, fill=slide["badge_bg"], outline=slide["badge_color"], width=1)
    draw.text((left_x + 10, top_y + 4), badge_text, font=font_badge, fill=slide["badge_color"])
    top_y += bh + 24

    # Title
    title = slide["title"]
    draw.text((left_x, top_y), title, font=font_title, fill=(15, 23, 42))
    top_y += 64

    # Description (word wrap)
    words = slide["desc"].split(" ")
    lines = []
    curr = ""
    for w in words:
        test = (curr + " " + w).strip()
        if font_body.getbbox(test)[2] > 540:
            lines.append(curr)
            curr = w
        else:
            curr = test
    if curr:
        lines.append(curr)

    for line in lines:
        draw.text((left_x, top_y), line, font=font_body, fill=(71, 85, 105))
        top_y += 36

    # Bottom website link tag
    draw.text((left_x, HEIGHT - margin - 50), "JSI Software Solutions · yogabrata.com/jsi/", font=font_sub, fill=(148, 163, 184))

    # Right side photo preview
    thumb_w, thumb_h = 500, 340
    thumb_x = WIDTH - margin - 48 - thumb_w
    thumb_y = margin + 50
    thumb_img = load_image_thumb(slide["img_name"], thumb_w, thumb_h)
    canvas.paste(thumb_img, (thumb_x, thumb_y))

    # Border around image
    draw.rounded_rectangle([thumb_x, thumb_y, thumb_x + thumb_w, thumb_y + thumb_h], radius=8, outline=(203, 213, 225), width=2)

    return canvas


def main() -> None:
    print("Generating slide frames...")
    rendered_slides = [render_slide_image(s) for s in SLIDES]

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(OUT_MP4), fourcc, float(FPS), (WIDTH, HEIGHT))

    frames_per_slide = int(SLIDE_DURATION * FPS)
    fade_frames = int(FADE_DURATION * FPS)

    for i, slide_img in enumerate(rendered_slides):
        next_slide_img = rendered_slides[(i + 1) % len(rendered_slides)]
        np_slide = np.array(slide_img)[:, :, ::-1]  # RGB to BGR
        np_next = np.array(next_slide_img)[:, :, ::-1]

        # Hold static frame
        hold_frames = frames_per_slide - fade_frames
        for _ in range(hold_frames):
            out.write(np_slide)

        # Cross-fade transition
        for f in range(fade_frames):
            alpha = f / float(fade_frames)
            blended = cv2.addWeighted(np_slide, 1.0 - alpha, np_next, alpha, 0)
            out.write(blended)

    out.release()
    print(f"Successfully generated reel video at: {OUT_MP4} ({OUT_MP4.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
