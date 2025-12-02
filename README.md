# IT645_Project

## Purpose

**IT645_Project** is a collaborative platform designed to help learners connect with one another and learn together. By offering capabilities for messaging, meetings, recommendations, and user connection suggestions, this project enables peer-to-peer learning and enhances the experience for users seeking to expand their knowledge through community interactions.

---

## Features

- **User Authentication & Profile Management**
  - Register, login, email verification, and protected profile management.
- **Connections & Chat**
  - Suggest potential connections, send/accept/reject connection requests, view connection status, and initiate chats with connected users.
- **Messaging**
  - Text and file-based messaging between users, with secure downloads.
- **Meetings**
  - Create and retrieve meeting details to organize learning sessions.
- **Video Recommendations**
  - Personalized video recommendations based on user activity or interests.
- **Subscription & Payments**
  - Create subscription orders, verify payments, and check subscription status.

---

## Project Structure

Based on the provided project screenshot:

```
IT645_Project/
├── .git/
├── Backend/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── connectioncontroller.js
│   │   ├── meetingController.js
│   │   ├── messageController.js
│   │   ├── recommendationController.js
│   │   ├── subscriptioncontroller.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── upload.js
│   ├── models/
│   │   ├── ConnectionRequest.js
│   │   ├── Meeting.js
│   │   ├── Message.js
│   │   ├── Subscription.js
│   │   └── User.js
│   ├── node_modules/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── connect.js
│   │   ├── meeting.js
│   │   ├── messages.js
│   │   ├── recommendation.js
│   │   ├── subscription.js
│   │   └── user.js
│   ├── services/
│   ├── utils/
│   ├── views/
│   │   └── intro.ejs
│   ├── .env
│   ├── .gitignore
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── frontend/
│   ├── node_modules/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── ChatArea.jsx
│       │   ├── Icons.jsx
│       │   ├── layout.jsx
│       │   ├── MeetNotificationListener.jsx
│       │   ├── MessageBubble.jsx
│       │   ├── Navbar.jsx
│       │   ├── PrivateRoutes.jsx
│       │   └── UserList.jsx
│       ├── context/
│       ├── hooks/
│       └── pages/
│           ├── Chat/
│           ├── connections/
│           ├── Dashboard/
│           ├── example/
│           ├── login/
│           ├── Meet/
│           ├── profile/
│           ├── Recommendations/
│           ├── SignupForm/
│           ├── Subscription/
│           └── VerifyPage/
│           ├── services/
├── socket.js
```

---

## Key API Endpoints (Backend)

### Authentication Routes
- `POST /register` – User registration
- `POST /login` – User login
- `GET /me` – Get authenticated user
- `POST /verify` – Verify user email

### Chat Routes
- `GET /connections` – List chat user connections

### Connection Routes
- `GET /suggestions` – Get suggested users to connect with
- `POST /request` – Send connection request
- `POST /accept` – Accept connection request
- `POST /reject` – Reject connection request
- `GET /status` – Request status
- `GET /connections` – List current connections

### Meeting Routes
- `POST /` – Create meeting
- `GET /:id` – Get meeting by ID

### Messaging Routes
- `GET /:userId` – Get messages with a user
- `POST /` – Send message/file to user
- `GET /download/:messageId` – Download message file

### Recommendation Routes
- `POST /` – Get recommended videos

### Subscription Routes
- `POST /create-order` – Create subscription order
- `POST /verify-payment` – Verify payment for subscription
- `GET /status/:userId` – Get subscription status

### User Routes
- `GET /profile/:id` – Get user profile
- `PUT /update-profile/:id` – Update user profile
- `GET /:id` – Get user data

---

## Getting Started

### Prerequisites

- Node.js (v22+ recommended)
- MongoDB
- Cloudinary (for file uploads)
- Vite/React (Frontend)

### Backend Setup

1. Install dependencies
   ```bash
   cd Backend
   npm install
   ```

2. Configure `.env` file with necessary credentials (DB, Cloudinary, JWT secret).

3. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Install dependencies
   ```bash
   cd frontend
   npm install
   ```

2. Start the React frontend:
   ```bash
   npm run dev
   ```

---

## Technologies Used

- **Backend:** Node.js, Express, MongoDB, Cloudinary
- **Frontend:** React, Vite
- **Other:** JWT authentication, REST APIs

---

## Contributing

Contributions are welcome! Please submit issues, feature requests, or pull requests.

---

## License

MIT License

---

## Author

Developed by [jenilsoni04](https://github.com/jenilsoni04)
