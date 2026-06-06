# LLM-Assisted Insurance and Survey Automation
## Human Review & Quality Assurance Rubric

---

### 1. Image & Evidence Accuracy (Score 0-2 per item)
Objective verification that all observations match visible evidence exactly.

- The container number matches the image exactly (no transcription errors).
- Seal numbers are correctly identified and visibly present.
- Unit ID accurately transcribed.
- Displayed temperatures (SETPOINT, RETURN, SUPPLY) match images.
- Data logger readings match display.
- Cargo branding and labels match visible text.
- Described damage is clearly visible in the image.
- Regulatory or inspection tags accurately described.

---

### 2. Quantitative & Technical Accuracy (Score 0-2 per item)
Verification of calculations, conversions, and temperature logic.

- Temperature differentials calculated correctly.
- Fahrenheit-Celsius conversions are accurate.
- Proper frozen cargo standard applied (-18°C / 0°F typical benchmark).
- Technical interpretations (heat load, airflow restriction) are sound.
- No incorrect thermodynamic or food safety conclusions.

---

### 3. Evidence Grounding & Traceability (Score 0-2 per category)
Ensures analytical statements are tied to visible evidence or compliance documentation.

- All claims supported by image evidence or documented readings.
- Compliance references match provided PDF documentation.
- Speculative language clearly labeled (e.g., 'suggests', 'may indicate').
- No unsupported microbiological or spoilage claims.
- No hallucinated regulatory standards or entities.

---

### 4. Compliance & Regulatory Interpretation (Score 0-2 per category)
Evaluation of correct regulatory and documentation interpretation.

- Correct interpretation of 'KEEP FROZEN' requirements.
- Accurate interpretation of USDA or inspection tags.
- Data logger programmed ranges are correctly interpreted.
- No overstated regulatory violations without clear evidence.

---

### 5. Causation & Risk Language Control (Score 0-2 per category)
Ensures neutral, legally appropriate language is used.

- Observational and neutral tone maintained.
- No assignment of liability.
- No definitive causation claims without full evidence.
- Appropriate use of qualifying language (e.g., 'may indicate').

---

### 6. Structural Completeness (Score 0-2 per category)
Ensures all required report sections are properly completed.

- Container condition section complete.
- Reefer performance section complete.
- Cargo condition section complete.
- Temperature monitoring section complete.
- Mitigation recommendations provided.
- Extent of loss section appropriately qualified.

---

### 7. Professional Report Quality (Score 0-2 per category)
Overall clarity, consistency, and professional presentation.

- Clear and readable language.
- Consistent terminology and measurement units.
- No contradictions between sections.
- No fabricated manufacturers, serial numbers, or standards.

---

### 8. Semantic Comparison Evaluation — LLM-as-Judge Framework (Score 0-2 per category)

- A validated human-written or approved reference report is used as ground truth.
- The AI-generated report is evaluated against the reference.
- The judge LLM compares both reports without being informed which is human vs AI (bias control).
- Evaluation focuses on semantic equivalence, not wording similarity.

---

## Scoring Summary

| Category | Maximum Points |
|---|---|
| Image & Evidence Accuracy | 16 |
| Quantitative & Technical Accuracy | 10 |
| Evidence Grounding & Traceability | 10 |
| Compliance & Regulatory Interpretation | 8 |
| Causation & Risk Language Control | 8 |
| Structural Completeness | 12 |
| Professional Report Quality | 8 |
| Semantic Comparison Evaluation (LLM-as-Judge Framework) | 8 |
| **Total Possible** | **80** |

---

## Approval Thresholds

| Score | Decision |
|---|---|
| 65–80 | ✅ Approved |
| 55–64 | 🟡 Minor Revisions Required |
| 40–54 | 🟠 Major Revisions Required |
| Below 40 | 🔴 Reject / Regenerate Report |
