#!/usr/bin/env python3
"""Input validator with multiple check stages."""
import sys
import time
import re

def validate(value: str, strict: bool = False) -> tuple[bool, str, list[str]]:
    #lg=en_
    errors: list[str] = []
    print(f"Validating: '{value}' (strict={strict})")

    #lg=br_
    # Stage 1: Empty check
    if not value or not value.strip():
        print("  [x] Empty value")
        #lg=ex_
        return False, "empty", ["Value cannot be empty"]

    value = value.strip()

    #lg=br_
    # Stage 2: Length check
    if len(value) < 3:
        errors.append("Too short (min 3 chars)")
        print("  [!] Too short")
    elif len(value) > 50:
        errors.append("Too long (max 50 chars)")
        print("  [!] Too long")
    else:
        print("  [✓] Length OK")

    time.sleep(0.02)

    #lg=br_
    # Stage 3: Character validation
    if not value[0].isalpha():
        errors.append("Must start with letter")
        print("  [!] Invalid start char")
    else:
        print("  [✓] Start char OK")

    #lg=br_
    if not re.match(r'^[a-zA-Z0-9_-]+$', value):
        errors.append("Only alphanumeric, underscore, hyphen allowed")
        print("  [!] Invalid characters")
    else:
        print("  [✓] Characters OK")

    time.sleep(0.02)

    #lg=br_
    # Stage 4: Strict mode checks
    if strict:
        print("  [strict] Running additional checks...")
        time.sleep(0.05)

        #lg=br_
        if value.lower() in ["admin", "root", "system", "null"]:
            errors.append("Reserved word not allowed")
            print("  [!] Reserved word")

        #lg=br_
        if not any(c.isupper() for c in value):
            errors.append("Must contain uppercase letter")
            print("  [!] No uppercase")

        #lg=br_
        if not any(c.isdigit() for c in value):
            errors.append("Must contain digit")
            print("  [!] No digit")

    #lg=br_
    # Final result
    if errors:
        status = "invalid"
        print(f"  Result: {len(errors)} error(s)")
        #lg=ex_
        return False, status, errors

    print("  Result: Valid!")
    #lg=ex_
    return True, "valid", []


if __name__ == "__main__":
    test_values = sys.argv[1:] if len(sys.argv) > 1 else ["Hello1", "ab", "", "admin", "ValidName123"]
    strict = "--strict" in sys.argv
    test_values = [v for v in test_values if v != "--strict"]

    print("=== Validator Demo ===\n")

    for val in test_values:
        valid, status, errors = validate(val, strict)
        if errors:
            for e in errors:
                print(f"    → {e}")
        print()
