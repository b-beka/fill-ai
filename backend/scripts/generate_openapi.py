import json
from pathlib import Path
import sys

# Ensure backend root is in sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

def generate_openapi():
    docs_dir = backend_dir / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    out_file = docs_dir / "openapi.json"

    schema = app.openapi()
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

    print(f"OpenAPI schema successfully written to {out_file}")

if __name__ == "__main__":
    generate_openapi()
