"""
Evaluation graph generation utilities.
Import and call generate_graphs() with a result dict from the /evaluate-report API.
"""

import os
import matplotlib.pyplot as plt
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Poster color scheme
NAVY      = "#0B3D52"
TEAL      = "#00B4D8"
TEAL_DARK = "#0077A8"
BLACK     = "black"

plt.rcParams.update({
    'font.size': 12,
    'font.weight': 'bold',
    'axes.titlesize': 14,
    'axes.titleweight': 'bold',
    'axes.labelsize': 12,
    'xtick.labelsize': 11,
    'ytick.labelsize': 11,
})


def generate_graphs(result: dict, output_path: str):
    categories = result["categories"]
    names = [c["name"] for c in categories]
    scores = [c["score"] for c in categories]
    max_scores = [c["max_score"] for c in categories]
    percentages = [s / m * 100 for s, m in zip(scores, max_scores)]

    wrapped_names = [n.replace(" & ", "\n& ").replace(" - ", "\n- ").replace(" — ", "\n— ") for n in names]

    output_path_1 = output_path.replace(".png", "_scores.png")
    output_path_2 = output_path.replace(".png", "_percent.png")

    # --- Chart 1: Score vs Max Score ---
    fig1, ax1 = plt.subplots(1, 1, figsize=(6, 13))
    fig1.patch.set_alpha(0.0)
    ax1.patch.set_alpha(0.0)

    y = np.arange(len(names))
    height = 0.35

    bars_max = ax1.barh(y + height / 2, max_scores, height, label="Max Score", color=NAVY, edgecolor=TEAL, linewidth=1.2)
    bars_scored = ax1.barh(y - height / 2, scores, height, label="Score Awarded", color=TEAL, edgecolor=TEAL_DARK, linewidth=1.2)

    ax1.set_title("Score vs Max Score by Category", fontweight="bold", color=BLACK, pad=12)
    ax1.set_yticks(y)
    ax1.set_yticklabels(wrapped_names, fontsize=11, color=BLACK)
    ax1.tick_params(axis='y', colors=BLACK)
    ax1.spines['left'].set_color(TEAL)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    ax1.spines['bottom'].set_visible(False)
    ax1.set_xlim(0, max(max_scores) + 4)
    ax1.xaxis.set_visible(False)
    ax1.legend(facecolor="white", edgecolor=TEAL, labelcolor=BLACK, fontsize=11)

    for bar_max, bar_score in zip(bars_max, bars_scored):
        ax1.text(bar_max.get_width() + 0.2, bar_max.get_y() + bar_max.get_height() / 2,
                 str(int(bar_max.get_width())), va="center", fontsize=10, color=BLACK)
        ax1.text(bar_score.get_width() + 0.2, bar_score.get_y() + bar_score.get_height() / 2,
                 str(int(bar_score.get_width())), va="center", fontsize=10, color=TEAL_DARK)

    plt.tight_layout()
    fig1.savefig(output_path_1, dpi=150, bbox_inches="tight", transparent=True)
    plt.close(fig1)

    # --- Chart 2: Percentage ---
    fig2, ax2 = plt.subplots(1, 1, figsize=(6, 13))
    fig2.patch.set_alpha(0.0)
    ax2.patch.set_alpha(0.0)

    bars = ax2.barh(wrapped_names, percentages, color=TEAL, edgecolor=NAVY, linewidth=0.8)
    ax2.set_title("Score % by Category", fontweight="bold", color=BLACK, pad=12)
    ax2.set_xlim(0, 110)
    ax2.tick_params(axis='y', colors=BLACK, labelsize=11)
    ax2.spines['left'].set_color(TEAL)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    ax2.spines['bottom'].set_visible(False)
    ax2.xaxis.set_visible(False)

    for bar, pct in zip(bars, percentages):
        ax2.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height() / 2,
                 f"{pct:.0f}%", va="center", fontsize=10, color=BLACK)

    plt.tight_layout()
    fig2.savefig(output_path_2, dpi=150, bbox_inches="tight", transparent=True)
    plt.close(fig2)

    return output_path_1, output_path_2