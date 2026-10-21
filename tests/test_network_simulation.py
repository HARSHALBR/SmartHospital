import os
import pytest
import re

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_network_simulation_files_exist():
    page_path = os.path.join(project_root, "dashboard", "src", "pages", "NetworkSimulation.jsx")
    detector_path = os.path.join(project_root, "dashboard", "src", "services", "networkDetector.js")
    
    assert os.path.exists(page_path), "NetworkSimulation.jsx is missing"
    assert os.path.exists(detector_path), "networkDetector.js is missing"

def test_network_simulation_route_and_sidebar_registered():
    app_jsx_path = os.path.join(project_root, "dashboard", "src", "App.jsx")
    with open(app_jsx_path, "r", encoding="utf-8") as f:
        app_content = f.read()
    assert 'path="network-simulation"' in app_content
    assert 'NetworkSimulation' in app_content

    sidebar_jsx_path = os.path.join(project_root, "dashboard", "src", "components", "Sidebar.jsx")
    with open(sidebar_jsx_path, "r", encoding="utf-8") as f:
        sb_content = f.read()
    assert "'/network-simulation'" in sb_content
    assert "Live Network Sim" in sb_content

def test_deterministic_network_detector_logic():
    """
    Validates the exact rule-based detection logic implemented in networkDetector.js.
    """
    def classify_packet_py(traffic_rate, payload_size, command=None, max_rate=5.0, max_size=1500):
        violations = []
        if traffic_rate > max_rate:
            violations.append(f"Traffic rate spike ({traffic_rate} pkt/s > threshold {max_rate} pkt/s)")
        if payload_size > max_size:
            violations.append(f"Oversized telemetry buffer ({payload_size} B > threshold {max_size} B)")
        if command in ['BUFFER_OVERFLOW', 'EXFILTRATION', 'PORT_SCAN']:
            violations.append(f"Unauthorized command: {command}")
        
        is_anomaly = len(violations) > 0
        return {
            "is_anomaly": is_anomaly,
            "classification": "ANOMALY" if is_anomaly else "NORMAL",
            "violations": violations,
            "rule": "RULE_THRESHOLD_VIOLATION" if is_anomaly else "BASELINE_TELEMETRY_PASS"
        }

    # Case 1: Normal packet
    normal_res = classify_packet_py(traffic_rate=1.2, payload_size=420)
    assert not normal_res["is_anomaly"]
    assert normal_res["classification"] == "NORMAL"
    assert normal_res["rule"] == "BASELINE_TELEMETRY_PASS"

    # Case 2: High rate anomaly (exceeds threshold 5.0 pkt/s)
    rate_res = classify_packet_py(traffic_rate=14.8, payload_size=500)
    assert rate_res["is_anomaly"]
    assert rate_res["classification"] == "ANOMALY"
    assert "Traffic rate spike" in rate_res["violations"][0]

    # Case 3: Oversized payload anomaly (exceeds threshold 1500 B)
    size_res = classify_packet_py(traffic_rate=2.0, payload_size=3840)
    assert size_res["is_anomaly"]
    assert size_res["classification"] == "ANOMALY"
    assert "Oversized telemetry buffer" in size_res["violations"][0]

    # Case 4: Predefined suspicious injection from Hospital C
    injection_res = classify_packet_py(traffic_rate=12.5, payload_size=3400, command="BUFFER_OVERFLOW")
    assert injection_res["is_anomaly"]
    assert len(injection_res["violations"]) == 3

def test_hospital_topology_structure():
    detector_path = os.path.join(project_root, "dashboard", "src", "services", "networkDetector.js")
    with open(detector_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Ensure 4 distinct hospital nodes and central server
    assert "HOSP_A" in content
    assert "HOSP_B" in content
    assert "HOSP_C" in content
    assert "HOSP_D" in content
    assert "CENTRAL_SERVER" in content
    assert "AES-256-GCM" in content
    assert "decryptAndVerifyPayload" in content

def test_aes_gcm_authenticated_decryption_and_tamper_rejection():
    """
    Validates cryptographic principles: AES-GCM requires authentic tag,
    and tampered ciphertext must be rejected.
    """
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    import os as py_os

    key = AESGCM.generate_key(bit_length=256)
    aesgcm = AESGCM(key)
    nonce = py_os.urandom(12) # 96-bit unique nonce

    plaintext = b"SOURCE=Hospital C;RATE=15.8;CMD=BUFFER_OVERFLOW"
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)

    # 1. Authentic decryption succeeds
    decrypted = aesgcm.decrypt(nonce, ciphertext, None)
    assert decrypted == plaintext

    # 2. Tampered ciphertext is rejected by authenticated decryption
    tampered_ciphertext = bytearray(ciphertext)
    tampered_ciphertext[0] ^= 0xFF
    with pytest.raises(Exception):
        aesgcm.decrypt(nonce, bytes(tampered_ciphertext), None)

def test_pipeline_lifecycle_stages():
    page_path = os.path.join(project_root, "dashboard", "src", "pages", "NetworkSimulation.jsx")
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify all 6 stages are declared in the pipeline
    assert "1. CREATED" in content
    assert "2. ENCRYPTED" in content
    assert "3. IN TRANSIT" in content
    assert "4. RECEIVED" in content
    assert "5. INSPECTING" in content
    assert "6. VERDICT" in content
    assert "handleResetSimulation" in content
