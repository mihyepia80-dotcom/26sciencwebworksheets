"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let authPersistencePromise: Promise<void> | null = null;

function assertClient() {
  if (typeof window === "undefined") {
    throw new Error("Firebase 클라이언트는 브라우저에서만 사용할 수 있습니다.");
  }
}

async function ensureAuthPersistence(clientAuth: Auth): Promise<void> {
  if (!authPersistencePromise) {
    authPersistencePromise = setPersistence(clientAuth, browserLocalPersistence).catch((error) => {
      authPersistencePromise = null;
      console.warn("Firebase auth persistence setup failed", error);
    });
  }
  await authPersistencePromise;
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

export async function getClientAuthReady(): Promise<Auth> {
  const clientAuth = getClientAuth();
  await ensureAuthPersistence(clientAuth);
  return clientAuth;
}

export function getClientDb(): Firestore {
  assertClient();
  if (!db) db = getFirestore(getClientApp());
  return db;
}
