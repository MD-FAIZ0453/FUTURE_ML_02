import joblib
import re

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Load models
category_model = joblib.load("../models/category_model.pkl")
priority_model = joblib.load("../models/priority_model.pkl")
vectorizer = joblib.load("../models/vectorizer.pkl")

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_text(text):

    text = text.lower()

    text = re.sub(r"[^a-zA-Z\s]", " ", text)

    words = text.split()

    words = [
        lemmatizer.lemmatize(word)
        for word in words
        if word not in stop_words
    ]

    return " ".join(words)

print("\nSUPPORT TICKET CLASSIFIER")
print("-" * 40)

ticket = input("Enter Ticket Description:\n")

cleaned = clean_text(ticket)

vector = vectorizer.transform([cleaned])

category = category_model.predict(vector)[0]
priority = priority_model.predict(vector)[0]

print("\nPrediction Results")
print("-" * 40)
print("Category :", category)
print("Priority :", priority)