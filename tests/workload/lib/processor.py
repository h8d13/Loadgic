#!/usr/bin/env python3
"""Task processor with validation and retry logic."""
import sys
import random
import time

def process_task(task_id: int, difficulty: str = "normal") -> tuple[bool, str]:
    #lg=en_
    print(f"  Task {task_id} ({difficulty})...")
    #lg=br_
    # Validate task ID
    if task_id < 0:
        print(f"    [reject] Invalid task ID")
        #lg=ex_
        return False, "invalid_id"

    #lg=br_
    # Simulate processing based on difficulty
    if difficulty == "easy":
        time.sleep(0.02)
        success_rate = 0.95
    elif difficulty == "hard":
        time.sleep(0.15)
        success_rate = 0.6
    else:
        time.sleep(0.05)
        success_rate = 0.85

    #lg=br_
    # Random failure simulation
    if random.random() > success_rate:
        print(f"    [fail] Task failed")
        #lg=ex_
        return False, "failed"

    print(f"    [ok] Task complete")
    #lg=ex_
    return True, "success"


def run_batch(tasks: list[int], difficulty: str = "normal", retry: bool = False) -> dict:
    #lg=en_
    print(f"Processing batch of {len(tasks)} tasks...")

    results = {"total": len(tasks), "success": 0, "failed": 0, "retried": 0}

    #lg=br_
    if not tasks:
        print("[skip] Empty batch")
        results["status"] = "empty"
        #lg=ex_
        return results

    #lg=br_
    for task_id in tasks:
        success, status = process_task(task_id, difficulty)

        if success:
            results["success"] += 1
        else:
            #lg=br_
            # Retry logic
            if retry and status == "failed":
                print(f"    [retry] Retrying task {task_id}...")
                time.sleep(0.03)
                success, _ = process_task(task_id, "easy")
                results["retried"] += 1
                if success:
                    results["success"] += 1
                    continue

            results["failed"] += 1

    #lg=br_
    # Determine final status
    if results["failed"] == 0:
        results["status"] = "all_success"
    elif results["success"] == 0:
        results["status"] = "all_failed"
    else:
        results["status"] = "partial"

    #lg=ex_
    return results


if __name__ == "__main__":
    difficulty = sys.argv[1] if len(sys.argv) > 1 else "normal"
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    retry = "--retry" in sys.argv

    tasks = list(range(1, count + 1))

    print(f"=== Batch Processor ===")
    print(f"Difficulty: {difficulty} | Retry: {retry}\n")

    result = run_batch(tasks, difficulty, retry)

    print(f"\n=== Results ===")
    print(f"Status: {result['status']}")
    print(f"Success: {result['success']}/{result['total']}")
    if result["retried"]:
        print(f"Retried: {result['retried']}")
