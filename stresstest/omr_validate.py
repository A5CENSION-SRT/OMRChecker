import json
import os
from glob import glob

GENERATED_FILE = "generated_omrs/omr_data.json" # file with all answers
READ_RESULTS_DIR = "../backend/storage/results/batch_20251218_140803" # point this to the resultant folder of the completed batch

def normalize_q_key(q):
    q = q.strip().lower().replace("q", "")
    return f"Q{int(q):01d}"

def load_generated_answers(path):
    with open(path, "r") as f:
        data = json.load(f)

    roll_to_answers = {}
    for sheet_name, sheet_data in data.items():
        roll_to_answers[sheet_data["rollNumber"]] = sheet_data["answers"]
    return roll_to_answers

def compare_omr_results(generated_data, read_data):
    roll = read_data.get("rollNumber")
    if roll not in generated_data:
        return {"rollNumber": roll, "status": "not_found_in_generated"}

    gen_answers = generated_data[roll]
    read_answers = read_data.get("responses", {})

    correct_count = 0
    total = len(gen_answers)
    mismatches = []

    for q_num, correct_opt in gen_answers.items():
        normalized_q = normalize_q_key(q_num)
        read_opt = read_answers.get(normalized_q.lower()) or read_answers.get(normalized_q)
        if read_opt and read_opt.upper() == correct_opt.upper():
            correct_count += 1
        else:
            mismatches.append({
                "question": normalized_q,
                "expected": correct_opt,
                "detected": read_opt or "-"
            })

    accuracy = correct_count / total * 100
    return {
        "rollNumber": roll,
        "correct": correct_count,
        "total": total,
        "accuracy": round(accuracy, 2),
        "mismatches": mismatches
    }

def main():
    generated_data = load_generated_answers(GENERATED_FILE)
    result_files = glob(os.path.join(READ_RESULTS_DIR, "*.json"))

    all_results = []
    for file_path in result_files:
        with open(file_path, "r") as f:
            read_data = json.load(f)
        result = compare_omr_results(generated_data, read_data)
        all_results.append(result)

    # --- Print Summary ---
    print("\n=== OMR Comparison Summary ===\n")
    for res in all_results:
        if res.get("status") == "not_found_in_generated":
            print(f"Warning: Roll {res['rollNumber']} not found in generated file")
            continue
        print(f"🎯 Roll {res['rollNumber']}: {res['correct']}/{res['total']} correct ({res['accuracy']}%)")
        if res["mismatches"]:
            print("!!! Mismatches:")
            for m in res["mismatches"]:
                print(f"      {m['question']}: expected {m['expected']} but detected {m['detected']}")
        print()

    avg_accuracy = sum(r["accuracy"] for r in all_results if "accuracy" in r) / len(all_results)
    print(f"Average Accuracy: {avg_accuracy:.2f}%")

if __name__ == "__main__":
    main()
