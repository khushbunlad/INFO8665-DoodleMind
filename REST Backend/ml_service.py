from flask import Flask, Response

class MLService:
    def __init__(self):
        pass 

    def process_request(self):
        return "ML Service is running" 

app = Flask(__name__)
ml_service = MLService()  

@app.route('/service', methods=['GET'])
def service_endpoint():
    return Response(ml_service.process_request(), status=200)

if __name__ == '__main__':
    print("Starting Flask server on port 5002...")
    app.run(host='0.0.0.0', port=5002, debug=True)
