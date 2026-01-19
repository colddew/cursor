from google.genai import types
print("MediaResolution attributes:")
for attr in dir(types.MediaResolution):
    if not attr.startswith("_"):
        print(f"- {attr}")
