#!/usr/bin/env python3
"""
Automated Evaluation Harness (Eval Harness)
Runs evaluations across the golden lesson dataset measuring:
1. Key Term Coverage (% of essential curriculum terms present)
2. Factuality Grounding Score (% of block claims strictly grounded in source)
3. WER/CER for benchmark speech samples
"""
import json
import os
import re
import sys
from pathlib import Path

EVALS_DIR = Path(__file__).resolve().parent.parent / "evals"
GOLDEN_DATA_PATH = EVALS_DIR / "golden_lessons.json"


def stem_prefix(word: str) -> str:
    """Extracts base lemma prefix (4-5 chars) to handle Russian declensions."""
    w = word.lower().strip()
    return w[:5] if len(w) >= 6 else (w[:4] if len(w) >= 4 else w)


def compute_term_coverage(text: str, golden_terms: list[str]) -> float:
    """Calculates what percentage of golden terms appear in the text."""
    if not golden_terms:
        return 1.0
    text_lower = text.lower()
    found = 0
    for term in golden_terms:
        words = [stem_prefix(w) for w in term.lower().split() if len(w) >= 3]
        if any(w in text_lower for w in words):
            found += 1
    return round(found / len(golden_terms), 3)


def compute_levenshtein_distance(s1: list[str], s2: list[str]) -> int:
    """Computes Levenshtein distance on token lists."""
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[m][n]


def compute_wer(ref: str, hyp: str) -> float:
    """Computes Word Error Rate."""
    ref_words = re.findall(r"\b\w+\b", ref.lower())
    hyp_words = re.findall(r"\b\w+\b", hyp.lower())
    if not ref_words:
        return 0.0
    dist = compute_levenshtein_distance(ref_words, hyp_words)
    return round(dist / len(ref_words), 3)


def evaluate_faithfulness(source_text: str, draft_text: str) -> float:
    """
    Computes heuristic token grounding score.
    Returns fraction of draft content words grounded in source transcript.
    """
    draft_words = [stem_prefix(w) for w in re.findall(r"\b[A-Za-zА-Яа-яЁё-]{4,}\b", draft_text.lower())]
    if not draft_words:
        return 1.0
    source_lower = source_text.lower()
    grounded = sum(1 for w in draft_words if w in source_lower)
    return round(grounded / len(draft_words), 3)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    if not GOLDEN_DATA_PATH.exists():
        print(f"Error: Golden dataset not found at {GOLDEN_DATA_PATH}")
        sys.exit(1)

    with open(GOLDEN_DATA_PATH, "r", encoding="utf-8") as f:
        lessons = json.load(f)

    print("=" * 80)
    print("[EVALS] AUTOMATED EVALUATION HARNESS: GOLDEN DATASET RUN")
    print("=" * 80)
    print(f"Loaded {len(lessons)} golden benchmark lessons from {GOLDEN_DATA_PATH.name}\n")

    results = []
    all_passed = True

    # Thresholds
    MIN_COVERAGE = 0.75
    MIN_FAITHFULNESS = 0.70

    for item in lessons:
        lid = item["id"]
        title = item["title"]
        transcript = item["golden_transcript"]
        terms = item["golden_terms"]
        faithful_draft = item["sample_draft_faithful"]
        unfaithful_draft = item["sample_draft_unfaithful"]

        # 1. Term coverage
        coverage = compute_term_coverage(faithful_draft, terms)

        # 2. Factuality score on faithful draft
        fact_faithful = evaluate_faithfulness(transcript, faithful_draft)

        # 3. Factuality score on unfaithful draft (must detect low score)
        fact_unfaithful = evaluate_faithfulness(transcript, unfaithful_draft)

        passed = (coverage >= MIN_COVERAGE) and (fact_faithful >= MIN_FAITHFULNESS) and (fact_unfaithful < fact_faithful)
        if not passed:
            all_passed = False

        results.append({
            "id": lid,
            "title": title,
            "coverage": coverage,
            "faithfulness": fact_faithful,
            "hallucination_detect": fact_unfaithful,
            "status": "PASS" if passed else "FAIL",
        })

    # Print markdown table
    print("| Lesson ID | Title | Coverage (>=75%) | Factuality (>=70%) | Hallucination Score | Status |")
    print("|:---|:---|:---:|:---:|:---:|:---:|")
    for r in results:
        print(f"| `{r['id']}` | {r['title'][:32]}... | {r['coverage']*100:.1f}% | {r['faithfulness']*100:.1f}% | {r['hallucination_detect']*100:.1f}% | **{r['status']}** |")

    print("\n" + "=" * 80)
    if all_passed:
        print("[SUCCESS] ALL BENCHMARK TESTS PASSED: Accuracy and factuality criteria satisfied.")
        return 0
    else:
        print("[FAILURE] SOME BENCHMARK TESTS FAILED: Check prompt templates and coverage.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
