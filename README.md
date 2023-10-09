# NoteShare - Connect, Share, Learn

**NoteShare** is a dynamic and collaborative social media platform designed for students, educators, and anyone passionate about learning. It facilitates the sharing of educational content, doubts, and resources while fostering a supportive community of learners. Built using a stack of modern technologies, this platform is feature-rich and secure.

## Key Features

1. **User Registration and Authentication**
   - Users can sign up and log in using traditional email and password or opt for a quick login via mobile OTP.
   - **JSON Web Tokens (JWT)** are used to secure user sessions.
   - Passwords are securely hashed and stored in the database.

2. **User Profiles and Connections**
   - Users can create and customize their profiles with avatars, bios, and contact information.
   - They can connect with other users and view their profiles.
   - **Cookies** are used to maintain user sessions for seamless navigation.

3. **Note Sharing**
   - Users can create and share notes, doubts, or educational content with text, images, or documents.
   - Integrated with **Google Drive** to store and manage documents securely.
   - Images are hosted on **Cloudinary** to ensure fast loading and responsiveness.

4. **Interactive Community**
   - Users can comment on posts, ask questions, and provide answers.
   - **jQuery** and **Ajax** are used to create dynamic and real-time interactions.
   - Content can be liked, shared, or reported for moderation.

5. **Document Upload and Download**
   - Users can upload documents and resources in various formats (PDF, DOC, PPT, etc.).
   - Others can download these resources to aid in their learning journey.

## Technology Stack

- **Node.js**: For the server-side application.
- **Express.js**: To build the RESTful API.
- **MongoDB**: As the database to store user data, notes, and connections.
- **Handlebars (hbs)**: For server-side templating.
- **CSS**: For styling and responsive design.
- **JavaScript**: For client-side interactions.
- **jQuery**: For asynchronous requests and DOM manipulation.
- **Ajax**: For real-time updates.
- **JSON Web Tokens (JWT)**: To secure user sessions.
- **Bcrypt**: For password hashing.
- **Cookies**: For session management.
- **Google Drive API**: To handle document storage.
- **Cloudinary**: To manage image hosting.
- **Firebase**: For mobile OTP-based authentication.

## Benefits

- **Educational Collaboration**: NoteShare encourages a community of learners to collaborate, share knowledge, and support each other.
- **Secure and User-Friendly**: Robust security measures ensure user data protection, and a user-friendly interface makes it accessible to all.
- **Resourceful**: With document and image storage integrated, the platform is a one-stop solution for educational resources.
- **Mobile-Friendly**: The mobile OTP-based authentication ensures accessibility on all devices.

**NoteShare** is not just a platform; it's a vibrant online community where learners come together to grow, share, and inspire.
