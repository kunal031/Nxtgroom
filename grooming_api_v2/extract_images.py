import fitz  # PyMuPDF
import os

pdf_path = "/Users/kunal/Desktop/Instructor Grooming Standards Manual/NxTwave_Instructor_Grooming Guide 2026 2.pdf"
output_dir = "/Users/kunal/Desktop/Instructor Grooming Standards Manual/grooming_api_v2/reference_images"
os.makedirs(output_dir, exist_ok=True)

# Open the PDF
doc = fitz.open(pdf_path)

# Pages containing visual DOs and DON'Ts
pages_to_extract = {
    3: "hair_reference.jpg",          # Page 4 in PDF (0-indexed)
    4: "spectacles_reference.jpg",    # Page 5
    5: "beard_reference.jpg",         # Page 6
    6: "women_dress_reference.jpg",   # Page 7
    7: "men_dress_reference.jpg",     # Page 8
    10: "accessories_reference.jpg",  # Page 11
    11: "footwear_reference.jpg",     # Page 12
    12: "id_card_reference.jpg"       # Page 13
}

for page_num, filename in pages_to_extract.items():
    page = doc.load_page(page_num)
    # Extract as high quality image
    pix = page.get_pixmap(dpi=150)
    pix.save(os.path.join(output_dir, filename))
    print(f"Saved {filename}")
