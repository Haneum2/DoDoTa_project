const firebaseConfig = {
    apiKey: "AIzaSyBhhoohXpmc7crAD7l0ze3Qa7lM-mY6SrI",
    authDomain: "dodota-project.firebaseapp.com",
    projectId: "dodota-project",
    storageBucket: "dodota-project.firebasestorage.app",
    messagingSenderId: "457507409615",
    appId: "1:457507409615:web:5bcf673590e69a2e7cf1ba",
    measurementId: "G-36D86EMWZX"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let db = null;
try { db = firebase.firestore(); } catch(e) {}

function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
        console.error('로그인 오류:', err.code, err.message);
        alert('로그인 실패: ' + err.code);
    });
}

function signOutUser() {
    auth.signOut();
}
