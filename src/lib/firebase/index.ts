export { getFirebaseConfig, isFirebaseConfigured } from "./config";
export { getClientApp, getClientAuth, getClientDb } from "./client";
export {
  saveSubmission,
  updateSubmission,
  deleteSubmission,
  getSubmission,
  listSubmissions,
  listStudentSubmissions,
  type WorksheetSubmission,
} from "./submissions";
export {
  signInTeacherWithGoogle,
  signOutUser,
  checkIsTeacher,
  verifyTeacherPassword,
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
export { getFirebaseErrorMessage, getStudentFirebaseErrorMessage } from "./errors";
export { createShareLink, getShareByToken, type ShareRecord } from "./shares";
export {
  createInquiryReportDraft,
  updateInquiryReport,
  getInquiryReport,
  listStudentInquiryReports,
  listAllInquiryReports,
  deleteInquiryReport,
  type InquiryReportDoc,
} from "./inquiry-reports";
export {
  createLessonPlan,
  updateLessonPlan,
  getLessonPlan,
  listTeacherLessonPlans,
  deleteLessonPlan,
  type LessonPlanDoc,
} from "./lesson-plans";
export {
  createGuidedQuestionSet,
  updateGuidedQuestionSet,
  deleteGuidedQuestionSet,
  findPinnedGuidedQuestions,
  listTeacherGuidedQuestionSets,
} from "./guided-questions";
export {
  listClassmates,
  listAuthorPeerFeedbacks,
  listReceivedPeerFeedbacks,
  listAllPeerFeedbacks,
  deletePeerFeedback,
  findClassmateWorkDocId,
  hasAuthorSubmittedSameKind,
  createPeerFeedback,
  type PeerFeedbackDoc,
} from "./peer-feedbacks";
