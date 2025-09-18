import os
import sys
from dotenv import load_dotenv
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
import logging
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("Supabase URL and Keys must be set in .env file")

# Initialize Supabase clients
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "https://usariodashboard.netlify.app"] )

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper function to get user from token
def get_user_from_token(auth_header):
    """Extract user from Authorization header"""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.replace('Bearer ', '')
    try:
        # Use the anon client to get user info
        user = supabase_anon.auth.get_user(token)
        return user.user if user else None
    except Exception as e:
        logger.error(f"Error getting user from token: {e}")
        return None

# Authentication endpoints
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Sign up a new user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        role = data.get('role', 'va')
        
        if not email or not password or not full_name:
            return jsonify({"error": "Email, password, and full name are required"}), 400
        
        # Create user with Supabase Auth
        auth_response = supabase_anon.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name,
                    "role": role
                }
            }
        })
        
        if auth_response.user:
            # Create profile entry
            profile_data = {
                "user_id": auth_response.user.id,
                "full_name": full_name,
                "role": role
            }
            
            profile_response = supabase_service.table('profiles').insert(profile_data).execute()
            
            return jsonify({
                "message": "User created successfully",
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "full_name": full_name,
                    "role": role
                }
            }), 201
        else:
            return jsonify({"error": "Failed to create user"}), 400
            
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/signin', methods=['POST'])
def signin():
    """Sign in a user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Sign in with Supabase Auth
        auth_response = supabase_anon.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.user and auth_response.session:
            # Get user profile
            profile_response = supabase_service.table('profiles').select('*').eq('user_id', auth_response.user.id).execute()
            
            profile = profile_response.data[0] if profile_response.data else None
            
            return jsonify({
                "message": "Sign in successful",
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "full_name": profile.get('full_name') if profile else '',
                    "role": profile.get('role') if profile else 'va'
                },
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
            
    except Exception as e:
        logger.error(f"Signin error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/signout', methods=['POST'])
def signout():
    """Sign out a user"""
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            supabase_anon.auth.sign_out()
        
        return jsonify({"message": "Signed out successfully"}), 200
    except Exception as e:
        logger.error(f"Signout error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/user', methods=['GET'])
def get_current_user():
    """Get current user info"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Get user profile
        profile_response = supabase_service.table('profiles').select('*').eq('user_id', user.id).execute()
        profile = profile_response.data[0] if profile_response.data else None
        
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": profile.get('full_name') if profile else '',
                "role": profile.get('role') if profile else 'va'
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get user error: {e}")
        return jsonify({"error": str(e)}), 500

# Clients endpoints
@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Get all clients"""
    try:
        response = supabase_anon.table('clients').select('*').execute()
        return jsonify({"clients": response.data}), 200
    except Exception as e:
        logger.error(f"Get clients error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/clients', methods=['POST'])
def create_client():
    """Create a new client (admin only)"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Check if user is admin
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        if not profile_response.data or profile_response.data[0].get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.get_json()
        name = data.get('name')
        description = data.get('description', '')
        
        if not name:
            return jsonify({"error": "Client name is required"}), 400
        
        client_data = {
            "name": name,
            "description": description
        }
        
        response = supabase_service.table('clients').insert(client_data).execute()
        return jsonify({"client": response.data[0]}), 201
        
    except Exception as e:
        logger.error(f"Create client error: {e}")
        return jsonify({"error": str(e)}), 500

# User management endpoints
@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users (admin only)"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Check if user is admin
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        if not profile_response.data or profile_response.data[0].get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        # Get all profiles
        response = supabase_service.table('profiles').select('*').execute()
        return jsonify({"users": response.data}), 200
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_id>/clients', methods=['POST'])
def assign_client_to_user(user_id):
    """Assign a client to a user (admin only)"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Check if user is admin
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        if not profile_response.data or profile_response.data[0].get('role') != 'admin':
            return jsonify({"error": "Admin access required"}), 403
        
        data = request.get_json()
        client_id = data.get('client_id')
        
        if not client_id:
            return jsonify({"error": "Client ID is required"}), 400
        
        assignment_data = {
            "user_id": user_id,
            "client_id": client_id
        }
        
        response = supabase_service.table('user_client_assignments').insert(assignment_data).execute()
        return jsonify({"assignment": response.data[0]}), 201
        
    except Exception as e:
        logger.error(f"Assign client error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_id>/clients', methods=['GET'])
def get_user_clients(user_id):
    """Get clients assigned to a user"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Users can only see their own assignments unless they're admin
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        is_admin = profile_response.data and profile_response.data[0].get('role') == 'admin'
        
        if not is_admin and user.id != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        # Get user's client assignments with client details
        response = supabase_service.table('user_client_assignments').select('*, clients(*)').eq('user_id', user_id).execute()
        
        clients = [assignment['clients'] for assignment in response.data]
        return jsonify({"clients": clients}), 200
        
    except Exception as e:
        logger.error(f"Get user clients error: {e}")
        return jsonify({"error": str(e)}), 500

# Influencers endpoints
@app.route('/api/influencers', methods=['GET'])
def get_influencers():
    """Get influencers (filtered by user's assigned clients)"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Check if user is admin
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        is_admin = profile_response.data and profile_response.data[0].get('role') == 'admin'
        
        if is_admin:
            # Admin can see all influencers
            response = supabase_service.table('influencers').select('*, clients(name)').execute()
        else:
            # Regular users can only see influencers for their assigned clients
            assignments_response = supabase_service.table('user_client_assignments').select('client_id').eq('user_id', user.id).execute()
            client_ids = [assignment['client_id'] for assignment in assignments_response.data]
            
            if not client_ids:
                return jsonify({"influencers": []}), 200
            
            response = supabase_service.table('influencers').select('*, clients(name)').in_('client_id', client_ids).execute()
        
        return jsonify({"influencers": response.data}), 200
        
    except Exception as e:
        logger.error(f"Get influencers error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/influencers', methods=['POST'])
def create_influencer():
    """Create a new influencer"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['client_id', 'name', 'business_email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        # Check if user has access to this client
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        is_admin = profile_response.data and profile_response.data[0].get('role') == 'admin'
        
        if not is_admin:
            assignments_response = supabase_service.table('user_client_assignments').select('client_id').eq('user_id', user.id).eq('client_id', data['client_id']).execute()
            if not assignments_response.data:
                return jsonify({"error": "Access denied for this client"}), 403
        
        influencer_data = {
            "client_id": data['client_id'],
            "added_by_user_id": user.id,
            "name": data['name'],
            "business_email": data['business_email'],
            "instagram_followers": data.get('instagram_followers', 0),
            "tiktok_followers": data.get('tiktok_followers', 0),
            "average_views": data.get('average_views', 0),
            "engagement_rate": data.get('engagement_rate', 0),
            "instagram_url": data.get('instagram_url', ''),
            "tiktok_url": data.get('tiktok_url', ''),
            "notes": data.get('notes', ''),
            "submitted": False
        }
        
        response = supabase_service.table('influencers').insert(influencer_data).execute()
        return jsonify({"influencer": response.data[0]}), 201
        
    except Exception as e:
        logger.error(f"Create influencer error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/influencers/<int:influencer_id>', methods=['PUT'])
def update_influencer(influencer_id):
    """Update an influencer"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.get_json()
        
        # Check if user has permission to update this influencer
        influencer_response = supabase_service.table('influencers').select('added_by_user_id').eq('id', influencer_id).execute()
        if not influencer_response.data:
            return jsonify({"error": "Influencer not found"}), 404
        
        influencer = influencer_response.data[0]
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        is_admin = profile_response.data and profile_response.data[0].get('role') == 'admin'
        
        if not is_admin and influencer['added_by_user_id'] != user.id:
            return jsonify({"error": "Access denied"}), 403
        
        # Update influencer
        update_data = {}
        updatable_fields = ['name', 'business_email', 'instagram_followers', 'tiktok_followers', 
                           'average_views', 'engagement_rate', 'instagram_url', 'tiktok_url', 'notes', 'submitted']
        
        for field in updatable_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            response = supabase_service.table('influencers').update(update_data).eq('id', influencer_id).execute()
            return jsonify({"influencer": response.data[0]}), 200
        else:
            return jsonify({"error": "No valid fields to update"}), 400
        
    except Exception as e:
        logger.error(f"Update influencer error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/influencers/<int:influencer_id>', methods=['DELETE'])
def delete_influencer(influencer_id):
    """Delete an influencer"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Check if user has permission to delete this influencer
        influencer_response = supabase_service.table('influencers').select('added_by_user_id').eq('id', influencer_id).execute()
        if not influencer_response.data:
            return jsonify({"error": "Influencer not found"}), 404
        
        influencer = influencer_response.data[0]
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        is_admin = profile_response.data and profile_response.data[0].get('role') == 'admin'
        
        if not is_admin and influencer['added_by_user_id'] != user.id:
            return jsonify({"error": "Access denied"}), 403
        
        # Delete influencer
        supabase_service.table('influencers').delete().eq('id', influencer_id).execute()
        return jsonify({"message": "Influencer deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Delete influencer error: {e}")
        return jsonify({"error": str(e)}), 500

# Submissions endpoints
@app.route('/api/submissions', methods=['POST'])
def create_submission():
    """Submit influencers"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.get_json()
        influencer_ids = data.get('influencer_ids', [])
        notes = data.get('notes', '')
        
        if not influencer_ids:
            return jsonify({"error": "At least one influencer ID is required"}), 400
        
        # Create submission record
        submission_data = {
            "submitted_by_user_id": user.id,
            "influencer_count": len(influencer_ids),
            "notes": notes
        }
        
        submission_response = supabase_service.table('submissions').insert(submission_data).execute()
        submission = submission_response.data[0]
        
        # Create submission items
        submission_items = []
        for influencer_id in influencer_ids:
            submission_items.append({
                "submission_id": submission['id'],
                "influencer_id": influencer_id
            })
        
        supabase_service.table('submission_items').insert(submission_items).execute()
        
        # Mark influencers as submitted
        supabase_service.table('influencers').update({"submitted": True}).in_('id', influencer_ids).execute()
        
        return jsonify({"submission": submission}), 201
        
    except Exception as e:
        logger.error(f"Create submission error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    """Get submissions"""
    try:
        auth_header = request.headers.get('Authorization')
        user = get_user_from_token(auth_header)
        
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        
        # Check if user is admin
        profile_response = supabase_service.table('profiles').select('role').eq('user_id', user.id).execute()
        is_admin = profile_response.data and profile_response.data[0].get('role') == 'admin'
        
        if is_admin:
            # Admin can see all submissions
            response = supabase_service.table('submissions').select('*, profiles(full_name)').execute()
        else:
            # Regular users can only see their own submissions
            response = supabase_service.table('submissions').select('*, profiles(full_name)').eq('submitted_by_user_id', user.id).execute()
        
        return jsonify({"submissions": response.data}), 200
        
    except Exception as e:
        logger.error(f"Get submissions error: {e}")
        return jsonify({"error": str(e)}), 500

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test_api():
    """Test API endpoint"""
    return jsonify({"message": "API is working!", "timestamp": datetime.now().isoformat()}), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


