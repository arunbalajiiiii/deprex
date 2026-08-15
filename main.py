import os
import sys

# Ensure root directory is on sys.path
_root_dir = os.path.dirname(os.path.abspath(__file__))
if _root_dir not in sys.path:
    sys.path.insert(0, _root_dir)

from app.main import app
