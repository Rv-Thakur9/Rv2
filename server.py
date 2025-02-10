from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Load pre-trained sentiment analysis model
sentiment_analyzer = pipeline('sentiment-analysis')

@app.route('/analyzeReview', methods=['POST'])
def analyze_review():
    try:
        data = request.json
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        # Perform sentiment analysis
        results = sentiment_analyzer(text)

        positive_keywords = [res['label'] for res in results if res['label'] == 'POSITIVE']
        negative_keywords = [res['label'] for res in results if res['label'] == 'NEGATIVE']

        return jsonify({'positiveKeywords': positive_keywords, 'negativeKeywords': negative_keywords})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)