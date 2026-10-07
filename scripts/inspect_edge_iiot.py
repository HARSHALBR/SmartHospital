#!/usr/bin/env python3
"""
Script to run the Edge-IIoT dataset inspection.

Usage:
    python scripts/inspect_edge_iiot.py
    python scripts/inspect_edge_iiot.py --raw-dir data/raw/edge_iiot
    python scripts/inspect_edge_iiot.py --help

This script discovers, inspects, and reports on the Edge-IIoT dataset
without modifying any raw data files.
"""

import argparse
import sys
import os
from pathlib import Path

# Add project root to sys.path so we can import preprocessing package
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from preprocessing.iot_inspector import EdgeIIoTInspector


def parse_args():
    parser = argparse.ArgumentParser(
        description="Inspect the Edge-IIoT dataset and generate reports."
    )
    parser.add_argument(
        "--raw-dir",
        type=str,
        default=str(PROJECT_ROOT / "data" / "raw" / "edge_iiot"),
        help="Path to directory containing raw dataset CSV file(s).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(PROJECT_ROOT / "reports"),
        help="Path to directory where text and JSON reports will be saved.",
    )
    parser.add_argument(
        "--figures-dir",
        type=str,
        default=str(PROJECT_ROOT / "data" / "processed" / "edge_iiot" / "figures"),
        help="Path to directory where visualizations will be saved.",
    )
    parser.add_argument(
        "--chunksize",
        type=int,
        default=100000,
        help="Chunk size for reading large CSV files (default: 100000).",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 70)
    print("  EDGE-IIoT DATASET INSPECTION")
    print("  Smart Hospital FGNN Project — Phase 1")
    print("=" * 70)
    print()

    # Validate raw directory exists
    raw_dir = Path(args.raw_dir)
    if not raw_dir.exists():
        print(f"ERROR: Raw data directory not found: {raw_dir}")
        print("Please place the Edge-IIoT dataset CSV file(s) in this directory.")
        sys.exit(1)

    # Check for CSV files
    csv_files = list(raw_dir.glob("*.csv"))
    if not csv_files:
        print(f"ERROR: No CSV files found in: {raw_dir}")
        print("Please place the Edge-IIoT dataset CSV file(s) in this directory.")
        sys.exit(1)

    print(f"Raw data directory : {raw_dir}")
    print(f"Output directory   : {args.output_dir}")
    print(f"Figures directory  : {args.figures_dir}")
    print(f"Chunk size         : {args.chunksize:,}")
    print(f"CSV files found    : {len(csv_files)}")
    for f in csv_files:
        size_mb = f.stat().st_size / (1024 * 1024)
        print(f"  - {f.name} ({size_mb:.1f} MB)")
    print()

    # Create inspector and run
    inspector = EdgeIIoTInspector(
        raw_dir=str(args.raw_dir),
        output_dir=str(args.output_dir),
        figures_dir=str(args.figures_dir),
        chunksize=args.chunksize,
    )

    results = inspector.run_full_inspection()

    print()
    print("=" * 70)
    print("  INSPECTION COMPLETE")
    print("=" * 70)
    print()
    print(f"Reports saved to       : {args.output_dir}")
    print(f"Figures saved to       : {args.figures_dir}")
    print()
    print("Next step: Review the inspection report and decide which columns")
    print("to drop (if any) before running the preprocessing pipeline.")
    print()
    print("DO NOT proceed to preprocessing until the inspection report")
    print("has been reviewed and column decisions have been made.")


if __name__ == "__main__":
    main()
