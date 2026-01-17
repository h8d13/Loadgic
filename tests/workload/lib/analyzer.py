#!/usr/bin/env python3
"""Data analyzer with conditional processing paths."""
import sys
import random
import time

def analyze(data: list[int], mode: str = "basic") -> dict:
    #lg=en_
    print(f"Analyzing {len(data)} items in '{mode}' mode...")

    result = {"count": len(data), "mode": mode}

    #lg=br_
    # Quick exit for empty data
    if not data:
        print("  [skip] No data to analyze")
        result["status"] = "empty"
        #lg=ex_
        return result

    #lg=br_
    # Basic stats
    result["sum"] = sum(data)
    result["avg"] = result["sum"] / len(data)
    result["min"] = min(data)
    result["max"] = max(data)
    time.sleep(0.05)

    #lg=br_
    if mode == "basic":
        print("  [basic] Returning simple stats")
        result["status"] = "basic_complete"
        #lg=ex_
        return result

    #lg=br_
    # Deep analysis
    print("  [deep] Computing variance...")
    mean = result["avg"]
    variance = sum((x - mean) ** 2 for x in data) / len(data)
    result["variance"] = variance
    result["std_dev"] = variance ** 0.5
    time.sleep(0.1)

    #lg=br_
    if mode == "stats":
        print("  [stats] Returning statistical analysis")
        result["status"] = "stats_complete"
        #lg=ex_
        return result

    #lg=br_
    # Full analysis with outlier detection
    print("  [full] Detecting outliers...")
    std = result["std_dev"]
    outliers = [x for x in data if abs(x - mean) > 2 * std]
    result["outliers"] = outliers
    result["outlier_count"] = len(outliers)
    time.sleep(0.15)

    #lg=br_
    # Percentile calculation
    print("  [full] Computing percentiles...")
    sorted_data = sorted(data)
    n = len(sorted_data)
    result["p25"] = sorted_data[n // 4]
    result["p50"] = sorted_data[n // 2]
    result["p75"] = sorted_data[3 * n // 4]
    time.sleep(0.1)

    result["status"] = "full_complete"
    #lg=ex_
    return result


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "basic"
    size = int(sys.argv[2]) if len(sys.argv) > 2 else 100

    # Generate test data
    data = [random.randint(1, 1000) for _ in range(size)]

    result = analyze(data, mode)
    print(f"\nResult: {result['status']}")
    for k, v in result.items():
        if k != "status":
            print(f"  {k}: {v}")
