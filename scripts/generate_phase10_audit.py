import os
import json

def generate_audit():
    os.makedirs('reports', exist_ok=True)
    
    audit_data = {
        "1_Reusable_Components": [
            "Data Preprocessing pipeline (phase 1/2)",
            "Graph construction scripts (phase 3/4)",
            "EdgeMLP & GraphSAGE PyTorch models",
            "Bio_ClinicalBERT text embedding extractor",
            "FedAvg, FedProx, Personalization, Byzantine, and DP learning loops",
            "Extensive evaluation results (CSVs and generated Matplotlib graphs)"
        ],
        "2_Missing_Integration_Components": [
            "FastAPI Backend Server to serve inference and dashboard data",
            "React/Vite Web Frontend for interactive dashboard",
            "Inference scripts that connect trained `.pth` files to the FastAPI server"
        ],
        "3_Existing_Frontend_Components": "None. The `dashboard/` directory contains only a `.gitkeep`.",
        "4_Existing_Backend_API_Components": "None. Only offline CLI research scripts exist.",
        "5_Model_Artifacts_Available_For_Inference": [
            "results/phase4_2/best_model_a.pth (Centralized EdgeMLP)",
            "results/phase6_2/best_Multimodal.pth (Centralized Multimodal)",
            "results/phase7_3/fedavg_global_model.pth (Federated IoT)",
            "results/phase8_1/severe/final_model.pth (Severe Non-IID FedAvg)",
            "results/phase8_2/mu_0.01/final_model.pth (FedProx)",
            "results/phase8_3/fedavg_global_model.pth & personalized_client_*.pth (Personalized FL)"
        ],
        "6_Results_Available_For_Visualization": [
            "All CSVs in results/phase4_2, phase6_*, phase7_*, phase8_*, phase9",
            "High-resolution presentation plots in results/presentation_plots/"
        ],
        "7_Dependencies": [
            "Backend: FastAPI, Uvicorn, PyTorch, Pandas, Scikit-learn",
            "Frontend: Node.js, npm, React, Vite, TailwindCSS, Recharts (for charts)"
        ],
        "8_Recommended_Frontend_Architecture": "React SPA via Vite. Use Recharts for visualizing the F1 curves, Byzantine drops, and DP bounds. Use Tailwind for quick UI styling. It should have tabs: Overview, Centralized Baseline, Federated Learning, Non-IID & FedProx, Security & Privacy.",
        "9_Recommended_Backend_Architecture": "FastAPI providing endpoints for /api/metrics (to load CSV data for the frontend) and /api/inference (to demonstrate predicting an anomaly from raw IoT features).",
        "10_Integration_Risks": [
            "Frontend setup requires npm/Node.js which might take time or fail in isolated environments.",
            "Loading heavy PyTorch models (like Bio_ClinicalBERT) for live inference might crash small memory containers. Mock inference or offline batch inference might be safer for a reliable demo."
        ]
    }
    
    with open('reports/phase10_0_integration_audit.json', 'w') as f:
        json.dump(audit_data, f, indent=4)
        
    md = "# Phase 10.0 Integration Audit\n\n"
    for k, v in audit_data.items():
        title = k.replace('_', ' ').replace(k.split('_')[0]+' ', '')
        md += f"## {k.split('_')[0]}. {title}\n"
        if isinstance(v, list):
            for item in v:
                md += f"- {item}\n"
        else:
            md += f"{v}\n"
        md += "\n"
        
    with open('reports/phase10_0_integration_audit.md', 'w') as f:
        f.write(md)

if __name__ == "__main__":
    generate_audit()
