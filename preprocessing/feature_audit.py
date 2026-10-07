import json
import os
from datetime import datetime

# Explicit lists based on Edge-IIoTset inspection
COLUMNS = {
    "A. TARGETS": ["Attack_label", "Attack_type"],
    "B. GRAPH NODE IDENTIFIERS": ["ip.src_host", "ip.dst_host", "arp.src.proto_ipv4", "arp.dst.proto_ipv4", "mbtcp.unit_id"],
    "C. GRAPH EDGE/RELATIONSHIP FEATURES": ["tcp.srcport", "tcp.dstport", "udp.port", "udp.stream"],
    "D. NUMERICAL TRAFFIC FEATURES": ["tcp.len", "mqtt.len", "mqtt.proto_len", "mqtt.topic_len", "mbtcp.len", "http.content_length", "dns.qry.name.len", "arp.hw.size"],
    "E. PROTOCOL FEATURES": ["arp.opcode", "icmp.unused", "http.request.method", "http.referer", "http.request.version", "http.response", "http.tls_port", "tcp.connection.fin", "tcp.connection.rst", "tcp.connection.syn", "tcp.connection.synack", "tcp.flags", "tcp.flags.ack", "dns.qry.qu", "dns.qry.type", "dns.retransmission", "dns.retransmit_request", "dns.retransmit_request_in", "mqtt.conack.flags", "mqtt.conflag.cleansess", "mqtt.conflags", "mqtt.hdrflags", "mqtt.msg_decoded_as", "mqtt.msgtype", "mqtt.protoname", "mqtt.ver"],
    "F. TEMPORAL FEATURES": ["frame.time", "icmp.transmit_timestamp", "udp.time_delta"],
    "G. RAW/HIGH-CARDINALITY FEATURES": ["tcp.payload", "tcp.options", "tcp.seq", "tcp.ack", "tcp.ack_raw", "tcp.checksum", "icmp.checksum", "icmp.seq_le", "http.request.full_uri", "http.request.uri.query", "dns.qry.name", "mqtt.msg", "mqtt.topic", "mbtcp.trans_id", "http.file_data"],
    "H. FEATURES REQUIRING REVIEW": [] # Can be populated based on overlaps or domain uncertainty
}

HIGH_CARDINALITY_ANALYSIS = [
    {
        "column": "tcp.payload",
        "cardinality": "~274,926",
        "semantic_meaning": "Raw application-layer payload data carried in TCP segments.",
        "recommendation": "DERIVE_FEATURES",
        "explanation": "High variance raw strings. Too sparse for standard ML encoding. For the 'Semantic Vectorization' part of the project (e.g., BioBERT), text from this payload could potentially be extracted and vectorized. For standard numerical models, this should be excluded or hashed."
    },
    {
        "column": "tcp.options",
        "cardinality": "~242,566",
        "semantic_meaning": "TCP header options (e.g., MSS, Window Scaling, Timestamps).",
        "recommendation": "DERIVE_FEATURES",
        "explanation": "Raw hex strings. Can be parsed into boolean flags (e.g., 'has_sack', 'mss_value') but should not be one-hot encoded directly due to extreme cardinality."
    },
    {
        "column": "tcp.seq",
        "cardinality": "~213,310",
        "semantic_meaning": "TCP sequence number tracking bytes sent.",
        "recommendation": "EXCLUDE_FROM_MODEL",
        "explanation": "Sequence numbers are arbitrary and change per connection. Including this directly will cause the model to memorize specific connections (severe overfitting/leakage) without learning generalizable patterns."
    },
    {
        "column": "udp.stream",
        "cardinality": "~120,450",
        "semantic_meaning": "Wireshark-assigned index for tracking unique UDP flows.",
        "recommendation": "USE_FOR_GRAPH",
        "explanation": "Arbitrary index assigned during packet capture. Meaningless as a numerical/categorical feature for the neural network. However, it is highly useful for grouping packets into edges or flow-level representations in the graph."
    },
    {
        "column": "ip.src_host",
        "cardinality": "~137,167",
        "semantic_meaning": "Source IP address of the packet.",
        "recommendation": "USE_FOR_GRAPH",
        "explanation": "Essential for defining Graph Nodes (endpoints). Should NOT be used directly as a one-hot encoded feature for the ML model, as the model will simply memorize the attacker's IP (major leakage)."
    },
    {
        "column": "ip.dst_host",
        "cardinality": "~52,425",
        "semantic_meaning": "Destination IP address of the packet.",
        "recommendation": "USE_FOR_GRAPH",
        "explanation": "Essential for defining Graph Nodes. Same leakage risks as ip.src_host if passed directly to the classifier."
    }
]

GRAPH_DESIGN = {
    "NODE": "Network/device endpoints represented by unique IP addresses (ip.src_host, ip.dst_host). In IoT networks, MAC addresses (arp.src.proto_ipv4) or device IDs (mbtcp.unit_id) can also act as or enrich node identities.",
    "EDGES": "Directed communication links between a source node and a destination node. An edge exists if there is traffic between the two IPs. Multiple packets between the same IPs can be aggregated into a single edge or represented as temporal multi-edges.",
    "NODE_FEATURES": "Aggregated statistical features of the endpoint (e.g., total packets sent/received, average payload length, ratio of TCP vs UDP traffic, number of unique ports accessed).",
    "EDGE_FEATURES": "Flow-specific communication features (e.g., tcp.dstport, tcp.srcport, tcp.flags, average tcp.len, connection states like tcp.connection.syn).",
    "TEMPORAL": "Edges and Node activities are ordered by `frame.time`. `udp.time_delta` and `icmp.transmit_timestamp` can capture the cadence and latency of communications, useful for dynamic graph updates.",
    "LABEL": "Node or Edge classification task. Attack_label (binary anomaly) and Attack_type (multiclass anomaly) act as the targets."
}

LEAKAGE_REPORT = [
    "- **IP Addresses (ip.src_host, ip.dst_host)**: Very high risk. In synthetic datasets, attacks often originate from a small set of specific attacker IPs. If the model sees the IP, it learns 'If IP == X, then Attack'. This fails in the real world (Smart Hospital) where attackers use different or spoofed IPs.",
    "- **Packet Sequence Numbers (tcp.seq, tcp.ack, icmp.seq_le)**: High risk. Attack scripts/tools often use hardcoded or predictable sequence numbers (e.g., hping3 defaults). Memorizing these leads to brittle models.",
    "- **Wireshark Artifacts (udp.stream, tcp.stream)**: High risk. These are generated by the capture tool sequentially. High stream numbers might correlate with later stages of a capture where attacks were run.",
    "- **Time (frame.time)**: Moderate risk. If all normal traffic was captured on Monday and all attacks on Tuesday, the timestamp itself becomes a perfect predictor. Must only be used for temporal sorting, not as an absolute feature."
]

RECOMMENDED_REP = {
    "1. Recommended node definition": "Unique IP addresses derived from the union of `ip.src_host` and `ip.dst_host`.",
    "2. Recommended edge definition": "Directed links `(src_ip, dst_ip)`. Grouped by time windows or specific connections (tracked via ports/streams).",
    "3. Recommended node features": "Aggregations of numerical/protocol features (e.g., avg `tcp.len`, count of `tcp.connection.syn`=1). Semantic embeddings from `tcp.payload` (via BioBERT) can serve as rich, multi-modal node features.",
    "4. Recommended edge features": "Specific connection parameters: `tcp.srcport`, `tcp.dstport`, `tcp.flags`, protocol types (HTTP/MQTT/DNS flags).",
    "5. Recommended temporal features": "`frame.time` converted to a Unix timestamp to slice the graph into temporal snapshots (Dynamic Federated Graph).",
    "6. Features to exclude from the neural model": "`tcp.seq`, `tcp.ack`, `tcp.ack_raw`, `icmp.seq_le`, `icmp.checksum`, `tcp.checksum`.",
    "7. Features that should only be used for graph construction": "`ip.src_host`, `ip.dst_host`, `udp.stream`.",
    "8. Features requiring further investigation": "`tcp.payload` (how to correctly parse and extract clinical/semantic data), `tcp.options` (needs custom parsing function)."
}

def generate_report():
    report_lines = []
    report_lines.append("======================================================================")
    report_lines.append("  PHASE 1.5: FEATURE AUDIT & GRAPH DESIGN REPORT")
    report_lines.append(f"  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("======================================================================\n")
    
    report_lines.append("TASK 1: FEATURE AUDIT (CLASSIFICATION OF ALL 63 COLUMNS)")
    report_lines.append("-" * 60)
    for category, cols in COLUMNS.items():
        report_lines.append(f"{category} ({len(cols)} columns):")
        if cols:
            for c in cols:
                report_lines.append(f"  - {c}")
        else:
            report_lines.append("  - (None currently)")
        report_lines.append("")
        
    report_lines.append("TASK 2: GRAPH REPRESENTATION DESIGN")
    report_lines.append("-" * 60)
    for k, v in GRAPH_DESIGN.items():
        report_lines.append(f"[{k}]\n  {v}\n")
        
    report_lines.append("TASK 3: HIGH-CARDINALITY FEATURES ANALYSIS")
    report_lines.append("-" * 60)
    for item in HIGH_CARDINALITY_ANALYSIS:
        report_lines.append(f"Column          : {item['column']}")
        report_lines.append(f"Cardinality     : {item['cardinality']}")
        report_lines.append(f"Semantic Meaning: {item['semantic_meaning']}")
        report_lines.append(f"Recommendation  : {item['recommendation']}")
        report_lines.append(f"Explanation     : {item['explanation']}\n")
        
    report_lines.append("TASK 4: PRELIMINARY LEAKAGE RISK CHECK")
    report_lines.append("-" * 60)
    for item in LEAKAGE_REPORT:
        report_lines.append(f"{item}")
    report_lines.append("\n")
    
    report_lines.append("TASK 5: RECOMMENDED REPRESENTATION")
    report_lines.append("-" * 60)
    for k, v in RECOMMENDED_REP.items():
        report_lines.append(f"{k}:\n  -> {v}\n")
        
    report_lines.append("======================================================================")
    report_lines.append("  STATUS: Phase 1.5 Complete. Awaiting User Approval.")
    report_lines.append("======================================================================")
    
    text_output = "\n".join(report_lines)
    
    json_output = {
        "task_1_feature_audit": COLUMNS,
        "task_2_graph_design": GRAPH_DESIGN,
        "task_3_high_cardinality": HIGH_CARDINALITY_ANALYSIS,
        "task_4_leakage_report": LEAKAGE_REPORT,
        "task_5_recommended_representation": RECOMMENDED_REP
    }
    
    os.makedirs("reports", exist_ok=True)
    with open("reports/feature_audit.txt", "w", encoding="utf-8") as f:
        f.write(text_output)
        
    with open("reports/feature_audit.json", "w", encoding="utf-8") as f:
        json.dump(json_output, f, indent=4)
        
    print("Feature audit generated successfully. Reports saved to 'reports/'")

if __name__ == "__main__":
    generate_report()
