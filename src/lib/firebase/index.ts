export { getFirebaseConfig, isFirebaseConfigured } from "./config";
export { getClientApp, getClientAuth, getClientDb } from "./client";
export {
  saveSubmission,
  saveSubmissionDraft,
  updateSubmission,
  updateSubmissionDraft,
  findStudentDraftForTemplate,
  deleteSubmission,
  getSubmission,
  listSubmissions,
  listStudentSubmissions,
  type WorksheetSubmission,
  type WorksheetSubmissionStatus,
} from "./submissions";
export {
  signInTeacherWithGoogle,
  signOutUser,
  checkIsTeacher,
  verifyTeacherPassword,
  resolveAuthRole,
  completeTeacherGoogleRedirect,
  isTeacherGoogleRedirectInProgress,
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
  createInquiryReportShareLink,
  getInquiryReportShareByToken,
  sanitizeInquiryReportForSave,
  type InquiryReportShareRecord,
} from "./inquiry-report-shares";
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
  findLatestPinnedGuidedQuestionsForTemplate,
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
export {
  listBadgeDefinitions,
  listAllBadgeDefinitionsForTeacher,
  seedDefaultBadgeDefinitions,
  saveBadgeDefinition,
  deleteBadgeDefinition,
  awardStudentBadge,
  listStudentBadges,
  listAllStudentBadges,
  revokeStudentBadge,
} from "./badges";
export {
  getWorksheetContent,
  subscribeWorksheetContent,
  publishWorksheetContent,
  type WorksheetContentDoc,
} from "./worksheet-content";
