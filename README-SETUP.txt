CAMPUS BITES — COMPLETE STARTER PROJECT
========================================

FILES
-----
index.html             Customer ordering website
style.css              Responsive design
app.js                 Customer login, menu, cart, checkout, order tracking
admin.html             Separate admin login/dashboard
admin.js               Admin product and order management
firebase-config.js     Your Firebase web app configuration
firestore.rules        Database security rules
storage.rules          Product image upload security rules

IMPORTANT FIRST STEPS
---------------------
1. Create a Firebase project at https://console.firebase.google.com/.
2. Add a Web App to your Firebase project. Copy its config values.
3. Open firebase-config.js and replace every placeholder with your Firebase config.
   Do not paste a service-account private key here. The Web App config is intended
   for browser apps; security is enforced by the rules below.
4. In Firebase Console > Authentication > Sign-in method, enable Email/Password.
5. In Authentication > Settings > Authorized domains, add your website host
   (for example, YOURNAME.github.io if using GitHub Pages).
6. In Firestore Database, create a database. Open Rules, paste firestore.rules,
   then Publish.
7. In Storage, get started. Open Rules, paste storage.rules, then Publish.
   Firebase Storage availability/billing requirements can vary by project/plan.
8. Create your admin login account:
   - Firebase Console > Authentication > Users > Add user.
   - Add the admin email and a strong password.
   - Copy that user's UID.
9. In Firestore > Data, create a collection named: admins
   Create a document whose DOCUMENT ID is exactly the admin user's UID.
   Add this field:
       role   (string)   admin
   Do not create a public admin registration form.
10. Upload all .html, .css, and .js files to the same folder/repository and publish
    the website (GitHub Pages or another static host).

ADDING PRODUCTS
---------------
The customer page displays six sample products if the Firestore products collection
is empty. To manage products in the Admin Dashboard, add products while signed in
with the authorized admin account. The first admin-added product will be saved in
Firestore and then Firestore products become the live menu.

HOW ADMIN SECURITY WORKS
------------------------
The Admin page checks for admins/{AUTH_UID} with role = "admin".
Firestore and Storage rules also check admin authorization. Hiding the Admin link
alone is NOT security. Do not remove or weaken the rules.

NOTES / LIMITATIONS
-------------------
- This is a front-end starter project, not a complete production payment gateway.
- GCash reference is recorded as text only. The site does not verify GCash payments.
- Do not ask customers to provide their GCash MPIN, password, or OTP.
- The order total is calculated in the browser in this starter. For a real business,
  move price validation and order creation to trusted server-side code (Cloud Functions).
- Sample products are fallback display items only. Add products in Admin to publish
  them to Firestore for all customers.
- Test customer and admin access in separate browser sessions before publishing.
