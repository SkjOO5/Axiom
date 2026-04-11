"""Direct debug test — imports and runs the audit code inline to expose the traceback."""
import sys, os, traceback
sys.path.insert(0, r"C:\Users\lenovo\OneDrive\Desktop\Axiom\backend")

import pandas as pd
import numpy as np
from bias_detector import BiasDetector
from data_inspector import DataInspector
from utils import detect_sensitive_columns, encode_categorical
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

df = pd.read_csv(r"C:\Users\lenovo\OneDrive\Desktop\Axiom\test_fairness.csv")
target_col = "loan_approved"
s_cols_list = ["gender", "race"]

try:
    df_enc, encoders = encode_categorical(df)
except Exception as e:
    print("encode_categorical failed:")
    traceback.print_exc()
    sys.exit(1)

X = df_enc.drop(columns=[target_col])
y = df_enc[target_col]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
fi = model.feature_importances_
fn = X_train.columns.tolist()
acc = accuracy_score(y_test, y_pred)
print(f"Model acc: {acc:.3f}")

audits = {}
for s_col in s_cols_list:
    print(f"\nRunning audit for: {s_col}")
    sens_test = df_enc.loc[X_test.index, s_col].values
    try:
        det = BiasDetector(y_test.values, y_pred, sens_test, y_prob=y_prob, feature_importances=fi, feature_names=fn)
        audit = det.full_bias_audit()
        print(f"  Score: {audit.get('overall_fairness_score')}")
        print(f"  Metrics keys: {list(audit.get('metrics',{}).keys())}")
        inspector = DataInspector(df)
        ins = inspector.full_inspection(target_col)
        if s_col in ins.get("group_analyses", {}):
            audit["data_quality"] = ins["group_analyses"][s_col].get("data_quality", {})
            audit["representation"] = ins["group_analyses"][s_col].get("representation", {})
        audits[s_col] = audit
    except Exception as e:
        print(f"  ERROR: {e}")
        traceback.print_exc()

# Test serialization
import json

def _to_python(obj):
    if isinstance(obj, dict):
        return {k: _to_python(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_python(i) for i in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj

try:
    payload = _to_python({"accuracy": float(acc), "audits": audits})
    serialized = json.dumps(payload)
    print(f"\nSerialization OK — payload length: {len(serialized)} chars")
    print("All tests PASSED!")
except Exception as e:
    print(f"\nSerialization ERROR: {e}")
    traceback.print_exc()
