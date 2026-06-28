export const STUDENT_DRAG_MIME = "application/x-sagodogu-student-id";

export function setStudentDragData(dataTransfer: DataTransfer, studentId: string): void {
  dataTransfer.setData(STUDENT_DRAG_MIME, studentId);
  dataTransfer.setData("text/plain", studentId);
  dataTransfer.effectAllowed = "move";
}

export function getStudentDragData(dataTransfer: DataTransfer): string {
  return dataTransfer.getData(STUDENT_DRAG_MIME) || dataTransfer.getData("text/plain");
}
