import os
import sys

# Ensure root directory is on sys.path for serverless environment
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse
    
    app = FastAPI()
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    async def fallback(path: str):
        tb = traceback.format_exc()
        html = f"""
        <html>
            <head><title>FastAPI Startup Error</title></head>
            <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #ff5555; line-height: 1.5;">
                <h2 style="color: #ff3333; border-bottom: 2px solid #ff3333; padding-bottom: 10px;">FastAPI Startup Error</h2>
                <pre style="background: #2a2a2a; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap;">{tb}</pre>
            </body>
        </html>
        """
        return HTMLResponse(content=html, status_code=500)
