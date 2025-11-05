import csv
import os

output = "french_language_test_data.csv"
def write_csv(answers, questions): #Yes cosented, 10
    file_exists = os.path.exists(output)
    
    with open(output, mode='a', newline='') as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow(questions)
        writer.writerow(answers)
