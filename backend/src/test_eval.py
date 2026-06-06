import os
import json
import argparse
from evaluation.judge_llm import evaluate_reports
from utils.file import load_file_text, write_to_file
from utils.llm_client import getLLMClient
from dotenv import load_dotenv

load_dotenv()


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate a generated survey report against a reference.")
    parser.add_argument("--reference", required=True, help="Path to the reference report (PDF or MD)")
    parser.add_argument("--generated", required=True, help="Path to the generated report (MD)")
    parser.add_argument("--output", default="results/eval_output.json", help="Output path (default: results/eval_output.json)")
    return parser.parse_args()


def main():
    args = parse_args()

    reference_text = load_file_text(args.reference)
    generated_text = load_file_text(args.generated)

    client = getLLMClient("google")

    result = evaluate_reports(reference_text, generated_text, client)

    with open(args.output, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Saved evaluation to {args.output}")
    print(f"Score: {result['total_score']}/{result['max_score']}")


if __name__ == "__main__":
    main()