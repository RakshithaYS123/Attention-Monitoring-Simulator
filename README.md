# Attention Monitoring Simulator

A real-time web application that monitors user attention through webcam-based face tracking. The application detects when a user is attentive or distracted and tracks metrics like attention duration, distraction duration, and attention switches.

## Features

- User authentication (signup, login, logout)
- Real-time attention monitoring using face detection
- Dashboard with attention metrics and history
- MongoDB database for user and session storage

## Project Structure

```
attention-monitoring-simulator/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── models/             # Face-api.js model files
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttentionMonitor.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Navigation.js
│   │   │   └── Signup.js
│   │   ├── App.css
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Session.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── sessions.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Webcam for attention monitoring

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/attention-monitor
   JWT_SECRET=your_jwt_secret_key_here
   ```

   Note: Replace the MONGO_URI with your MongoDB connection string if using MongoDB Atlas.

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Download face-api.js models:

   - Create a `models` folder inside the `public` directory
   - Download the face-api.js model files from [face-api.js](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) and place them in the `public/models` directory. Required models:
     - tiny_face_detector_model-weights_manifest.json
     - tiny_face_detector_model-shard1
     - face_landmark_68_model-weights_manifest.json
     - face_landmark_68_model-shard1
     - face_recognition_model-weights_manifest.json
     - face_recognition_model-shard1
     - face_expression_model-weights_manifest.json
     - face_expression_model-shard1

4. Start the frontend application:

   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Create a new account using the signup form
2. Login with your credentials
3. Navigate to the Monitor page
4. Allow camera access when prompted
5. Click "Start Monitoring" to begin tracking your attention
6. View your attention metrics on the dashboard

## Notes

- For best results, ensure you have good lighting and your face is clearly visible to the webcam
- The application considers you "attentive" when your face is detected and facing the camera
- To use the application effectively, try to stay within the webcam's field of view

## Technologies Used

- Frontend: React, React Router, face-api.js
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT, bcryptjs
