import requests, json, time

# Give uvicorn a moment to reload after the file change
time.sleep(3)

# Step 1: Upload file
with open(r'C:\Users\lenovo\OneDrive\Desktop\Axiom\test_fairness.csv', 'rb') as f:
    r = requests.post('http://127.0.0.1:8000/api/upload', files={'file': ('test_fairness.csv', f, 'text/csv')})
print("UPLOAD:", r.status_code, r.json().get("columns",""))

# Step 2: Run audit
r2 = requests.post('http://127.0.0.1:8000/api/audit', data={"target_col": "loan_approved", "sensitive_cols": "gender,race"})
print("AUDIT:", r2.status_code)

if r2.status_code == 200:
    result = r2.json()
    for col, audit in result.get("audits", {}).items():
        ex = audit.get("executive_summary", {})
        metrics = audit.get("metrics", {})
        print(f"\n{'='*40}")
        print(f"ATTRIBUTE: {col}")
        print(f"Risk Level: {ex.get('risk_level')} | Score: {audit.get('overall_fairness_score')}/100")
        print(f"Findings : {ex.get('key_findings', [])}")
        print(f"Metrics  : {list(metrics.keys())}")
        if "demographic_parity" in metrics:
            dp = metrics["demographic_parity"]
            print(f"Dem Parity: diff={dp.get('difference')} | {dp.get('interpretation','')[:40]}")
        if "equalized_odds" in metrics:
            eo = metrics["equalized_odds"]
            print(f"Eq Odds: TPR gap={eo.get('tpr_difference')} | FPR gap={eo.get('fpr_difference')}")
        if "disparate_impact" in metrics:
            di = metrics["disparate_impact"]
            print(f"Disp Impact: ratio={di.get('disparate_impact_ratio')} | 80% rule={di.get('passes_80_percent_rule')} | sev={di.get('severity')}")
        if "predictive_parity" in metrics:
            pp = metrics["predictive_parity"]
            print(f"Pred Parity: max_diff={pp.get('max_difference')} | fair={pp.get('is_fair')}")
        if "calibration" in metrics and not metrics["calibration"].get("_missing"):
            c = metrics["calibration"]
            print(f"Calibration: max_error={c.get('max_calibration_error')} | fair={c.get('is_fair')}")
        if "feature_influence" in metrics and not metrics["feature_influence"].get("_missing"):
            fi = metrics["feature_influence"]
            print(f"Features: {list(fi.get('top_influential_features',{}).keys())[:3]}")
        print(f"Recs: {audit.get('recommendations',['(none)'])[0]}")
        print(f"Limits: {audit.get('limitations',['(none)'])[0]}")
else:
    print("RAW ERROR:", r2.text[:2000])
