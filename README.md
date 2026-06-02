# Support Ticket Classification & Prioritization System

## Machine Learning Task 2 (2026)

### Future Interns

---

# Project Overview

Customer support teams receive thousands of support tickets daily through emails, forms, and service portals. Manually sorting and prioritizing these tickets is time-consuming and often leads to delays in resolving urgent issues.

This project implements a Machine Learning-based Support Ticket Classification and Prioritization System that automatically:

* Classifies support tickets into predefined categories.
* Predicts ticket priority levels.
* Helps support teams route tickets more efficiently.
* Reduces manual effort in ticket management.

---

# Objective

The objective of this project is to build an NLP-powered ticket classification system that can:

1. Read support ticket text.
2. Automatically categorize tickets.
3. Assign priority levels.
4. Evaluate model performance using standard ML metrics.

---

# Dataset

Dataset Used:

Customer Support Ticket Dataset

Features Used:

* Ticket Subject
* Ticket Description
* Ticket Type (Target for Category Classification)
* Ticket Priority (Target for Priority Prediction)

Dataset Size:

* Total Records: 8,469

Target Classes:

### Ticket Categories

* Billing Inquiry
* Cancellation Request
* Product Inquiry
* Refund Request
* Technical Issue

### Ticket Priorities

* Critical
* High
* Medium
* Low

---

# Technologies Used

## Programming Language

* Python

## Libraries

* Pandas
* NumPy
* NLTK
* Scikit-learn
* Matplotlib
* Seaborn
* Joblib

## Development Environment

* VS Code
* Virtual Environment (venv)

---

# Project Workflow

## 1. Data Collection

The support ticket dataset was loaded using Pandas.

## 2. Data Preprocessing

Text preprocessing included:

* Lowercasing
* Removing special characters
* Removing stopwords
* Lemmatization

## 3. Feature Engineering

Ticket Subject and Ticket Description were combined into a single text feature.

TF-IDF Vectorization was used to convert text into numerical features.

Configuration:

* max_features = 10000
* ngram_range = (1,2)

## 4. Model Training

Two separate models were trained:

### Category Classification Model

Predicts ticket type.

Algorithm:

* Linear Support Vector Classifier (LinearSVC)

### Priority Classification Model

Predicts ticket priority.

Algorithm:

* Linear Support Vector Classifier (LinearSVC)

## 5. Model Evaluation

Evaluation metrics:

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix

---

# Results

## Category Classification

Accuracy:

21.61%

### Classification Report

| Metric            | Value  |
| ----------------- | ------ |
| Accuracy          | 21.61% |
| Macro F1 Score    | 0.22   |
| Weighted F1 Score | 0.22   |

---

## Priority Classification

Accuracy:

25.32%

### Classification Report

| Metric            | Value  |
| ----------------- | ------ |
| Accuracy          | 25.32% |
| Macro F1 Score    | 0.25   |
| Weighted F1 Score | 0.25   |

---

# Visualizations

The project includes:

* Ticket Type Distribution
* Priority Distribution
* Category Classification Confusion Matrix
* Priority Classification Confusion Matrix

Screenshots are available inside the `screenshots` folder.

---

# Model Files

Saved Models:

* category_model.pkl
* priority_model.pkl
* vectorizer.pkl

These models can be reused without retraining.

---

# Prediction System

An interactive prediction script was developed.

Example:

Input:

My payment failed and I need a refund immediately.

Output:

Category: Product Inquiry

Priority: Critical

---

# Business Impact

This system demonstrates how Natural Language Processing can support customer service operations by:

* Automating ticket routing
* Reducing manual classification effort
* Improving response prioritization
* Supporting faster decision-making

---

# Challenges Observed

The obtained accuracy scores indicate significant overlap among ticket categories and priorities within the dataset.

The confusion matrices show that many ticket descriptions contain similar wording, making category prediction difficult.

This highlights a common real-world challenge in support ticket classification where text alone may not fully determine ticket labels.

---

# Future Improvements

Potential enhancements include:

* Using advanced NLP models such as BERT
* Hyperparameter optimization
* Feature selection techniques
* Class-specific tuning
* Deep learning-based text classification
* Incorporating customer metadata and ticket history

---

# Project Structure

```text
FUTURE_ML_02
│
├── data
│   └── customer_support_tickets.csv
│
├── models
│   ├── category_model.pkl
│   ├── priority_model.pkl
│   └── vectorizer.pkl
│
├── screenshots
│   ├── ticket_type_distribution.png
│   ├── priority_distribution.png
│   ├── category_confusion_matrix.png
│   └── priority_confusion_matrix.png
│
├── src
│   ├── train_model.py
│   ├── predict.py
│   ├── eda.py
│   └── download_nltk.py
│
├── requirements.txt
└── README.md
```

---

# Conclusion

This project successfully demonstrates an end-to-end NLP pipeline for support ticket classification and prioritization using Python, NLTK, TF-IDF, and Machine Learning models.

The system automates ticket analysis, provides category and priority predictions, and serves as a practical example of NLP applications in customer support operations.
