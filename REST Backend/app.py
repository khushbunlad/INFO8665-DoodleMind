from flask import Flask, request, jsonify
from flask_restful import Api
from flasgger import Swagger, swag_from
from ml import predict_image
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

api = Api(app)

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Doodle Prediction API",
        "description": "API for predicting doodle images",
        "version": "1.0.0"
    },
    "host": "127.0.0.1:5004",
    "schemes": ["http"],
    "basePath": "/",
    "tags": [
        {
            "name": "Prediction",
            "description": "Endpoints related to doodle prediction"
        }
    ]
}
swagger = Swagger(app, template=swagger_template)


@app.route('/predict', methods=['POST'])
@swag_from({
    'parameters': [
        {
            'name': 'drawing',
            'in': 'body',
            'description': 'Drawing data in JSON format',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'drawing': {
                        'type': 'string',
                        'example': "[[[106, 79, 61, 43, 25, 14, 3, 0, 1, 10, 23, 42, 65, 83, 99, 121, 139, 157, 174, 209, 221, 233, 251, 255, 255, 254, 248, 226, 201, 163, 109, 107, 104, 118, 139, 160, 162, 159, 139, 124, 117], [89, 73, 71, 82, 102, 121, 150, 168, 195, 219, 231, 241, 247, 245, 238, 213, 225, 230, 233, 231, 225, 213, 181, 165, 143, 130, 118, 100, 89, 83, 87, 85, 62, 33, 10, 0, 5, 12, 34, 57, 86]]]"
                    }
                }
            }
        },
    ],
    'responses': {
        200: {
            'description': 'Prediction result',
            'schema': {
                'type': 'object',
                'properties': {
                    'prediction': {
                        'type': 'string',
                        'example': 'apple'
                    },
                    'confidence': {
                        'type': 'number',
                        'example': 0.95
                    }
                }
            }
        }
    },
    'tags': ['Prediction'],
    'summary': 'Predicts the drawn doodle'
})
def predict():
    try:
        data = request.get_json()
        if 'drawing' not in data:
            return jsonify({'error': 'Missing drawing data'}), 400
        
        result = predict_image(data['drawing'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
if __name__ == "__main__":
    print("\n\n--------------------------------------------------------\nAccess API here: http://localhost:5004/apidocs/\n--------------------------------------------------------\n")
    app.run(host='0.0.0.0', port=5004)
