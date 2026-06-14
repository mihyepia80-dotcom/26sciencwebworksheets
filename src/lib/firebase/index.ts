export { getFirebaseConfig, isFirebaseConfigured } from "./config";
export { getClientApp, getClientAuth, getClientDb } from "./client";
export { saveSubmission, listSubmissions, listStudentSubmissions, type WorksheetSubmission } from "./submissions";
export {
  signInTeacherWithGoogle,
  signOutUser,
  checkIsTeacher,
  subscribeAppAuth,
  type AppAuthState,
  type AuthRole,
} from "./teacher-auth";
export {
  signInStudent,
  getStudentProfile,
  checkIsStudent,
  buildStudentEmail,
  type StudentProfile,
} from "./student-auth";
