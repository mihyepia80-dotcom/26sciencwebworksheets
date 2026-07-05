import { FieldValue, type Firestore } from "firebase-admin/firestore";

export type ResolveTeacherPinResult =
  | { ok: true; teacherUid: string }
  | { ok: false; error: string; status: 403 };

/** studentAccessPins 문서 조회(우선) + teachers 쿼리(마이그레이션) */
export async function resolveTeacherUidByAccessPin(
  db: Firestore,
  accessPin: string,
): Promise<ResolveTeacherPinResult> {
  const pinSnap = await db.collection("studentAccessPins").doc(accessPin).get();
  if (pinSnap.exists) {
    const teacherUid = String(pinSnap.data()?.teacherUid ?? "");
    if (!teacherUid) {
      return { ok: false, error: "암호가 올바르지 않습니다.", status: 403 };
    }
    const teacherSnap = await db.collection("teachers").doc(teacherUid).get();
    const savedPin = String(teacherSnap.data()?.accessPin ?? "");
    if (!teacherSnap.exists || savedPin !== accessPin) {
      return { ok: false, error: "암호가 올바르지 않습니다.", status: 403 };
    }
    return { ok: true, teacherUid };
  }

  const teachersSnap = await db.collection("teachers").where("accessPin", "==", accessPin).limit(2).get();
  if (teachersSnap.empty) {
    return { ok: false, error: "암호가 올바르지 않습니다.", status: 403 };
  }
  if (teachersSnap.size > 1) {
    return {
      ok: false,
      error: "같은 암호를 사용하는 교사가 여러 명입니다. 담임 선생님께 문의해 주세요.",
      status: 403,
    };
  }

  const teacherUid = teachersSnap.docs[0].id;
  await db.collection("studentAccessPins").doc(accessPin).set({
    teacherUid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true, teacherUid };
}
