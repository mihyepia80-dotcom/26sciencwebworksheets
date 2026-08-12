import { NextResponse } from "next/server";
import {
  isClassMemberAuthResponse,
  requireClassMemberRequest,
} from "@/lib/auth/verify-class-member-request";
import {
  createShareTokenForSubmission,
  getSubmissionServer,
  updateSubmissionPadletPost,
} from "@/lib/firebase/submissions-server";
import {
  findPadletBoardForClass,
  getPadletBoardDoc,
  getPadletPostDoc,
  savePadletPostDoc,
} from "@/lib/padlet/board-registry";
import { PadletApiError } from "@/lib/padlet/errors";
import { resolvePadletFields, DEFAULT_UNIT_ID } from "@/lib/padlet/padlet-fields";
import { getAdminDb } from "@/lib/firebase/admin";
import { composePost } from "@/lib/padlet/post-composer";
import {
  evaluatePublishGuard,
  postDocId,
  resolvePeriod,
  resolveStudentNo,
} from "@/lib/padlet/publish-guard";
import { publishToPadletWithRetry } from "@/lib/padlet/publish-queue";
import type { PublishRequest, PublishResponse } from "@/lib/padlet/publish-types";
import { getTemplateById } from "@/lib/templates/registry";
import { resolvePadletApiKeyForTeacher } from "@/lib/teacher/api-config";
import { TEACHER_PADLET_SETUP_MESSAGE } from "@/lib/teacher/api-config-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const member = await requireClassMemberRequest(request);
  if (isClassMemberAuthResponse(member)) return member;

  let body: PublishRequest;
  try {
    body = (await request.json()) as PublishRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.submissionId?.trim()) {
    return NextResponse.json({ error: "submissionId가 필요합니다." }, { status: 400 });
  }

  const submission = await getSubmissionServer(body.submissionId.trim());
  if (!submission) {
    return NextResponse.json({
      status: "error",
      postUrl: null,
      boardUrl: null,
      sectionLabel: null,
      subject: null,
      message: "제출본을 찾을 수 없습니다.",
    } satisfies PublishResponse, {
      status: 404,
    });
  }

  const isTeacherProxy = member.role === "teacher";
  if (!isTeacherProxy && submission.studentUid !== member.uid) {
    return NextResponse.json({ error: "본인 제출본만 게시할 수 있습니다." }, { status: 403 });
  }

  const template = getTemplateById(submission.templateId);
  const period = resolvePeriod(submission, template?.defaultPeriod);
  const studentNo = isTeacherProxy && body.targetStudentNo
    ? body.targetStudentNo
    : resolveStudentNo(submission, member.studentNo) ?? 0;

  if (!studentNo) {
    return NextResponse.json({
      status: "error",
      postUrl: null,
      boardUrl: null,
      sectionLabel: null,
      subject: null,
      message: "학생 번호를 확인할 수 없습니다.",
    } satisfies PublishResponse);
  }

  const grade = Number(submission.meta.grade) || member.grade || 0;
  const classNo = Number(submission.meta.classNo) || member.classNo || 0;
  const unitId = DEFAULT_UNIT_ID;

  let board = body.boardDocId ? await getPadletBoardDoc(body.boardDocId) : null;
  if (!board) {
    board = await findPadletBoardForClass({ grade, classNo, unitId, period });
  }

  const boardId = board?.boardId ?? "";
  const docId = boardId ? postDocId(boardId, studentNo, period) : "";
  const existingPost = docId ? await getPadletPostDoc(docId) : null;

  const origin =
    request.headers.get("origin") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://sagodogu-toktok.vercel.app");
  const shareUrl = await createShareTokenForSubmission(submission, origin);
  const padletFields = resolvePadletFields(submission.templateId, template?.padletFields);
  const composed = composePost(submission, period, studentNo, shareUrl, padletFields);

  const guard = evaluatePublishGuard({
    submission,
    board,
    existingPost,
    studentNo,
    period,
    bodyHash: composed.bodyHash,
    isTeacherProxy,
    mode: body.mode ?? "publish",
  });

  if (!guard.allowed && guard.status) {
    const resp: PublishResponse = {
      status: guard.status,
      postUrl: existingPost?.postUrl ?? submission.padletPost?.postUrl ?? null,
      boardUrl: board?.boardUrl ?? null,
      sectionLabel: `${studentNo}번`,
      subject: composed.subject,
      message: guard.message,
    };
    return NextResponse.json(resp);
  }

  const sectionId = board!.columnMap[String(studentNo)];

  const boardOwnerUid = board!.teacherUid?.trim();
  if (!boardOwnerUid) {
    return NextResponse.json({
      status: "error",
      postUrl: null,
      boardUrl: board?.boardUrl ?? null,
      sectionLabel: `${studentNo}번`,
      subject: composed.subject,
      message: "게시판 소유 교사 정보를 찾을 수 없습니다.",
    } satisfies PublishResponse);
  }

  const db = await getAdminDb();
  const ownerSnap = await db.collection("teachers").doc(boardOwnerUid).get();
  const ownerEmail = typeof ownerSnap.data()?.email === "string" ? ownerSnap.data()!.email : undefined;
  const padletResolved = await resolvePadletApiKeyForTeacher(boardOwnerUid, ownerEmail);
  if (!padletResolved) {
    return NextResponse.json({
      status: "error",
      postUrl: null,
      boardUrl: board?.boardUrl ?? null,
      sectionLabel: `${studentNo}번`,
      subject: composed.subject,
      message: TEACHER_PADLET_SETUP_MESSAGE,
    } satisfies PublishResponse);
  }

  try {
    const post = await publishToPadletWithRetry({
      boardId: board!.boardId,
      existingPostId: existingPost?.padletPostId,
      apiKey: padletResolved.key,
      postInput: {
        subject: composed.subject,
        body: composed.body,
        color: composed.color,
        sectionId,
      },
    });

    const postUrl = board!.boardUrl;
    const isUpdate = Boolean(existingPost?.padletPostId);

    await savePadletPostDoc(docId, {
      boardDocId: board!.id ?? "",
      boardId: board!.boardId,
      sectionId,
      studentUid: submission.studentUid,
      studentNo,
      period,
      templateId: submission.templateId,
      submissionId: submission.id,
      padletPostId: post.id,
      postUrl,
      subject: composed.subject,
      bodyHash: composed.bodyHash,
      status: "published",
      attempts: (existingPost?.attempts ?? 0) + 1,
      lastError: null,
      publishedAt: new Date(),
    });

    await updateSubmissionPadletPost(submission.id, {
      boardId: board!.boardId,
      postDocId: docId,
      postUrl,
      status: "published",
      publishedAt: new Date(),
    });

    return NextResponse.json({
      status: isUpdate ? "updated" : "published",
      postUrl,
      boardUrl: board!.boardUrl,
      sectionLabel: `${studentNo}번`,
      subject: composed.subject,
    } satisfies PublishResponse);
  } catch (error) {
    const message =
      error instanceof PadletApiError && error.status === 429
        ? "잠시 후 다시 시도해 주세요."
        : error instanceof Error
          ? error.message
          : "게시에 실패했습니다.";

    if (docId && board) {
      await savePadletPostDoc(docId, {
        boardDocId: board.id ?? "",
        boardId: board.boardId,
        sectionId,
        studentUid: submission.studentUid,
        studentNo,
        period,
        templateId: submission.templateId,
        submissionId: submission.id,
        padletPostId: existingPost?.padletPostId ?? null,
        postUrl: existingPost?.postUrl ?? null,
        subject: composed.subject,
        bodyHash: composed.bodyHash,
        status: "failed",
        attempts: (existingPost?.attempts ?? 0) + 1,
        lastError: message,
      });
    }

    return NextResponse.json({
      status: error instanceof PadletApiError && error.status === 429 ? "rate_limited" : "error",
      postUrl: existingPost?.postUrl ?? null,
      boardUrl: board?.boardUrl ?? null,
      sectionLabel: `${studentNo}번`,
      subject: composed.subject,
      message,
    } satisfies PublishResponse);
  }
}
