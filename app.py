import os
import re
import sys
import joblib
import pandas as pd
import nltk

from flask import Flask, request, jsonify, render_template
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Setup Flask application
app = Flask(__name__, template_folder='templates', static_folder='static')

# ====================================================
# PREPARE MODELS AND NLTK
# ====================================================
try:
    # Ensure NLTK data is loaded
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('stopwords')
    nltk.download('wordnet')

# Load SVM models and TF-IDF Vectorizer
try:
    category_model = joblib.load("models/category_model.pkl")
    priority_model = joblib.load("models/priority_model.pkl")
    vectorizer = joblib.load("models/vectorizer.pkl")
    print("Models loaded successfully.")
except Exception as e:
    print(f"Error loading models: {e}. Please ensure models are trained in models/ directory.")
    category_model, priority_model, vectorizer = None, None, None

# Initialize text preprocessors
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    if not text:
        return ""
    text = str(text).lower()
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    words = text.split()
    words = [
        lemmatizer.lemmatize(word)
        for word in words
        if word not in stop_words
    ]
    return " ".join(words)

# ====================================================
# LOAD DATASET AND COMPUTE STATS
# ====================================================
DATA_PATH = "data/customer_support_tickets.csv"
stats_data = {
    "total_tickets": 0,
    "category_dist": {},
    "priority_dist": {},
    "recent_tickets": []
}

if os.path.exists(DATA_PATH):
    try:
        df = pd.read_csv(DATA_PATH)
        stats_data["total_tickets"] = int(len(df))
        stats_data["category_dist"] = df["Ticket Type"].value_counts().to_dict()
        stats_data["priority_dist"] = df["Ticket Priority"].value_counts().to_dict()
        
        # Take a list of 25 diverse sample tickets from the dataset for the dashboard feed
        sample_rows = df[['Ticket Subject', 'Ticket Description', 'Ticket Type', 'Ticket Priority']].dropna().head(30)
        recent_tickets = []
        for idx, row in sample_rows.iterrows():
            recent_tickets.append({
                "id": int(1000 + idx),
                "subject": str(row["Ticket Subject"]),
                "description": str(row["Ticket Description"]),
                "category": str(row["Ticket Type"]),
                "priority": str(row["Ticket Priority"]),
                "status": "Open",
                "created_at": "2026-06-08"
            })
        stats_data["recent_tickets"] = recent_tickets
        print(f"Dataset stats loaded successfully. Total rows: {stats_data['total_tickets']}.")
    except Exception as e:
        print(f"Error loading CSV dataset: {e}")
else:
    print("Dataset not found at data/customer_support_tickets.csv.")

# ====================================================
# OPERATIONAL ROUTING METADATA
# ====================================================
ROUTING_INFO = {
    "Technical issue": {
        "department": "DevOps & Technical Support Tier 2",
        "checklist": [
            "Check system infrastructure status logs.",
            "Inspect customer environment specifications.",
            "Verify any API error codes or exception dumps.",
            "Escalate to engineering on-call team if core systems are down."
        ]
    },
    "Billing inquiry": {
        "department": "Accounts & Billing Operations",
        "checklist": [
            "Lookup customer account in payment gateway (Stripe/Paypal).",
            "Verify latest invoice transaction IDs and charges.",
            "Check if any coupon or promo code failed to apply.",
            "Draft manual refund or invoice adjustment if double-billed."
        ]
    },
    "Cancellation request": {
        "department": "Customer Success & Retention",
        "checklist": [
            "Analyze customer activity logs and usage history.",
            "Check if account is under any active yearly contract.",
            "Draft value recovery proposal based on usage challenges.",
            "If cancellation is final, schedule account teardown at end of billing cycle."
        ]
    },
    "Product inquiry": {
        "department": "Product Management & Sales Engineering",
        "checklist": [
            "Match requested feature against product roadmap.",
            "Provide technical documentation or user-guides.",
            "Pass enterprise sales inquiries to Account Executive team.",
            "File user request in internal product feedback backlog."
        ]
    },
    "Refund request": {
        "department": "Finance Operations & Billing",
        "checklist": [
            "Verify subscription upgrade/purchase timestamp (check 30-day window).",
            "Confirm billing refund eligibility under terms of service.",
            "Issue refund in billing panel if approved.",
            "Notify customer of successful transaction cancellation."
        ]
    }
}

SLA_INFO = {
    "Critical": {"hours": 1, "color": "danger"},
    "High": {"hours": 4, "color": "warning"},
    "Medium": {"hours": 12, "color": "info"},
    "Low": {"hours": 24, "color": "success"}
}

# ====================================================
# API ENDPOINTS
# ====================================================

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        "status": "success",
        "data": {
            "total_tickets": stats_data["total_tickets"],
            "category_dist": stats_data["category_dist"],
            "priority_dist": stats_data["priority_dist"],
            "recent_tickets": stats_data["recent_tickets"]
        }
    })

@app.route('/api/classify', methods=['POST'])
def classify_ticket():
    if not category_model or not priority_model or not vectorizer:
        return jsonify({
            "status": "error",
            "message": "Model files are not loaded correctly on the server."
        }), 500

    data = request.json or {}
    subject = data.get("subject", "").strip()
    description = data.get("description", "").strip()

    if not subject and not description:
        return jsonify({
            "status": "error",
            "message": "Subject or Description must be provided."
        }), 400

    # Combine subject and description like train_model.py
    combined_text = f"{subject} {description}"
    cleaned = clean_text(combined_text)

    # Vectorize and predict
    vector = vectorizer.transform([cleaned])
    pred_category = category_model.predict(vector)[0]
    pred_priority = priority_model.predict(vector)[0]

    # Fetch operational details based on predictions
    routing = ROUTING_INFO.get(pred_category, {
        "department": "General Support Queue",
        "checklist": ["Review ticket details and assign manually."]
    })
    
    sla = SLA_INFO.get(pred_priority, {"hours": 24, "color": "info"})

    return jsonify({
        "status": "success",
        "data": {
            "predictions": {
                "category": pred_category,
                "priority": pred_priority
            },
            "operational": {
                "department": routing["department"],
                "checklist": routing["checklist"],
                "sla_hours": sla["hours"],
                "sla_level": pred_priority,
                "color": sla["color"]
            },
            "meta": {
                "cleaned_length": len(cleaned.split()),
                "cleaned_text": cleaned
            }
        }
    })

if __name__ == '__main__':
    # Run locally on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
