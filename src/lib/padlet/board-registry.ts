import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { PadletBulletinColumnMode } from "@/lib/padlet/presets";
import type { PadletBoardDoc, PadletBoardScope, PadletPostDoc } from "@/lib/padlet/publish-types";
import { buildColumnMapFromSections, getBoardSections } from "@/lib/padlet/server";

const BOARDS_COLLECTION = "padletBoards";
const POSTS_COLLECTION = "padletPosts";

function mapBoardDoc(id: string, data: Record<string, unknown>): PadletBoardDoc {
  const scope = (data.scope ?? {}) as Record<string, unknown>;
  const publish = (data.publish ?? {}) as Record<string, unknown>;
  return {
    id,
    teacherUid: String(data.teacherUid ?? ""),
    boardId: String(data.boardId ?? ""),
    boardUrl: String(data.boardUrl ?? ""),
    title: String(data.title ?? ""),
    layout: String(data.layout ?? "shelf"),
    columnMode: data.columnMode === "groups" ? "groups" : "numbers",
    scope: {
      grade: Number(scope.grade ?? 0),
      classNo: Number(scope.classNo ?? 0),
      unitId: String(scope.unitId ?? ""),
      periods: Array.isArray(scope.periods) ? (scope.periods as unknown[]).map(Number) : [],
    },
    columnMap: (data.columnMap ?? {}) as Record<string, string>,
    publish: {
      open: publish.open !== false,
      allowRepublish: publish.allowRepublish !== false,
      closedAt:
        publish.closedAt && typeof publish.closedAt === "object" && "toDate" in publish.closedAt
          ? (publish.closedAt as { toDate: () => Date }).toDate()
          : null,
    },
    createdAt:
      data.createdAt && typeof data.createdAt === "object" && "toDate" in data.createdAt
        ? (data.createdAt as { toDate: () => Date }).toDate()
        : undefined,
    updatedAt:
      data.updatedAt && typeof data.updatedAt === "object" && "toDate" in data.updatedAt
        ? (data.updatedAt as { toDate: () => Date }).toDate()
        : undefined,
  };
}

export async function buildAndValidateColumnMap(
  boardId: string,
  columnMode: PadletBulletinColumnMode,
  apiKey: string,
): Promise<Record<string, string>> {
  const sections = await getBoardSections(boardId, apiKey);
  const columnMap = buildColumnMapFromSections(sections, columnMode);
  const expected = columnMode === "numbers" ? 25 : 6;
  const count = Object.keys(columnMap).length;
  if (count < Math.min(expected, sections.length)) {
    throw new Error(`columnMap 저장 실패: ${count}/${expected}개 컬럼만 매핑되었습니다.`);
  }
  return columnMap;
}

export async function savePadletBoard(input: {
  teacherUid: string;
  boardId: string;
  boardUrl: string;
  title: string;
  layout?: string;
  columnMode: PadletBulletinColumnMode;
  scope: PadletBoardScope;
  columnMap: Record<string, string>;
}): Promise<string> {
  if (!isAdminConfigured()) throw new Error("Admin SDK 미설정");
  const db = await getAdminDb();
  const ref = db.collection(BOARDS_COLLECTION).doc();
  await ref.set({
    teacherUid: input.teacherUid,
    boardId: input.boardId,
    boardUrl: input.boardUrl,
    title: input.title,
    layout: input.layout ?? "shelf",
    columnMode: input.columnMode,
    scope: input.scope,
    columnMap: input.columnMap,
    publish: { open: true, allowRepublish: true, closedAt: null },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return ref.id;
}

export async function getPadletBoardDoc(boardDocId: string): Promise<PadletBoardDoc | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection(BOARDS_COLLECTION).doc(boardDocId).get();
  if (!snap.exists) return null;
  return mapBoardDoc(snap.id, snap.data() ?? {});
}

export async function findPadletBoardForClass(input: {
  grade: number;
  classNo: number;
  unitId: string;
  period: number;
}): Promise<PadletBoardDoc | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db
    .collection(BOARDS_COLLECTION)
    .where("scope.grade", "==", input.grade)
    .where("scope.classNo", "==", input.classNo)
    .where("scope.unitId", "==", input.unitId)
    .limit(5)
    .get();

  for (const doc of snap.docs) {
    const board = mapBoardDoc(doc.id, doc.data());
    if (board.scope.periods.includes(input.period)) return board;
  }
  return null;
}

export async function listTeacherPadletBoards(teacherUid: string): Promise<PadletBoardDoc[]> {
  if (!isAdminConfigured()) return [];
  const db = await getAdminDb();
  const snap = await db.collection(BOARDS_COLLECTION).where("teacherUid", "==", teacherUid).get();
  return snap.docs.map((d) => mapBoardDoc(d.id, d.data()));
}

export async function updateBoardPublishState(
  boardDocId: string,
  publish: { open: boolean; allowRepublish: boolean },
): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  await db.collection(BOARDS_COLLECTION).doc(boardDocId).update({
    publish: {
      open: publish.open,
      allowRepublish: publish.allowRepublish,
      closedAt: publish.open ? null : new Date(),
    },
    updatedAt: new Date(),
  });
}

export async function getPadletPostDoc(postDocId: string): Promise<(PadletPostDoc & { id: string }) | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection(POSTS_COLLECTION).doc(postDocId).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    boardDocId: String(data.boardDocId ?? ""),
    boardId: String(data.boardId ?? ""),
    sectionId: String(data.sectionId ?? ""),
    studentUid: String(data.studentUid ?? ""),
    studentNo: Number(data.studentNo ?? 0),
    period: Number(data.period ?? 0),
    templateId: String(data.templateId ?? ""),
    submissionId: String(data.submissionId ?? ""),
    padletPostId: data.padletPostId ? String(data.padletPostId) : null,
    postUrl: data.postUrl ? String(data.postUrl) : null,
    subject: String(data.subject ?? ""),
    bodyHash: String(data.bodyHash ?? ""),
    status: data.status ?? "pending",
    attempts: Number(data.attempts ?? 0),
    lastError: data.lastError ? String(data.lastError) : null,
    publishedAt: data.publishedAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.(),
  };
}

export async function savePadletPostDoc(
  postDocId: string,
  data: Partial<PadletPostDoc> & Pick<PadletPostDoc, "boardDocId" | "boardId" | "studentUid" | "studentNo" | "period">,
): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  await db.collection(POSTS_COLLECTION).doc(postDocId).set(
    { ...data, updatedAt: new Date() },
    { merge: true },
  );
}

export async function listPadletPostsForBoard(boardDocId: string): Promise<Array<PadletPostDoc & { id: string }>> {
  if (!isAdminConfigured()) return [];
  const db = await getAdminDb();
  const snap = await db.collection(POSTS_COLLECTION).where("boardDocId", "==", boardDocId).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      boardDocId: String(data.boardDocId ?? ""),
      boardId: String(data.boardId ?? ""),
      sectionId: String(data.sectionId ?? ""),
      studentUid: String(data.studentUid ?? ""),
      studentNo: Number(data.studentNo ?? 0),
      period: Number(data.period ?? 0),
      templateId: String(data.templateId ?? ""),
      submissionId: String(data.submissionId ?? ""),
      padletPostId: data.padletPostId ? String(data.padletPostId) : null,
      postUrl: data.postUrl ? String(data.postUrl) : null,
      subject: String(data.subject ?? ""),
      bodyHash: String(data.bodyHash ?? ""),
      status: data.status ?? "pending",
      attempts: Number(data.attempts ?? 0),
      lastError: data.lastError ? String(data.lastError) : null,
      publishedAt: data.publishedAt?.toDate?.() ?? null,
      updatedAt: data.updatedAt?.toDate?.(),
    };
  });
}

export async function listStudentPadletPosts(studentUid: string): Promise<Array<PadletPostDoc & { id: string }>> {
  if (!isAdminConfigured()) return [];
  const db = await getAdminDb();
  const snap = await db.collection(POSTS_COLLECTION).where("studentUid", "==", studentUid).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      boardDocId: String(data.boardDocId ?? ""),
      boardId: String(data.boardId ?? ""),
      sectionId: String(data.sectionId ?? ""),
      studentUid: String(data.studentUid ?? ""),
      studentNo: Number(data.studentNo ?? 0),
      period: Number(data.period ?? 0),
      templateId: String(data.templateId ?? ""),
      submissionId: String(data.submissionId ?? ""),
      padletPostId: data.padletPostId ? String(data.padletPostId) : null,
      postUrl: data.postUrl ? String(data.postUrl) : null,
      subject: String(data.subject ?? ""),
      bodyHash: String(data.bodyHash ?? ""),
      status: data.status ?? "pending",
      attempts: Number(data.attempts ?? 0),
      lastError: data.lastError ? String(data.lastError) : null,
      publishedAt: data.publishedAt?.toDate?.() ?? null,
      updatedAt: data.updatedAt?.toDate?.(),
    };
  });
}
