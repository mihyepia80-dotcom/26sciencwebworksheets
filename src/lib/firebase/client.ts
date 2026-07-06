"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function assertClient() {
  if (typeof window === "undefined") {
    throw new Error("Firebase 클라이언트는 브라우저에서만 사용할 수 있습니다.");
  }
}

export function getClientApp(): FirebaseApp {
  assertClient();
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  }
  return app;
}

export function getClientAuth(): Auth {
  assertClient();
  if (!auth) auth = getAuth(getClientApp());
  return auth;
}

export function getClientDb(): Firestore {
  assertClient();
  if (!db) db = getFirestore(getClientApp());
  return db;
}
