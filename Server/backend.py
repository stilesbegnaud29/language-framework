from flask import Flask, request, jsonify
from datetime import datetime
import write_csv

app = Flask(__name__)

proficiency_mapping_reverse = {
    1: 'Novice Low', 2: 'Novice Mid', 3: 'Novice High',
    4: 'Intermediate Low', 5: 'Intermediate Mid', 6: 'Intermediate High',
    7: 'Advanced Low', 8: 'Advanced Mid', 9: 'Advanced High', 10: 'Superior'
}

@app.route("/submit", methods=["POST"])
def submit_form():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"status": "error", "message": "No data received"}), 400

        # Add timestamps
        data["completion_date"] = datetime.now().strftime("%Y-%m-%d")
        data["time_taken"] = data.get("time_taken", 0)

        # Map proficiency levels
        level_map = {1: "Beginner", 2: "Intermediate", 3: "Advanced", 4: "Superior"}
        for skill in ["reading", "listening", "writing", "speaking"]:
            key = f"self_{skill}"
            if key in data:
                try:
                    data[key] = level_map.get(int(data[key]), data[key])
                except (ValueError, TypeError):
                    pass

        # Save to CSV
        write_csv.write_csv(list(data.values()), list(data.keys()))

        return jsonify({"status": "ok", "message": "Response saved!"}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)