#!/usr/bin/env python3
"""
Edge-IIoT Dataset Inspector

Comprehensive inspection of the Edge-IIoT cybersecurity dataset for the
Smart Hospital FGNN project. Uses chunked reading to handle large files
without exhausting memory.

This module DOES NOT modify, rename, move, or delete any raw data files.
This module DOES NOT drop any columns or create train/val/test splits.

Usage:
    from preprocessing.iot_inspector import EdgeIIoTInspector
    inspector = EdgeIIoTInspector("data/raw/edge_iiot", "reports", "data/processed/edge_iiot/figures")
    results = inspector.run_full_inspection()
"""

import json
import os
import sys
import warnings
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for saving plots
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

warnings.filterwarnings("ignore", category=pd.errors.DtypeWarning)


# ─────────────────────────────────────────────────────────────────────
# Column semantic classification rules
# ─────────────────────────────────────────────────────────────────────

# Keywords used for heuristic column classification (all lowercase)
_DEVICE_KEYWORDS = ["ip.src", "ip.dst", "arp.src.proto", "arp.dst.proto"]
_NETWORK_KEYWORDS = ["tcp.", "udp.", "port"]
_PROTOCOL_KEYWORDS = ["http.", "dns.", "mqtt.", "mbtcp.", "arp.", "icmp."]
_FLOW_KEYWORDS = [
    "len", "seq", "ack", "flags", "checksum", "payload",
    "stream", "time_delta", "connection.",
]
_TEMPORAL_KEYWORDS = ["frame.time", "timestamp", "time"]
_LABEL_KEYWORDS = ["attack", "label", "type", "class", "target", "anomaly"]

# Usefulness notes per column (will be filled dynamically for unknowns)
_COLUMN_USEFULNESS = {
    "frame.time": "Packet capture timestamp — useful for temporal ordering, time-series features, and temporal graph edge construction",
    "ip.src_host": "Source IP address — primary candidate for graph node identity; encodes network topology",
    "ip.dst_host": "Destination IP address — primary candidate for graph node identity; encodes network topology",
    "arp.dst.proto_ipv4": "ARP destination protocol address — device/network identifier in ARP traffic",
    "arp.opcode": "ARP operation code (request/reply) — protocol behavior feature",
    "arp.hw.size": "ARP hardware address size — protocol metadata",
    "arp.src.proto_ipv4": "ARP source protocol address — device/network identifier in ARP traffic",
    "icmp.checksum": "ICMP checksum — integrity/error feature; anomalous values may indicate crafted packets",
    "icmp.seq_le": "ICMP sequence number — flow tracking feature; patterns may indicate scanning/flooding",
    "icmp.transmit_timestamp": "ICMP transmit timestamp — temporal feature from ICMP protocol",
    "icmp.unused": "ICMP unused field — normally zero; non-zero values may signal covert channels or attacks",
    "http.file_data": "HTTP file/body data — payload content; may contain attack signatures",
    "http.content_length": "HTTP content length — flow size feature",
    "http.request.uri.query": "HTTP URI query string — may reveal injection attacks (SQLi, XSS)",
    "http.request.method": "HTTP method (GET/POST/etc.) — protocol behavior feature",
    "http.referer": "HTTP referer header — browsing context; may indicate phishing/CSRF",
    "http.request.full_uri": "Full HTTP request URI — high cardinality but may contain attack patterns",
    "http.request.version": "HTTP version — protocol metadata",
    "http.response": "HTTP response code — server behavior feature",
    "http.tls_port": "HTTP TLS port — encryption indicator",
    "tcp.ack": "TCP acknowledgment number — flow state feature",
    "tcp.ack_raw": "TCP raw acknowledgment — low-level flow tracking",
    "tcp.checksum": "TCP checksum — integrity feature; anomalous values may indicate crafted packets",
    "tcp.connection.fin": "TCP FIN flag — connection termination indicator",
    "tcp.connection.rst": "TCP RST flag — connection reset indicator; high counts may signal scanning",
    "tcp.connection.syn": "TCP SYN flag — connection initiation; SYN floods are a common DDoS vector",
    "tcp.connection.synack": "TCP SYN-ACK flag — handshake indicator",
    "tcp.dstport": "TCP destination port — service identifier; key network feature",
    "tcp.flags": "TCP flags combined — connection state encoding",
    "tcp.flags.ack": "TCP ACK flag — acknowledgment indicator",
    "tcp.len": "TCP segment length — packet size feature; important for traffic profiling",
    "tcp.options": "TCP options field — may contain window scaling, timestamps, or unusual options",
    "tcp.payload": "TCP payload data — raw payload; may contain attack signatures",
    "tcp.seq": "TCP sequence number — flow ordering feature",
    "tcp.srcport": "TCP source port — ephemeral port; network feature",
    "udp.port": "UDP port — service identifier for UDP traffic",
    "udp.stream": "UDP stream identifier — flow tracking",
    "udp.time_delta": "UDP inter-packet time delta — temporal/behavioral feature; useful for anomaly detection",
    "dns.qry.name": "DNS query name — domain being resolved; may reveal C2, tunneling, or exfiltration",
    "dns.qry.name.len": "DNS query name length — anomalous lengths may indicate tunneling attacks",
    "dns.qry.qu": "DNS query question flag — protocol metadata",
    "dns.qry.type": "DNS query type (A, AAAA, MX, etc.) — protocol behavior feature",
    "dns.retransmission": "DNS retransmission flag — network reliability indicator",
    "dns.retransmit_request": "DNS retransmit request flag — network behavior",
    "dns.retransmit_request_in": "DNS retransmit request reference — flow correlation",
    "mqtt.conack.flags": "MQTT CONNACK flags — IoT protocol connection response",
    "mqtt.conflag.cleansess": "MQTT clean session flag — IoT session management",
    "mqtt.conflags": "MQTT connect flags — IoT protocol handshake metadata",
    "mqtt.hdrflags": "MQTT header flags — IoT protocol control",
    "mqtt.len": "MQTT message length — IoT payload size feature",
    "mqtt.msg_decoded_as": "MQTT decoded message type — IoT message classification",
    "mqtt.msg": "MQTT message content — IoT payload; may contain sensor data or commands",
    "mqtt.msgtype": "MQTT message type code — IoT protocol operation type",
    "mqtt.proto_len": "MQTT protocol name length — IoT protocol metadata",
    "mqtt.protoname": "MQTT protocol name string — IoT protocol identifier",
    "mqtt.topic": "MQTT topic — IoT pub/sub topic; may reveal device hierarchy or attack targets",
    "mqtt.topic_len": "MQTT topic length — IoT feature",
    "mqtt.ver": "MQTT version — IoT protocol version",
    "mbtcp.len": "Modbus TCP length — IIoT/SCADA payload size",
    "mbtcp.trans_id": "Modbus TCP transaction ID — IIoT/SCADA flow tracking",
    "mbtcp.unit_id": "Modbus TCP unit ID — IIoT/SCADA device identifier",
    "Attack_label": "Binary attack indicator (0=Normal, 1=Attack) — primary binary classification target",
    "Attack_type": "Attack type category string — primary multiclass classification target",
}


class EdgeIIoTInspector:
    """Comprehensive inspector for Edge-IIoT dataset files.

    Performs chunked reading for memory efficiency and produces
    structured reports, visualizations, and JSON metadata.
    """

    def __init__(
        self,
        raw_dir: str,
        output_dir: str,
        figures_dir: str,
        chunksize: int = 100_000,
    ):
        self.raw_dir = Path(raw_dir)
        self.output_dir = Path(output_dir)
        self.figures_dir = Path(figures_dir)
        self.chunksize = chunksize

        # Create output dirs if needed
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.figures_dir.mkdir(parents=True, exist_ok=True)

    # ─────────────────────────────────────────────────────────────
    # 1. File Discovery
    # ─────────────────────────────────────────────────────────────
    def discover_files(self) -> List[Dict[str, Any]]:
        """Find all CSV files in the raw directory."""
        files = []
        for f in sorted(self.raw_dir.glob("*.csv")):
            size_bytes = f.stat().st_size
            files.append({
                "filename": f.name,
                "filepath": str(f),
                "size_bytes": size_bytes,
                "size_mb": round(size_bytes / (1024 * 1024), 2),
            })
        return files

    # ─────────────────────────────────────────────────────────────
    # 2. Schema Inspection (sample-based)
    # ─────────────────────────────────────────────────────────────
    def inspect_schema(self, filepath: str, nrows: int = 10_000) -> Dict[str, Any]:
        """Read a small sample to determine column names and dtypes."""
        df_sample = pd.read_csv(filepath, nrows=nrows, low_memory=False)
        return {
            "columns": list(df_sample.columns),
            "num_columns": len(df_sample.columns),
            "dtypes": {col: str(dtype) for col, dtype in df_sample.dtypes.items()},
            "sample_rows": len(df_sample),
        }

    # ─────────────────────────────────────────────────────────────
    # 3. Chunked Row Count
    # ─────────────────────────────────────────────────────────────
    def count_rows_chunked(self, filepath: str) -> int:
        """Count total rows using chunked reading."""
        total = 0
        for chunk in pd.read_csv(filepath, chunksize=self.chunksize, low_memory=False):
            total += len(chunk)
        return total

    # ─────────────────────────────────────────────────────────────
    # 4. Compute Full Statistics (chunked)
    # ─────────────────────────────────────────────────────────────
    def compute_statistics(self, filepath: str) -> Dict[str, Any]:
        """Compute per-column statistics using chunked reading.

        Returns dict with:
            total_rows, total_cols, per_column stats (missing, inf, unique, dtype),
            duplicate_count (estimated from sample).
        """
        print("  Computing statistics (chunked)...")
        col_missing: Counter = Counter()
        col_inf: Counter = Counter()
        col_unique: Dict[str, set] = defaultdict(set)
        col_dtypes: Dict[str, str] = {}
        total_rows = 0
        chunk_count = 0
        num_cols = 0
        unique_cap = 10_000  # cap unique tracking to avoid memory explosion

        # For duplicate detection, collect hashes from a sample
        hash_list: List[int] = []
        sample_rows_for_dup = 500_000
        dup_sample_collected = 0

        for chunk in pd.read_csv(filepath, chunksize=self.chunksize, low_memory=False):
            chunk_count += 1
            n = len(chunk)
            total_rows += n
            num_cols = len(chunk.columns)

            if chunk_count % 5 == 1:
                print(f"    Processing chunk {chunk_count} "
                      f"(rows so far: {total_rows:,})...")

            for col in chunk.columns:
                # dtype (take from first chunk)
                if col not in col_dtypes:
                    col_dtypes[col] = str(chunk[col].dtype)

                # Missing
                col_missing[col] += int(chunk[col].isna().sum())

                # Infinite (numeric only)
                if pd.api.types.is_numeric_dtype(chunk[col]):
                    col_inf[col] += int(np.isinf(chunk[col].dropna()).sum())

                # Unique values (capped)
                if len(col_unique[col]) < unique_cap:
                    new_vals = set(chunk[col].dropna().unique())
                    col_unique[col] = col_unique[col].union(new_vals)
                    # Re-cap after union
                    if len(col_unique[col]) > unique_cap:
                        col_unique[col] = set(list(col_unique[col])[:unique_cap])

            # Duplicate sampling
            if dup_sample_collected < sample_rows_for_dup:
                remaining = sample_rows_for_dup - dup_sample_collected
                sample = chunk.head(min(remaining, n))
                hash_list.extend(
                    pd.util.hash_pandas_object(sample, index=False).tolist()
                )
                dup_sample_collected += len(sample)

        # Estimate duplicates from sample hashes
        hash_counter = Counter(hash_list)
        dup_in_sample = sum(c - 1 for c in hash_counter.values() if c > 1)
        dup_ratio = dup_in_sample / max(len(hash_list), 1)
        estimated_duplicates = int(dup_ratio * total_rows)

        print(f"    Done. Total rows: {total_rows:,}, Chunks processed: {chunk_count}")

        per_column = {}
        for col in col_dtypes:
            cardinality = len(col_unique.get(col, set()))
            capped = cardinality >= unique_cap
            per_column[col] = {
                "dtype": col_dtypes[col],
                "missing_count": col_missing.get(col, 0),
                "missing_pct": round(col_missing.get(col, 0) / max(total_rows, 1) * 100, 4),
                "inf_count": col_inf.get(col, 0),
                "unique_count": cardinality,
                "unique_capped": capped,
                "pct_unique": round(cardinality / max(total_rows, 1) * 100, 4),
            }

        return {
            "total_rows": total_rows,
            "total_cols": num_cols,
            "chunks_processed": chunk_count,
            "duplicate_sample_size": len(hash_list),
            "duplicates_in_sample": dup_in_sample,
            "estimated_duplicate_rows": estimated_duplicates,
            "duplicate_ratio_pct": round(dup_ratio * 100, 4),
            "per_column": per_column,
        }

    # ─────────────────────────────────────────────────────────────
    # 5. Detect Target / Label Columns
    # ─────────────────────────────────────────────────────────────
    def detect_target_columns(self, filepath: str) -> Dict[str, Any]:
        """Auto-detect potential label/target columns and their distributions."""
        print("  Detecting target/label columns...")
        # Read a sample for name-based detection
        df_sample = pd.read_csv(filepath, nrows=5000, low_memory=False)

        candidates = []
        for col in df_sample.columns:
            col_lower = col.lower()
            # Name-based match
            name_match = any(kw in col_lower for kw in _LABEL_KEYWORDS)
            # Low-cardinality match
            nunique = df_sample[col].nunique()
            low_card = nunique < 50
            if name_match or low_card:
                candidates.append(col)

        # Now compute full distributions for candidates using chunked reading
        results = {}
        for col in candidates:
            print(f"    Computing distribution for: {col}")
            value_counts: Counter = Counter()
            for chunk in pd.read_csv(
                filepath, usecols=[col], chunksize=self.chunksize, low_memory=False
            ):
                vc = chunk[col].value_counts(dropna=False)
                for val, count in vc.items():
                    value_counts[val] += count

            sorted_counts = dict(value_counts.most_common())
            results[col] = {
                "unique_values": list(sorted_counts.keys()),
                "num_unique": len(sorted_counts),
                "value_counts": {str(k): int(v) for k, v in sorted_counts.items()},
            }

        return results

    # ─────────────────────────────────────────────────────────────
    # 6. Classify Columns Semantically
    # ─────────────────────────────────────────────────────────────
    def classify_columns(
        self, columns: List[str], per_column_stats: Dict
    ) -> Dict[str, List[str]]:
        """Classify each column into semantic groups by name heuristics."""
        groups: Dict[str, List[str]] = {
            "device": [],
            "network": [],
            "protocol": [],
            "flow": [],
            "temporal": [],
            "label": [],
            "other": [],
        }

        for col in columns:
            col_lower = col.lower()
            matched = False

            # Temporal — check first (frame.time would also match flow's 'time')
            if any(kw in col_lower for kw in _TEMPORAL_KEYWORDS):
                groups["temporal"].append(col)
                matched = True

            # Label
            if any(kw in col_lower for kw in _LABEL_KEYWORDS):
                groups["label"].append(col)
                matched = True

            # Device
            if any(kw in col_lower for kw in _DEVICE_KEYWORDS):
                groups["device"].append(col)
                matched = True

            # Network
            if any(kw in col_lower for kw in _NETWORK_KEYWORDS):
                groups["network"].append(col)
                matched = True

            # Protocol
            if any(kw in col_lower for kw in _PROTOCOL_KEYWORDS):
                groups["protocol"].append(col)
                matched = True

            # Flow
            if any(kw in col_lower for kw in _FLOW_KEYWORDS):
                groups["flow"].append(col)
                matched = True

            if not matched:
                groups["other"].append(col)

        return groups

    # ─────────────────────────────────────────────────────────────
    # 7. Cardinality Assessment (KEEP / REVIEW / FLAG)
    # ─────────────────────────────────────────────────────────────
    def assess_cardinality(
        self,
        columns: List[str],
        per_column_stats: Dict,
        total_rows: int,
        column_groups: Dict[str, List[str]],
    ) -> List[Dict[str, Any]]:
        """Assess every column's cardinality and assign KEEP/REVIEW/FLAG."""
        results = []
        for col in columns:
            stats = per_column_stats.get(col, {})
            cardinality = stats.get("unique_count", 0)
            pct_unique = stats.get("pct_unique", 0)
            missing_pct = stats.get("missing_pct", 0)
            dtype = stats.get("dtype", "unknown")

            # Determine which groups this column belongs to
            member_groups = [g for g, cols in column_groups.items() if col in cols]

            # Usefulness note
            usefulness = _COLUMN_USEFULNESS.get(col, "General feature — review for relevance")

            # Recommendation logic
            is_identifier_like = any(
                kw in col.lower()
                for kw in ["ip.src", "ip.dst", "frame.time", "uri", "full_uri",
                           "file_data", "payload", "options", "msg", "topic",
                           "qry.name", "referer"]
            )

            if pct_unique > 90 and is_identifier_like:
                recommendation = "FLAG"
                reason = (
                    f"Very high cardinality ({pct_unique:.1f}% unique) and "
                    f"appears to be an identifier/free-text field. "
                    f"May still be useful for graph construction or NLP — review before any action."
                )
            elif pct_unique > 50 or missing_pct > 50:
                recommendation = "REVIEW"
                if pct_unique > 50:
                    reason = f"High cardinality ({pct_unique:.1f}% unique) — review whether it adds predictive value."
                else:
                    reason = f"High missing rate ({missing_pct:.1f}%) — review imputation strategy or usefulness."
            else:
                recommendation = "KEEP"
                reason = "Moderate cardinality and completeness — suitable as-is for modeling."

            results.append({
                "column": col,
                "dtype": dtype,
                "cardinality": cardinality,
                "pct_unique": round(pct_unique, 4),
                "missing_count": stats.get("missing_count", 0),
                "missing_pct": round(missing_pct, 4),
                "inf_count": stats.get("inf_count", 0),
                "groups": member_groups,
                "usefulness": usefulness,
                "recommendation": recommendation,
                "recommendation_reason": reason,
            })

        return results

    # ─────────────────────────────────────────────────────────────
    # 8. Graph-Feature Candidates
    # ─────────────────────────────────────────────────────────────
    def identify_graph_candidates(self, columns: List[str]) -> Dict[str, List[str]]:
        """Identify columns potentially useful for graph construction."""
        result: Dict[str, List[str]] = {
            "node_candidates": [],
            "edge_candidates": [],
            "node_feature_candidates": [],
            "temporal_candidates": [],
            "label_candidates": [],
        }

        for col in columns:
            cl = col.lower()
            # Nodes: IP addresses, device IDs
            if any(kw in cl for kw in ["ip.src", "ip.dst", "arp.src.proto", "arp.dst.proto", "unit_id"]):
                result["node_candidates"].append(col)
            # Edges: source→destination relationships
            if "src" in cl or "dst" in cl:
                result["edge_candidates"].append(col)
            # Temporal
            if any(kw in cl for kw in ["time", "timestamp"]):
                result["temporal_candidates"].append(col)
            # Labels
            if any(kw in cl for kw in ["attack", "label", "anomaly"]):
                result["label_candidates"].append(col)
            # Node features: traffic stats, ports, protocol fields
            if any(kw in cl for kw in [
                "tcp.", "udp.", "icmp.", "http.", "dns.", "mqtt.", "mbtcp.",
                "port", "len", "flags", "checksum",
            ]):
                result["node_feature_candidates"].append(col)

        return result

    # ─────────────────────────────────────────────────────────────
    # 9. Identify numerical vs categorical columns
    # ─────────────────────────────────────────────────────────────
    def classify_numerical_categorical(
        self, columns: List[str], per_column_stats: Dict
    ) -> Tuple[List[str], List[str]]:
        """Separate columns into numerical and categorical based on dtype."""
        numerical = []
        categorical = []
        for col in columns:
            dtype = per_column_stats.get(col, {}).get("dtype", "object")
            if "float" in dtype or "int" in dtype:
                numerical.append(col)
            else:
                categorical.append(col)
        return numerical, categorical

    # ─────────────────────────────────────────────────────────────
    # 10. Generate Plots
    # ─────────────────────────────────────────────────────────────
    def generate_plots(
        self,
        filepath: str,
        target_info: Dict[str, Any],
        per_column_stats: Dict,
        columns: List[str],
    ) -> List[str]:
        """Generate and save inspection visualizations."""
        print("  Generating plots...")
        saved_plots: List[str] = []
        sns.set_theme(style="whitegrid")

        # ── Plot 1: Binary class distribution ──
        binary_col = None
        multi_col = None
        for col, info in target_info.items():
            if info["num_unique"] == 2:
                binary_col = col
            elif info["num_unique"] > 2:
                multi_col = col

        if binary_col:
            vc = target_info[binary_col]["value_counts"]
            fig, ax = plt.subplots(figsize=(8, 5))
            labels = [str(k) for k in vc.keys()]
            values = list(vc.values())
            colors = ["#2ecc71", "#e74c3c"][:len(labels)]
            bars = ax.bar(labels, values, color=colors, edgecolor="black", linewidth=0.5)
            for bar, val in zip(bars, values):
                ax.text(
                    bar.get_x() + bar.get_width() / 2, bar.get_height() + max(values) * 0.01,
                    f"{val:,}", ha="center", va="bottom", fontsize=11, fontweight="bold",
                )
            ax.set_title(f"Binary Class Distribution — {binary_col}", fontsize=14, fontweight="bold")
            ax.set_xlabel("Class", fontsize=12)
            ax.set_ylabel("Count", fontsize=12)
            ax.ticklabel_format(style="plain", axis="y")
            plt.tight_layout()
            path = self.figures_dir / "class_distribution_binary.png"
            fig.savefig(path, dpi=150)
            plt.close(fig)
            saved_plots.append(str(path))
            print(f"    Saved: {path.name}")

        # ── Plot 2: Attack type distribution ──
        if multi_col:
            vc = target_info[multi_col]["value_counts"]
            fig, ax = plt.subplots(figsize=(14, 7))
            labels = [str(k) for k in vc.keys()]
            values = list(vc.values())
            palette = sns.color_palette("husl", len(labels))
            bars = ax.barh(labels[::-1], values[::-1], color=palette[::-1], edgecolor="black", linewidth=0.3)
            for bar, val in zip(bars, values[::-1]):
                ax.text(
                    bar.get_width() + max(values) * 0.005, bar.get_y() + bar.get_height() / 2,
                    f"{val:,}", ha="left", va="center", fontsize=9,
                )
            ax.set_title(f"Attack Type Distribution — {multi_col}", fontsize=14, fontweight="bold")
            ax.set_xlabel("Count", fontsize=12)
            ax.ticklabel_format(style="plain", axis="x")
            plt.tight_layout()
            path = self.figures_dir / "attack_type_distribution.png"
            fig.savefig(path, dpi=150)
            plt.close(fig)
            saved_plots.append(str(path))
            print(f"    Saved: {path.name}")

        # ── Plot 3: Missing values ──
        missing_cols = {
            col: stats["missing_count"]
            for col, stats in per_column_stats.items()
            if stats["missing_count"] > 0
        }
        if missing_cols:
            fig, ax = plt.subplots(figsize=(12, max(6, len(missing_cols) * 0.4)))
            sorted_missing = dict(sorted(missing_cols.items(), key=lambda x: x[1], reverse=True))
            cols_m = list(sorted_missing.keys())
            vals_m = list(sorted_missing.values())
            ax.barh(cols_m[::-1], vals_m[::-1], color="#e67e22", edgecolor="black", linewidth=0.3)
            ax.set_title("Missing Values per Column", fontsize=14, fontweight="bold")
            ax.set_xlabel("Missing Count", fontsize=12)
            ax.ticklabel_format(style="plain", axis="x")
            plt.tight_layout()
            path = self.figures_dir / "missing_values.png"
            fig.savefig(path, dpi=150)
            plt.close(fig)
            saved_plots.append(str(path))
            print(f"    Saved: {path.name}")
        else:
            print("    No missing values found — skipping missing values plot.")

        # ── Plot 4: Numerical feature distributions (sample-based) ──
        numerical_cols = [
            col for col in columns
            if per_column_stats.get(col, {}).get("dtype", "object").startswith(("float", "int"))
            and col.lower() not in ["attack_label"]
        ]
        if numerical_cols:
            # Pick top 12 by variance from a sample
            print("    Sampling for numerical distributions...")
            df_sample = pd.read_csv(
                filepath,
                usecols=numerical_cols,
                nrows=200_000,
                low_memory=False,
            )
            # Replace inf with nan for variance computation
            df_sample = df_sample.replace([np.inf, -np.inf], np.nan)
            variances = df_sample.var(numeric_only=True).sort_values(ascending=False)
            top_cols = variances.head(12).index.tolist()

            if top_cols:
                n_plots = len(top_cols)
                ncols_grid = 3
                nrows_grid = (n_plots + ncols_grid - 1) // ncols_grid
                fig, axes = plt.subplots(nrows_grid, ncols_grid, figsize=(16, nrows_grid * 4))
                axes = axes.flatten() if n_plots > 1 else [axes]

                for idx, col in enumerate(top_cols):
                    data = df_sample[col].dropna()
                    # Clip outliers to 1st and 99th percentile for better visualization
                    if len(data) > 0:
                        q01, q99 = data.quantile(0.01), data.quantile(0.99)
                        data_clipped = data[(data >= q01) & (data <= q99)]
                        axes[idx].hist(data_clipped, bins=50, color="#3498db",
                                       edgecolor="black", linewidth=0.3, alpha=0.8)
                    axes[idx].set_title(col, fontsize=10, fontweight="bold")
                    axes[idx].tick_params(labelsize=8)

                # Hide unused subplots
                for idx in range(n_plots, len(axes)):
                    axes[idx].set_visible(False)

                fig.suptitle("Top Numerical Feature Distributions (sampled, clipped 1–99%ile)",
                             fontsize=13, fontweight="bold")
                plt.tight_layout(rect=[0, 0, 1, 0.96])
                path = self.figures_dir / "numerical_feature_distributions.png"
                fig.savefig(path, dpi=150)
                plt.close(fig)
                saved_plots.append(str(path))
                print(f"    Saved: {path.name}")

        return saved_plots

    # ─────────────────────────────────────────────────────────────
    # 11. Report Generation
    # ─────────────────────────────────────────────────────────────
    def generate_text_report(
        self,
        file_info: Dict,
        schema: Dict,
        stats: Dict,
        target_info: Dict,
        column_groups: Dict,
        cardinality_assessment: List[Dict],
        graph_candidates: Dict,
        numerical_cols: List[str],
        categorical_cols: List[str],
        saved_plots: List[str],
    ) -> str:
        """Generate a formatted text report."""
        lines = []
        sep = "=" * 70

        lines.append(sep)
        lines.append("  EDGE-IIoT DATASET INSPECTION REPORT")
        lines.append("  Smart Hospital FGNN Project — Phase 1")
        lines.append(sep)
        lines.append("")

        # ── Dataset Summary ──
        lines.append("─── DATASET SUMMARY ───")
        lines.append(f"  Filename        : {file_info['filename']}")
        lines.append(f"  File size       : {file_info['size_mb']:.2f} MB")
        lines.append(f"  Total rows      : {stats['total_rows']:,}")
        lines.append(f"  Total columns   : {stats['total_cols']}")
        lines.append(f"  Est. duplicates : {stats['estimated_duplicate_rows']:,} "
                      f"({stats['duplicate_ratio_pct']:.2f}% of sampled rows)")
        lines.append("")

        # ── Column Names ──
        lines.append("─── ALL COLUMN NAMES ───")
        for i, col in enumerate(schema["columns"], 1):
            dtype = stats["per_column"].get(col, {}).get("dtype", "?")
            lines.append(f"  {i:3d}. {col:<40s} dtype={dtype}")
        lines.append("")

        # ── Label / Target ──
        lines.append("─── LABEL / TARGET COLUMNS ───")
        for col, info in target_info.items():
            lines.append(f"  Column: {col}")
            lines.append(f"    Unique values: {info['num_unique']}")
            lines.append(f"    Values: {info['unique_values']}")
            lines.append(f"    Distribution:")
            for val, count in info["value_counts"].items():
                pct = count / stats["total_rows"] * 100
                lines.append(f"      {str(val):<30s} : {count:>10,} ({pct:6.2f}%)")
            lines.append("")

        # ── Class Distribution / Imbalance ──
        lines.append("─── CLASS DISTRIBUTION & IMBALANCE ───")
        for col, info in target_info.items():
            if info["num_unique"] > 2:
                vc = info["value_counts"]
                max_count = max(vc.values())
                min_count = min(vc.values())
                imbalance_ratio = max_count / max(min_count, 1)
                lines.append(f"  Target: {col}")
                lines.append(f"    Number of classes : {info['num_unique']}")
                lines.append(f"    Largest class     : {max_count:,}")
                lines.append(f"    Smallest class    : {min_count:,}")
                lines.append(f"    Imbalance ratio   : {imbalance_ratio:,.1f}x")
                lines.append(f"    NOTE: Dataset is {'HIGHLY ' if imbalance_ratio > 10 else ''}imbalanced.")
                lines.append("")

        # ── Numerical Features ──
        lines.append("─── NUMERICAL FEATURES ───")
        lines.append(f"  Count: {len(numerical_cols)}")
        for col in numerical_cols:
            s = stats["per_column"].get(col, {})
            lines.append(f"    {col:<40s}  missing={s.get('missing_count',0):,}  "
                          f"inf={s.get('inf_count',0):,}  unique={s.get('unique_count',0):,}")
        lines.append("")

        # ── Categorical Features ──
        lines.append("─── CATEGORICAL FEATURES ───")
        lines.append(f"  Count: {len(categorical_cols)}")
        for col in categorical_cols:
            s = stats["per_column"].get(col, {})
            lines.append(f"    {col:<40s}  missing={s.get('missing_count',0):,}  "
                          f"unique={s.get('unique_count',0):,}")
        lines.append("")

        # ── Temporal Features ──
        lines.append("─── TEMPORAL FEATURES ───")
        for col in column_groups.get("temporal", []):
            lines.append(f"    {col}")
        if not column_groups.get("temporal"):
            lines.append("    (none detected)")
        lines.append("")

        # ── Device Features ──
        lines.append("─── DEVICE FEATURES ───")
        for col in column_groups.get("device", []):
            lines.append(f"    {col}")
        if not column_groups.get("device"):
            lines.append("    (none detected)")
        lines.append("")

        # ── Network Features ──
        lines.append("─── NETWORK / PROTOCOL / FLOW FEATURES ───")
        for group in ["network", "protocol", "flow"]:
            lines.append(f"  [{group.upper()}]")
            for col in column_groups.get(group, []):
                lines.append(f"    {col}")
        lines.append("")

        # ── Graph Candidates ──
        lines.append("─── POSSIBLE GRAPH FEATURES ───")
        for group, cols in graph_candidates.items():
            lines.append(f"  [{group}]")
            for col in cols:
                lines.append(f"    {col}")
        lines.append("")

        # ── High-Cardinality Assessment ──
        lines.append("─── HIGH-CARDINALITY ASSESSMENT (ALL COLUMNS) ───")
        lines.append(f"  {'Column':<40s} {'Card.':>8s} {'%Uniq':>8s} {'Missing%':>10s} {'Rec.':>8s}")
        lines.append("  " + "-" * 76)
        for entry in cardinality_assessment:
            lines.append(
                f"  {entry['column']:<40s} "
                f"{entry['cardinality']:>8,} "
                f"{entry['pct_unique']:>7.2f}% "
                f"{entry['missing_pct']:>9.2f}% "
                f"{entry['recommendation']:>8s}"
            )
        lines.append("")

        # Detail for REVIEW and FLAG columns
        flagged = [e for e in cardinality_assessment if e["recommendation"] in ("REVIEW", "FLAG")]
        if flagged:
            lines.append("  DETAILED NOTES FOR FLAGGED/REVIEW COLUMNS:")
            for entry in flagged:
                lines.append(f"  [{entry['recommendation']}] {entry['column']}")
                lines.append(f"    Usefulness : {entry['usefulness']}")
                lines.append(f"    Reason     : {entry['recommendation_reason']}")
                lines.append("")

        # ── Missing / Invalid Values ──
        lines.append("─── MISSING / INVALID VALUES ───")
        any_missing = False
        for col, s in stats["per_column"].items():
            if s["missing_count"] > 0 or s["inf_count"] > 0:
                any_missing = True
                lines.append(f"  {col:<40s}  missing={s['missing_count']:,} ({s['missing_pct']:.2f}%)  "
                              f"inf={s['inf_count']:,}")
        if not any_missing:
            lines.append("  No missing or infinite values detected.")
        lines.append("")

        # ── Duplicates ──
        lines.append("─── DUPLICATES ───")
        lines.append(f"  Sample size        : {stats['duplicate_sample_size']:,}")
        lines.append(f"  Duplicates in sample: {stats['duplicates_in_sample']:,}")
        lines.append(f"  Estimated total    : {stats['estimated_duplicate_rows']:,}")
        lines.append(f"  Duplicate ratio    : {stats['duplicate_ratio_pct']:.2f}%")
        lines.append("")

        # ── Saved Plots ──
        lines.append("─── SAVED VISUALIZATIONS ───")
        for p in saved_plots:
            lines.append(f"  {p}")
        lines.append("")

        # ── Recommended Next Step ──
        lines.append("─── RECOMMENDED NEXT STEP ───")
        lines.append("  1. Review this report and the column cardinality assessment.")
        lines.append("  2. Decide which columns (if any) to drop — update configs/preprocessing_config.json.")
        lines.append("  3. Run the preprocessing pipeline (preprocessing/iot_preprocessor.py).")
        lines.append("  4. DO NOT drop columns automatically; every drop must be a conscious decision.")
        lines.append("")
        lines.append(sep)

        return "\n".join(lines)

    def save_json_report(self, all_results: Dict, output_path: str) -> None:
        """Save full inspection results as JSON."""
        # Make JSON-serializable
        def _serialize(obj):
            if isinstance(obj, (np.integer,)):
                return int(obj)
            if isinstance(obj, (np.floating,)):
                return float(obj)
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            if isinstance(obj, set):
                return list(obj)
            if isinstance(obj, Path):
                return str(obj)
            return str(obj)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_results, f, indent=2, default=_serialize, ensure_ascii=False)

    # ─────────────────────────────────────────────────────────────
    # 12. Full Inspection Orchestrator
    # ─────────────────────────────────────────────────────────────
    def run_full_inspection(self) -> Dict[str, Any]:
        """Run the complete inspection pipeline and save all outputs."""
        print("\n[1/8] Discovering files...")
        files = self.discover_files()
        if not files:
            print("ERROR: No CSV files found in", self.raw_dir)
            return {}

        # For now, process the first (or only) CSV file
        file_info = files[0]
        filepath = file_info["filepath"]
        print(f"  Found: {file_info['filename']} ({file_info['size_mb']:.1f} MB)")

        print("\n[2/8] Inspecting schema...")
        schema = self.inspect_schema(filepath)
        columns = schema["columns"]
        print(f"  Columns: {len(columns)}")

        print("\n[3/8] Computing statistics (this may take a few minutes)...")
        stats = self.compute_statistics(filepath)
        print(f"  Rows: {stats['total_rows']:,}")

        print("\n[4/8] Detecting target/label columns...")
        target_info = self.detect_target_columns(filepath)
        for col, info in target_info.items():
            print(f"  Found: {col} ({info['num_unique']} unique values)")

        print("\n[5/8] Classifying columns semantically...")
        column_groups = self.classify_columns(columns, stats["per_column"])
        for group, cols in column_groups.items():
            if cols:
                print(f"  {group}: {len(cols)} columns")

        print("\n[6/8] Assessing cardinality...")
        cardinality_assessment = self.assess_cardinality(
            columns, stats["per_column"], stats["total_rows"], column_groups
        )
        flag_count = sum(1 for e in cardinality_assessment if e["recommendation"] == "FLAG")
        review_count = sum(1 for e in cardinality_assessment if e["recommendation"] == "REVIEW")
        keep_count = sum(1 for e in cardinality_assessment if e["recommendation"] == "KEEP")
        print(f"  KEEP: {keep_count}, REVIEW: {review_count}, FLAG: {flag_count}")

        numerical_cols, categorical_cols = self.classify_numerical_categorical(
            columns, stats["per_column"]
        )

        print("\n[7/8] Identifying graph-construction candidates...")
        graph_candidates = self.identify_graph_candidates(columns)
        for group, cols in graph_candidates.items():
            if cols:
                print(f"  {group}: {cols}")

        print("\n[8/8] Generating plots...")
        saved_plots = self.generate_plots(filepath, target_info, stats["per_column"], columns)

        # ── Compile all results ──
        all_results = {
            "file_info": file_info,
            "schema": schema,
            "statistics": stats,
            "target_columns": {
                col: {
                    "unique_values": [str(v) for v in info["unique_values"]],
                    "num_unique": info["num_unique"],
                    "value_counts": info["value_counts"],
                }
                for col, info in target_info.items()
            },
            "column_groups": column_groups,
            "cardinality_assessment": cardinality_assessment,
            "graph_candidates": graph_candidates,
            "numerical_columns": numerical_cols,
            "categorical_columns": categorical_cols,
            "saved_plots": saved_plots,
        }

        # ── Save text report ──
        text_report = self.generate_text_report(
            file_info, schema, stats, target_info, column_groups,
            cardinality_assessment, graph_candidates,
            numerical_cols, categorical_cols, saved_plots,
        )
        text_path = self.output_dir / "edge_iiot_inspection.txt"
        with open(text_path, "w", encoding="utf-8") as f:
            f.write(text_report)
        print(f"\n  Text report saved: {text_path}")

        # ── Save JSON report ──
        json_path = self.output_dir / "edge_iiot_inspection.json"
        self.save_json_report(all_results, str(json_path))
        print(f"  JSON report saved: {json_path}")

        # ── Print summary to console ──
        print("\n" + text_report)

        return all_results


if __name__ == "__main__":
    # Default paths relative to project root
    project_root = Path(__file__).resolve().parent.parent
    inspector = EdgeIIoTInspector(
        raw_dir=str(project_root / "data" / "raw" / "edge_iiot"),
        output_dir=str(project_root / "reports"),
        figures_dir=str(project_root / "data" / "processed" / "edge_iiot" / "figures"),
    )
    inspector.run_full_inspection()
