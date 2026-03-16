from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd

"""
NutriTech Machine Learning Service
----------------------------------
This service provides crop recommendations based on soil NPK ratios, 
temperature, humidity, pH, and rainfall. It uses a pre-trained RandomForest 
classifier.
"""

app = Flask(__name__)
# Enable CORS for cross-service communication (e.g. from frontend)
CORS(app) 

# Load the pre-trained model and the scaler artifact
# Note: Ensure these files exist in the 'model/' directory relative to this file
try:
    model = joblib.load('model/crop_recommendation.pkl')
    scaler = joblib.load('model/scaler.pkl')
except Exception as e:
    print(f"[ERROR] Failed to load ML model or scaler: {str(e)}")

# Metadata for crops to provide context in recommendations (MSP, Season, Avg Yield)
crop_metadata = {
    'rice': {'msp': 2369, 'season': 'Kharif', 'yield_quintals': 22.18},
    'maize': {'msp': 2249, 'season': 'Kharif', 'yield_quintals': 34.27},
    'chickpea': {'msp': 5440, 'season': 'Rabi'},
    'kidneybeans': {'msp': 6000, 'season': 'Kharif'},
    'pigeonpeas': {'msp': 8000, 'season': 'Kharif'},
    'mothbeans': {'msp': 5000, 'season': 'Kharif'},
    'mungbean': {'msp': 8768, 'season': 'Kharif'},
    'blackgram': {'msp': 7800, 'season': 'Kharif'},
    'lentil': {'msp': 6025, 'season': 'Rabi'},
    'pomegranate': {'msp': 2500, 'season': 'Year-round'},
    'banana': {'msp': 900, 'season': 'Year-round', 'yield_quintals': 268.51},
    'mango': {'msp': 1200, 'season': 'Summer'},
    'grapes': {'msp': 1800, 'season': 'Winter'},
    'watermelon': {'msp': 800, 'season': 'Summer'},
    'muskmelon': {'msp': 700, 'season': 'Summer'},
    'apple': {'msp': 3500, 'season': 'Winter'},
    'orange': {'msp': 1600, 'season': 'Winter'},
    'papaya': {'msp': 600, 'season': 'Year-round'},
    'coconut': {'msp': 1000, 'season': 'Year-round', 'yield_quintals': 86520.00},
    'cotton': {'msp': 7710, 'season': 'Kharif'},
    'jute': {'msp': 4750, 'season': 'Kharif', 'yield_quintals': 75.55},
    'coffee': {'msp': 15000, 'season': 'Year-round'}
}

@app.route('/')
def home():
    """Simple UI for testing the model manually"""
    return render_template('index.html')

@app.route('/predict-api', methods=['POST'])
def predict_api():
    """
    JSON API for crop recommendation.
    Expected Payload: { "N": float, "P": float, "K": float, "temperature": float, ... }
    """
    try:
        data = request.get_json()
        feature_list = [
            float(data.get('N', 0)),
            float(data.get('P', 0)),
            float(data.get('K', 0)),
            float(data.get('temperature', 0)),
            float(data.get('humidity', 0)),
            float(data.get('ph', 0)),
            float(data.get('rainfall', 0))
        ]
        
        # Format as DataFrame with exact feature names used during training
        features = pd.DataFrame([feature_list], columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'])

        # Apply the same scaling transformation as used during training
        scaled_features = scaler.transform(features)

        # Retrieve prediction probabilities for all classes
        probabilities = model.predict_proba(scaled_features)[0]
        
        # Sort and pick the top 5 most likely crops
        top5_indices = np.argsort(probabilities)[-5:][::-1]
        top5_crops = model.classes_[top5_indices]
        
        recommendations = []
        for i, crop in enumerate(top5_crops):
            prob = probabilities[top5_indices[i]]
            meta = crop_metadata.get(crop, {})
            # Simplified profit calculation: Estimated Yield * MSP
            profit = meta.get('yield_quintals', 0) * meta.get('msp', 0)
            
            recommendations.append({
                'crop': crop.capitalize(),
                'confidence': f"{prob*100:.1f}%",
                'profit': f'₹{profit:,.2f}',
                'yield': f"{meta.get('yield_quintals', 'N/A')} quintals",
                'season': meta.get('season', 'N/A'),
            })

        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/predict', methods=['POST'])
def predict():
    """Form-based prediction for the internal result.html template"""
    if request.method == 'POST':
        data = request.form
        try:
            feature_list = [float(data[f]) for f in ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']]
            features = pd.DataFrame([feature_list], columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'])
            scaled_features = scaler.transform(features)
            
            probabilities = model.predict_proba(scaled_features)[0]
            top5_indices = np.argsort(probabilities)[-5:][::-1]
            top5_crops = model.classes_[top5_indices]
            
            recommendations = []
            for crop in top5_crops:
                meta = crop_metadata.get(crop, {})
                profit = meta.get('yield_quintals', 0) * meta.get('msp', 0)
                recommendations.append({
                    'crop': crop.capitalize(),
                    'profit': f'₹{profit:,.2f}',
                    'yield': f"{meta.get('yield_quintals', 'N/A')} quintals",
                    'season': meta.get('season', 'N/A'),
                })
            return render_template('result.html', recommendations=recommendations)
        except Exception as e:
            return str(e), 400

if __name__ == '__main__':
    import os
    # Default to port 5001 to avoid conflict with backend on 5000
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
