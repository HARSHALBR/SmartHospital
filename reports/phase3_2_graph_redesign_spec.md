# Phase 3.2 Graph Redesign Specification

## 1. Flow Identity
```json
{
  "TCP": "(protocol, ip.src_host, ip.dst_host, tcp.srcport, tcp.dstport)",
  "UDP": "(protocol, ip.src_host, ip.dst_host, udp.port, udp.stream)",
  "ICMP": "(protocol, ip.src_host, ip.dst_host)",
  "missing_fields": "Fields not relevant to the protocol are excluded. If a port is missing within a protocol, it is mapped to -1."
}
```

## 2. Temporal Window Design
```json
{
  "time_analysis": {
    "timestamp_format": "YYYY-MM-DD HH:MM:SS (extracted from frame.time)",
    "min_timestamp": "1999-09-12 21:00:00",
    "max_timestamp": "2033-07-12 21:00:00",
    "is_monotonic": false,
    "time_span_seconds": 1067644800.0,
    "recommended_window": "10 seconds"
  },
  "strategy": "C. Flow + Time windows. We use 10-second fixed time windows based on actual `frame.time` timestamps. A large persistent flow will span multiple 10-second windows as separate continuous edges, preserving temporal dynamics without artificial 25k-row breaks."
}
```

## 3. Edge Definition
One edge = (protocol-aware flow identity) aggregated over a (10-second temporal window). Long-lived flows become a sequence of edges across consecutive windows.

## 4. Labeling Rule
```json
{
  "binary": "max(Attack_label) -> ATTACK if ANY packet is attack.",
  "multiclass": "Pure Normal -> Normal, Pure Attack -> Attack Type, Mixed -> MIXED_ATTACK",
  "prototype_mixed_edges": 16
}
```

## 5 & 6. Features
- Edge Features Count: 44
- Leakage Absent: True

## 7. Train/Test Split
C. Endpoint/Group-level split (PRIMARY).
Splitting by IP subnets or specific endpoints ensures that communication pairs in the test set have NEVER been seen in the training set. This tests true generalization to new devices. 
SECONDARY: Temporal split. Train on past, test on future.

## 8. Artificial Imbalance Simulation
### CURRENT (25k chunks)
```json
{
  "row_counts": 100000,
  "unique_flows": 49837,
  "flow_window_edges": 68750,
  "normal_edges": 45178,
  "attack_edges": 23490,
  "mixed_edges": 82,
  "average_packets_per_edge": 1.4545454545454546,
  "median_packets_per_edge": 1.0,
  "maximum_packets_per_edge": 5657
}
```
### PROPOSED (10s windows, protocol-aware)
```json
{
  "row_counts": 100000,
  "unique_flows": 49837,
  "flow_window_edges": 72513,
  "normal_edges": 52706,
  "attack_edges": 19791,
  "mixed_edges": 16,
  "average_packets_per_edge": 1.302083764290541,
  "median_packets_per_edge": 1.0,
  "maximum_packets_per_edge": 157
}
```

## 10. Scientific Validity Check
```json
{
  "meaningful_edges": "Yes, edges now represent actual temporal flows (e.g. 10s of communication).",
  "normal_collapse": "Normal traffic still aggregates significantly, but DDoS is also grouped into time windows. However, DDoS port randomization still fragments DDoS flows. To solve this, DDoS port randomization might require endpoint-level aggregation if we want to collapse it.",
  "mixed_flows": "Correctly labeled as MIXED_ATTACK.",
  "leakage_removed": true,
  "split_controlled": "Yes, by moving to Endpoint-level splits."
}
```
