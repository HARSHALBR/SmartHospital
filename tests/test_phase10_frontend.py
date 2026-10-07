import os
import pytest
import glob

def test_frontend_structure():
    base_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dashboard")
    
    assert os.path.exists(os.path.join(base_dir, "package.json"))
    assert os.path.exists(os.path.join(base_dir, "vite.config.js"))
    assert os.path.exists(os.path.join(base_dir, "tailwind.config.js"))
    
    src_dir = os.path.join(base_dir, "src")
    assert os.path.exists(os.path.join(src_dir, "App.jsx"))
    assert os.path.exists(os.path.join(src_dir, "services", "api.js"))

def test_no_hardcoded_metrics():
    dashboard_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dashboard", "src", "pages", "Dashboard.jsx")
    with open(dashboard_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assert "0.9926" not in content
    assert "0.8319" not in content
    assert "0.9930" not in content
    assert "0.40" not in content
    assert "0.8918" not in content

def test_no_csv_imports():
    src_files = glob.glob(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dashboard", "src", "**", "*.jsx"), recursive=True)
    
    for fpath in src_files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
            assert ".csv" not in content.lower(), f"CSV path found in {fpath}"
            assert ".json" not in content.lower() or "package.json" in content.lower(), f"JSON path found in {fpath}"

def test_attack_simulation_privacy():
    """Verify that AttackSimulation.jsx does not send synthetic text to the backend."""
    attack_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dashboard", "src", "pages", "AttackSimulation.jsx")
    with open(attack_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Assert there are no Axios/fetch/api calls executing inside the component
    assert "axios" not in content.lower()
    assert "fetch(" not in content.lower()
    assert "api.post" not in content.lower()
    assert "api.get" not in content.lower()
    assert "console.log(text)" not in content.lower()
    assert "localstorage" not in content.lower()
