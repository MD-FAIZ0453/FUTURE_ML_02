import os
import re
import joblib
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    confusion_matrix
)

# ====================================================
# CREATE REQUIRED FOLDERS
# ====================================================

os.makedirs("../models", exist_ok=True)
os.makedirs("../screenshots", exist_ok=True)

# ====================================================
# LOAD DATASET
# ====================================================

df = pd.read_csv("../data/customer_support_tickets.csv")

# Select required columns
df = df[
    [
        "Ticket Subject",
        "Ticket Description",
        "Ticket Type",
        "Ticket Priority"
    ]
]

df.dropna(inplace=True)

print("=" * 50)
print("DATASET INFORMATION")
print("=" * 50)
print("Dataset Shape:", df.shape)

# ====================================================
# COMBINE TEXT COLUMNS
# ====================================================

df["combined_text"] = (
    df["Ticket Subject"].astype(str)
    + " "
    + df["Ticket Description"].astype(str)
)

# ====================================================
# TEXT PREPROCESSING
# ====================================================

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_text(text):

    text = str(text).lower()

    text = re.sub(r"[^a-zA-Z\s]", " ", text)

    words = text.split()

    words = [
        lemmatizer.lemmatize(word)
        for word in words
        if word not in stop_words
    ]

    return " ".join(words)

df["clean_text"] = df["combined_text"].apply(clean_text)

# ====================================================
# TF-IDF FEATURE EXTRACTION
# ====================================================

vectorizer = TfidfVectorizer(
    max_features=10000,
    ngram_range=(1, 2)
)

X = vectorizer.fit_transform(df["clean_text"])

# ====================================================
# CATEGORY CLASSIFICATION
# ====================================================

print("\n" + "=" * 50)
print("CATEGORY CLASSIFICATION")
print("=" * 50)

y_category = df["Ticket Type"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_category,
    test_size=0.2,
    random_state=42,
    stratify=y_category
)

category_model = LinearSVC()

category_model.fit(X_train, y_train)

category_pred = category_model.predict(X_test)

category_accuracy = accuracy_score(
    y_test,
    category_pred
)

print("Accuracy:", round(category_accuracy, 4))

print("\nClassification Report:\n")
print(classification_report(
    y_test,
    category_pred
))

# ====================================================
# CATEGORY CONFUSION MATRIX
# ====================================================

cm = confusion_matrix(
    y_test,
    category_pred
)

plt.figure(figsize=(8, 6))

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues"
)

plt.title("Category Classification Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.tight_layout()

plt.savefig(
    "../screenshots/category_confusion_matrix.png"
)

plt.show()

# ====================================================
# PRIORITY CLASSIFICATION
# ====================================================

print("\n" + "=" * 50)
print("PRIORITY CLASSIFICATION")
print("=" * 50)

y_priority = df["Ticket Priority"]

X_train2, X_test2, y_train2, y_test2 = train_test_split(
    X,
    y_priority,
    test_size=0.2,
    random_state=42,
    stratify=y_priority
)

priority_model = LinearSVC()

priority_model.fit(
    X_train2,
    y_train2
)

priority_pred = priority_model.predict(
    X_test2
)

priority_accuracy = accuracy_score(
    y_test2,
    priority_pred
)

print("Accuracy:", round(priority_accuracy, 4))

print("\nClassification Report:\n")
print(classification_report(
    y_test2,
    priority_pred
))

# ====================================================
# PRIORITY CONFUSION MATRIX
# ====================================================

cm2 = confusion_matrix(
    y_test2,
    priority_pred
)

plt.figure(figsize=(8, 6))

sns.heatmap(
    cm2,
    annot=True,
    fmt="d",
    cmap="Blues"
)

plt.title("Priority Classification Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")

plt.tight_layout()

plt.savefig(
    "../screenshots/priority_confusion_matrix.png"
)

plt.show()

# ====================================================
# SAVE MODELS
# ====================================================

joblib.dump(
    category_model,
    "../models/category_model.pkl"
)

joblib.dump(
    priority_model,
    "../models/priority_model.pkl"
)

joblib.dump(
    vectorizer,
    "../models/vectorizer.pkl"
)

print("\n" + "=" * 50)
print("MODELS SAVED SUCCESSFULLY")
print("=" * 50)

print("category_model.pkl")
print("priority_model.pkl")
print("vectorizer.pkl")