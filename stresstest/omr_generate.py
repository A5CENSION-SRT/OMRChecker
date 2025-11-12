from PIL import Image, ImageDraw, ImageFont
import random, json, os

def get_text_size(draw, text, font):
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except AttributeError:
        w, h = font.getsize(text)
    return w, h

def draw_bubble(draw, x, y, label, font, filled=False):
    radius = 15
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline="black", width=2)
    if filled:
        draw.ellipse((x - radius + 4, y - radius + 4, x + radius - 4, y + radius - 4), fill="black")

    w, h = get_text_size(draw, label, font)
    draw.text((x - w / 2, y + radius + 4), label, fill="black", font=font)

def draw_marker(draw, x, y, size=40):
    draw.rectangle([x, y, x + size, y + size], fill="black")

def generate_dummy_omr_images(output_dir="generated_omrs", sheet_count=5, logo_path=None):
    os.makedirs(output_dir, exist_ok=True)
    all_data = {}

    # Fonts
    try:
        font_bold = ImageFont.truetype("Arial Bold.ttf", 40)
        font_small = ImageFont.truetype("Arial.ttf", 24)
        font_bubble = ImageFont.truetype("Arial.ttf", 20)
    except:
        font_bold = ImageFont.load_default()
        font_small = ImageFont.load_default()
        font_bubble = ImageFont.load_default()

    for sheet_num in range(1, sheet_count + 1):
        img = Image.new("RGB", (1654, 2339), "white")  # A4 at ~150 DPI
        draw = ImageDraw.Draw(img)
        width, height = img.size

        marker_size = 60
        marker_offset = 60
        draw_marker(draw, marker_offset, marker_offset)
        draw_marker(draw, width - marker_offset - marker_size, marker_offset)
        draw_marker(draw, marker_offset, height - marker_offset - marker_size)
        draw_marker(draw, width - marker_offset - marker_size, height - marker_offset - marker_size)

        title_y = 120
        if logo_path and os.path.exists(logo_path):
            try:
                logo = Image.open(logo_path).convert("RGBA")
                max_logo_width = 300
                ratio = max_logo_width / logo.width
                new_height = int(logo.height * ratio)
                logo = logo.resize((max_logo_width, new_height))
                logo_x = (width - max_logo_width) // 2
                img.paste(logo, (logo_x, 60), logo)
                title_y += new_height + 30
            except Exception as e:
                print(f"Warning: Could not load logo: {e}")

        title = "Sample OMR Sheet"
        tw, th = get_text_size(draw, title, font_bold)
        draw.text(((width - tw) / 2, title_y), title, fill="black", font=font_bold)

        roll_section_x = 150 
        draw.text((roll_section_x, title_y + 180), "Roll Number:", fill="black", font=font_small)
        roll_x_start = roll_section_x + 180
        roll_y_start = title_y + 280
        digit_spacing_x = 80
        bubble_spacing_y = 60

        prefix = ["1", "R", "V"]
        roll_suffix = "".join(str(random.randint(0, 9)) for _ in range(7))
        full_roll = "".join(prefix) + roll_suffix

        for i, char in enumerate(prefix + list(roll_suffix)):
            col_x = roll_x_start + i * digit_spacing_x
            draw.text((col_x - 10, roll_y_start - 40), f"C{i+1}", fill="black", font=font_small)

            if i < len(prefix):  # Fixed prefix bubbles
                draw_bubble(draw, col_x, roll_y_start, prefix[i], font_bubble, filled=True)
            else:  # Numeric columns
                for digit in range(10):
                    filled = (int(roll_suffix[i - len(prefix)]) == digit)
                    draw_bubble(draw, col_x, roll_y_start + (digit * bubble_spacing_y), str(digit), font_bubble, filled)

        answers_y = roll_y_start + 750
        draw.text((roll_section_x, answers_y), "Answers:", fill="black", font=font_small)

        questions_per_col = 10
        total_questions = 20
        options = ["A", "B", "C", "D"]
        option_spacing_x = 60
        row_spacing_y = 70
        col_positions = [roll_section_x + 50, 950]
        start_y = answers_y + 80
        q_num = 1

        sheet_answers = {}

        for col_x in col_positions:
            for i in range(questions_per_col):
                if q_num > total_questions:
                    break
                y = start_y + i * row_spacing_y
                draw.text((col_x, y - 25), f"Q{q_num:02d}", fill="black", font=font_small)
                correct_option = random.choice(options)
                sheet_answers[f"Q{q_num:01d}"] = correct_option
                for j, opt in enumerate(options):
                    bubble_x = col_x + 150 + j * option_spacing_x
                    filled = (opt == correct_option)
                    draw_bubble(draw, bubble_x, y, opt, font_bubble, filled)
                q_num += 1

        image_path = os.path.join(output_dir, f"omr_sheet_{sheet_num}.png")
        img.save(image_path, "PNG")
        print(f"Saved {image_path} (Roll: {full_roll})")

        all_data[f"omr_sheet_{sheet_num}"] = {
            "rollNumber": full_roll,
            "answers": sheet_answers
        }

    json_path = os.path.join(output_dir, "omr_data.json")
    with open(json_path, "w") as f:
        json.dump(all_data, f, indent=4)
    print(f"aved JSON data to {json_path}")

if __name__ == "__main__":
    generate_dummy_omr_images(sheet_count=5, logo_path="rvce_logo.png")
