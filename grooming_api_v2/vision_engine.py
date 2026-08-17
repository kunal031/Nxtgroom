import os
import base64
import glob
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

class CheckItem(BaseModel):
    checkpoint_name: str = Field(description="Name of the checkpoint (e.g. 'ID Card Visible')")
    observation: str = Field(description="The detailed observation of the checkpoint")

class GroomingReport(BaseModel):
    overall_status: Literal["COMPLIANT", "NON_COMPLIANT"] = Field(description="COMPLIANT if all applicable checks pass. NON_COMPLIANT if any check fails.")
    average_performance_tag: Literal["Poor", "Average", "Good", "Excellent"] = Field(description="A tag evaluating the average performance of the instructor's grooming.")
    ai_summary: str = Field(description="A short 2-3 sentence summary of the evaluation.")
    attire_type: str = Field(description="The primary attire worn by the instructor (e.g., 'Formal Attire', 'Saree', 'Kurta', 'T-Shirt', 'Unknown').")
    general_idcard_check: list[CheckItem] = Field(description="List of ID Card checks.")
    grooming_check: list[CheckItem] = Field(description="List of grooming checks.")
    attire_check: list[CheckItem] = Field(description="List of attire checks.")
    accessories_check: list[CheckItem] = Field(description="List of accessory checks.")
    footwear_check: list[CheckItem] = Field(description="List of footwear checks.")

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

        import json
        
        # Determine the model to use. Defaulting to a safe model if the experimental one isn't available
        ai_model = os.environ.get("OPENAI_MODEL", "gpt-5.6-sol")

        try:
            response = client.chat.completions.create(
                model=ai_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": content_array}
                ],
                response_format={"type": "json_object"},
                temperature=1, 
            )
        except Exception as api_err:
            print(f"Failed with primary model {ai_model}, trying fallback gpt-4o-mini. Error: {api_err}")
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": content_array}
                ],
                response_format={"type": "json_object"},
                temperature=1, 
            )
        
        parsed = json.loads(response.choices[0].message.content)
        return parsed

    except Exception as e:
        return {"error": str(e)}
