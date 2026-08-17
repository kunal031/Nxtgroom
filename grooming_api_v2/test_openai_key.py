import os
from openai import OpenAI
from dotenv import load_dotenv
import traceback

# Load the environment variables
load_dotenv()

def test_api_key():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY is not set in your .env file!")
        return

    print(f"Testing API Key starting with: {api_key[:8]}...")
    
    try:
        client = OpenAI(api_key=api_key)
        
        # Test a simple completion
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello! Reply with exactly 'API_IS_WORKING'."}
            ],
            max_tokens=10
        )
        
        print("\nSUCCESS! Your OpenAI API key is working perfectly.")
        print("Response from AI:", response.choices[0].message.content)
        
    except Exception as e:
        print("\nFAILED! There is an issue with your OpenAI API request.")
        print("Detailed Error Traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_api_key()
