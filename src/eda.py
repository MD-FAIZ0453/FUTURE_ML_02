import os
import pandas as pd
import matplotlib.pyplot as plt

# Create screenshots folder if it doesn't exist
os.makedirs("../screenshots", exist_ok=True)

df = pd.read_csv("../data/customer_support_tickets.csv")

# Ticket Type Distribution
plt.figure(figsize=(8,5))
df["Ticket Type"].value_counts().plot(kind="bar")
plt.title("Ticket Type Distribution")
plt.tight_layout()
plt.savefig("../screenshots/ticket_type_distribution.png")
plt.show()

# Priority Distribution
plt.figure(figsize=(8,5))
df["Ticket Priority"].value_counts().plot(kind="bar")
plt.title("Priority Distribution")
plt.tight_layout()
plt.savefig("../screenshots/priority_distribution.png")
plt.show()

print("Charts saved successfully!")