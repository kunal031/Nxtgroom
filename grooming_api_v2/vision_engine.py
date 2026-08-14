import os
import base64
import glob
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class GroomingReport(BaseModel):
    overall_status: Literal["COMPLIANT", "NON_COMPLIANT"] = Field(description="COMPLIANT if all applicable checks pass. NON_COMPLIANT if any check fails.")
    ai_summary: str = Field(description="A short 2-3 sentence summary of the evaluation.")
    general_idcard_check: dict[str, str] = Field(description="Dictionary of checks. Key is checkpoint name (e.g. 'ID Card Visible'), Value is the detailed observation of the checkpoint.")
    grooming_check: dict[str, str] = Field(description="Dictionary of grooming checks (Hair, Beard, Makeup, etc.). Key is checkpoint name, Value is observation.")
    attire_check: dict[str, str] = Field(description="Dictionary of attire checks. Key is checkpoint name, Value is observation.")
    accessories_check: dict[str, str] = Field(description="Dictionary of accessory checks. Key is checkpoint name, Value is observation.")
    footwear_check: dict[str, str] = Field(description="Dictionary of footwear checks. Key is checkpoint name, Value is observation.")

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def evaluate_image(instructor_image_path: str, gender: Optional[str] = None) -> dict:
    try:
        from prompts import SYSTEM_PROMPT
        
        content_array = []
        
        user_text = "Here are the REFERENCE IMAGES for the NxtWave Grooming Standards (DOs and DON'Ts):"
        content_array.append({"type": "text", "text": user_text})
        
        # Load all reference images
        reference_dir = os.path.join(os.path.dirname(__file__), "reference_images")
        if os.path.exists(reference_dir):
            # Load images depending on gender to save context if provided
            pattern = "*.jpg"
            for ref_img_path in glob.glob(os.path.join(reference_dir, pattern)):
                # Optimization: Skip women references if gender is MALE, skip men if FEMALE
                if gender == "MALE" and "women" in ref_img_path:
                    continue
                if gender == "FEMALE" and ("men" in ref_img_path or "beard" in ref_img_path):
                    continue
                    
                b64_ref = encode_image(ref_img_path)
                content_array.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64_ref}"}
                })

        instruction_text = "\nNow, here is the INSTRUCTOR IMAGE you need to evaluate. "
        if gender:
            instruction_text += f"The instructor's gender is {gender.upper()}."
        else:
            instruction_text += "Determine if the instructor is male or female first."
            
        content_array.append({"type": "text", "text": instruction_text})
        
        # Add the actual instructor image
        b64_instructor = encode_image(instructor_image_path)
        content_array.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64_instructor}"}
        })

        ai_model = os.environ.get("OPENAI_MODEL", "gpt-4o")

        response = client.beta.chat.completions.parse(
            model=ai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": content_array}
            ],
            response_format=GroomingReport,
            temperature=1, 
        )
        
        return response.choices[0].message.parsed.model_dump()

    except Exception as e:
        return {"error": str(e)}
