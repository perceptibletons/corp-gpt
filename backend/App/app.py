from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from App.routes.auth import auth_bp


from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from App.config import SQLALCHEMY_DATABASE_URI, JWT_SECRET


# Initialize app
app = Flask(__name__)

# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = JWT_SECRET

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Import routes
from routes.auth_routes import auth_bp
app.register_blueprint(auth_bp, url_prefix="/auth")

# Run the app
if __name__ == "__main__":
    app.run(debug=True)
