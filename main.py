import pandas as pd

df = pd.read_csv("data/customer_support_tickets.csv")

print("Shape:", df.shape)

print("\nMissing Values:")
print(df.isnull().sum())