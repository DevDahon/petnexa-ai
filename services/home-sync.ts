import * as QueryParams from "expo-auth-session/build/QueryParams";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { AppSnapshot, HealthRecord, Pet, Reminder, Settings, SyncMetadata, Veterinarian } from "@/types/domain";
import { supabase } from "@/utils/supabase";

const ASSET_BUCKET = "petnexa-home-assets";
const AUTH_CALLBACK_PATH = "auth/callback";
const AUTH_SCHEME = "petnexaai";
const NATIVE_AUTH_REDIRECT_TO = `${AUTH_SCHEME}://${AUTH_CALLBACK_PATH}`;

WebBrowser.maybeCompleteAuthSession();

type HomeResult = {
  homeId: string;
  homeName?: string;
  inviteCode?: string;
};

export type HomeAccount = {
  homeId: string;
  homeName: string;
  role?: "owner" | "member";
  inviteCode?: string;
};

type HomeRpcPayload = {
  homeId?: string;
  home_id?: string;
  homeName?: string;
  home_name?: string;
  inviteCode?: string;
  invite_code?: string;
};

type CloudRow<T> = {
  home_id: string;
  id: string;
  data: T;
  created_at?: string;
  updated_at: string;
  deleted_at?: string | null;
};

type LocalSyncRow = { id: string; createdAt?: string } & SyncMetadata;

const tables = {
  pets: "home_pets",
  veterinarians: "home_veterinarians",
  records: "home_health_records",
  reminders: "home_reminders",
} as const;

function getAuthRedirectTo() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/`;
  }
  return NATIVE_AUTH_REDIRECT_TO;
}

function clearBrowserAuthUrl() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const hasAuthPayload =
    window.location.hash.includes("access_token") ||
    window.location.search.includes("code=") ||
    window.location.search.includes("error=");
  if (!hasAuthPayload) return;
  const pathname = window.location.pathname.includes(AUTH_CALLBACK_PATH)
    ? "/"
    : window.location.pathname;
  window.history.replaceState({}, document.title, `${window.location.origin}${pathname}`);
}

type SyncKind = keyof typeof tables;

function nowIso() {
  return new Date().toISOString();
}

function isRemoteUri(uri?: string) {
  return !uri || uri.startsWith("http://") || uri.startsWith("https://");
}

function markSynced<T extends LocalSyncRow>(item: T, homeId: string, userId?: string): T {
  const updatedAt = item.updatedAt ?? item.createdAt ?? nowIso();
  return {
    ...item,
    homeId,
    updatedAt,
    createdBy: item.createdBy ?? userId,
    updatedBy: userId,
    syncStatus: "synced",
  };
}

function newestById<T extends LocalSyncRow>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    const current = map.get(item.id);
    if (!current || Date.parse(item.updatedAt ?? "0") >= Date.parse(current.updatedAt ?? current.createdAt ?? "0")) {
      if (!item.deletedAt) map.set(item.id, item);
      else map.delete(item.id);
    }
  }
  return Array.from(map.values()).filter((item) => !item.deletedAt);
}

async function uploadAsset(homeId: string, kind: "pets" | "records", id: string, uri?: string, existingPath?: string) {
  if (isRemoteUri(uri)) return { uri, path: existingPath };
  try {
    if (!uri) return { uri, path: existingPath };
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = existingPath ?? `${homeId}/${kind}/${id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(ASSET_BUCKET).upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
    if (error) throw error;
    const { data } = await supabase.storage.from(ASSET_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
    return { uri: data?.signedUrl ?? uri, path };
  } catch {
    return { uri, path: existingPath };
  }
}

async function refreshAssetUrl(path?: string) {
  if (!path) return undefined;
  const { data } = await supabase.storage.from(ASSET_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl;
}

async function removeStoragePrefix(prefix: string) {
  const { data } = await supabase.storage.from(ASSET_BUCKET).list(prefix, { limit: 1000 });
  const files = (data ?? []).filter((item) => item.name).map((item) => `${prefix}/${item.name}`);
  if (files.length) await supabase.storage.from(ASSET_BUCKET).remove(files);
}

async function preparePets(pets: Pet[], homeId: string, userId?: string) {
  const prepared: Pet[] = [];
  for (const pet of pets) {
    const asset = await uploadAsset(homeId, "pets", pet.id, pet.photoUri, pet.photoStoragePath);
    prepared.push(markSynced({ ...pet, photoUri: asset.uri, photoStoragePath: asset.path }, homeId, userId));
  }
  return prepared;
}

async function prepareRecords(records: HealthRecord[], homeId: string, userId?: string) {
  const prepared: HealthRecord[] = [];
  for (const record of records) {
    const asset = await uploadAsset(homeId, "records", record.id, record.attachmentUri, record.attachmentStoragePath);
    prepared.push(markSynced({ ...record, attachmentUri: asset.uri, attachmentStoragePath: asset.path }, homeId, userId));
  }
  return prepared;
}

async function upsertRows<T extends LocalSyncRow>(table: string, homeId: string, rows: T[], userId?: string) {
  if (!rows.length) return;
  const payload = rows.map((row) => ({
    home_id: homeId,
    id: row.id,
    data: { ...row, syncStatus: "synced", homeId },
    created_by: row.createdBy ?? userId,
    updated_by: userId,
    updated_at: row.updatedAt ?? nowIso(),
    deleted_at: row.deletedAt ?? null,
  }));
  const { error } = await supabase.from(table).upsert(payload, { onConflict: "home_id,id" });
  if (error) throw error;
}

async function fetchRows<T extends LocalSyncRow>(table: string, homeId: string) {
  const { data, error } = await supabase
    .from(table)
    .select("home_id,id,data,created_at,updated_at,deleted_at")
    .eq("home_id", homeId)
    .order("updated_at", { ascending: true });
  if (error) throw error;
  return Promise.all((data as CloudRow<T>[]).map(async (row) => {
    const item = {
      ...row.data,
      id: row.id,
      homeId: row.home_id,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
      syncStatus: "synced" as const,
    };
    if ("photoStoragePath" in item) {
      const petItem = item as unknown as Pet;
      const signed = await refreshAssetUrl(petItem.photoStoragePath);
      if (signed) petItem.photoUri = signed;
    }
    if ("attachmentStoragePath" in item) {
      const recordItem = item as unknown as HealthRecord;
      const signed = await refreshAssetUrl(recordItem.attachmentStoragePath);
      if (signed) recordItem.attachmentUri = signed;
    }
    return item as T;
  }));
}

export async function signInWithEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getAuthRedirectTo(),
    },
  });
  if (error) throw error;
}

export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
  if (error) throw error;
  if (!data.session?.user) throw new Error("Email verification did not create a session.");
}

async function createSessionFromOAuthUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  const providerError = params.error_description || params.error || errorCode;
  if (providerError) throw new Error(String(providerError));

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: String(accessToken),
      refresh_token: String(refreshToken),
    });
    if (error) throw error;
    return;
  }

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(String(code));
    if (error) throw error;
    return;
  }

  throw new Error("Google login did not return a session.");
}

export async function handleAuthCallbackUrl(url?: string | null) {
  if (!url) return false;
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode || params.error || params.access_token || params.refresh_token || params.code) {
    try {
      await createSessionFromOAuthUrl(url);
      return true;
    } finally {
      clearBrowserAuthUrl();
    }
  }
  return false;
}

export async function signInWithGoogle() {
  const redirectTo = getAuthRedirectTo();

  if (Platform.OS === "web") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        scopes: "openid email profile",
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("Google login URL was not created.");
    if (typeof window !== "undefined") window.location.assign(data.url);
    return;
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error("Google login needs a PetNexa AI development or production build. Use Email OTP while testing in Expo Go.");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: "openid email profile",
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Google login URL was not created.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    toolbarColor: "#22C1A8",
    controlsColor: "#22C1A8",
    dismissButtonStyle: "close",
    showTitle: false,
    enableDefaultShareMenuItem: false,
    createTask: false,
    showInRecents: false,
    useProxyActivity: false,
  });
  if (result.type !== "success") {
    if (await hasHomeAuthSession().catch(() => false)) return;
    throw new Error("Google login was cancelled.");
  }

  try {
    await createSessionFromOAuthUrl(result.url);
  } catch (error) {
    if (await hasHomeAuthSession().catch(() => false)) return;
    throw error;
  }
}

export async function signOutHome() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function hasHomeAuthSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return true;
  return Boolean(await getCurrentUserId().catch(() => undefined));
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id;
}

function normalizeHomeResult(data: unknown, fallbackName?: string): HomeResult {
  const payload = Array.isArray(data) ? data[0] : typeof data === "string" ? JSON.parse(data) as HomeRpcPayload : data as HomeRpcPayload | null;
  const homeId = payload?.homeId ?? payload?.home_id;
  if (!homeId) throw new Error("Home account was created but no Home ID was returned.");
  return {
    homeId,
    homeName: payload?.homeName ?? payload?.home_name ?? fallbackName,
    inviteCode: payload?.inviteCode ?? payload?.invite_code,
  };
}

export async function createHome(name: string, displayName: string): Promise<HomeResult> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in with Google before creating a Home account.");
  const { data, error } = await supabase.rpc("create_home_with_member", {
    home_name: name,
    member_display_name: displayName,
  });
  if (error) throw new Error(error.message || "Could not create Home account.");
  return normalizeHomeResult(data, name);
}

export async function listUserHomes(): Promise<HomeAccount[]> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in with Google to view your Home accounts.");

  const { data: memberships, error: membershipsError } = await supabase
    .from("home_members")
    .select("home_id,role")
    .eq("user_id", userId);
  if (membershipsError) throw new Error(membershipsError.message || "Could not load Home accounts.");

  const rows = (memberships ?? []) as Array<{ home_id: string; role?: "owner" | "member" }>;
  const homeIds = rows.map((row) => row.home_id).filter(Boolean);
  if (!homeIds.length) return [];

  const { data: homes, error: homesError } = await supabase
    .from("homes")
    .select("id,name")
    .in("id", homeIds);
  if (homesError) throw new Error(homesError.message || "Could not load Home names.");

  const { data: invites } = await supabase
    .from("home_invites")
    .select("home_id,code")
    .in("home_id", homeIds)
    .is("revoked_at", null);

  const namesById = new Map((homes ?? []).map((home: { id: string; name: string }) => [home.id, home.name]));
  const inviteByHomeId = new Map((invites ?? []).map((invite: { home_id: string; code: string }) => [invite.home_id, invite.code]));
  return rows.map((row) => ({
    homeId: row.home_id,
    homeName: namesById.get(row.home_id) || "PetNexa Home",
    role: row.role,
    inviteCode: inviteByHomeId.get(row.home_id),
  }));
}

export async function deleteHome(homeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in with Google before deleting a Home account.");

  const { data: membership, error: membershipError } = await supabase
    .from("home_members")
    .select("role")
    .eq("home_id", homeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message || "Could not verify Home ownership.");
  if (membership?.role !== "owner") throw new Error("Only the Home owner can delete this Home.");

  await Promise.all([
    removeStoragePrefix(`${homeId}/pets`).catch(() => undefined),
    removeStoragePrefix(`${homeId}/records`).catch(() => undefined),
  ]);

  const { error } = await supabase.from("homes").delete().eq("id", homeId);
  if (error) throw new Error(error.message || "Could not delete Home account.");
}

export async function leaveHome(homeId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in with Google before leaving a shared Fur Home.");

  const { error } = await supabase.rpc("leave_home", { target_home_id: homeId });
  if (error) throw new Error(error.message || "Could not leave Fur Home.");
}

export async function joinHome(inviteCode: string, displayName: string): Promise<HomeResult> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in with Google before joining a Home account.");
  const { data, error } = await supabase.rpc("join_home_by_invite", {
    invite_code: inviteCode.trim().toUpperCase(),
    member_display_name: displayName,
  });
  if (error) throw new Error(error.message || "Could not join Home account.");
  return normalizeHomeResult(data);
}

export async function pushPendingChanges(snapshot: AppSnapshot) {
  const homeId = snapshot.settings.homeId;
  if (!homeId || snapshot.settings.careMode !== "home" || !snapshot.settings.syncEnabled) return snapshot;
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in required for Home sync.");

  const pets = await preparePets(snapshot.pets, homeId, userId);
  const records = await prepareRecords(snapshot.records, homeId, userId);
  const veterinarians = snapshot.veterinarians.map((item) => markSynced(item, homeId, userId));
  const reminders = snapshot.reminders.map((item) => markSynced(item, homeId, userId));

  await upsertRows(tables.pets, homeId, pets, userId);
  await upsertRows(tables.veterinarians, homeId, veterinarians, userId);
  await upsertRows(tables.records, homeId, records, userId);
  await upsertRows(tables.reminders, homeId, reminders, userId);

  return {
    ...snapshot,
    pets,
    veterinarians,
    records,
    reminders,
  };
}

export async function pullHomeSnapshot(snapshot: AppSnapshot) {
  const homeId = snapshot.settings.homeId;
  if (!homeId || snapshot.settings.careMode !== "home" || !snapshot.settings.syncEnabled) return snapshot;
  const [pets, veterinarians, records, reminders] = await Promise.all([
    fetchRows<Pet>(tables.pets, homeId),
    fetchRows<Veterinarian>(tables.veterinarians, homeId),
    fetchRows<HealthRecord>(tables.records, homeId),
    fetchRows<Reminder>(tables.reminders, homeId),
  ]);
  return {
    ...snapshot,
    pets: newestById(snapshot.pets, pets),
    veterinarians: newestById(snapshot.veterinarians, veterinarians),
    records: newestById(snapshot.records, records),
    reminders: newestById(snapshot.reminders, reminders),
    settings: { ...snapshot.settings, lastSyncAt: nowIso() } satisfies Settings,
  };
}

export async function syncNow(snapshot: AppSnapshot) {
  const pushed = await pushPendingChanges(snapshot);
  return pullHomeSnapshot(pushed);
}

export async function softDeleteCloudEntity(kind: SyncKind, homeId: string | undefined, id: string) {
  if (!homeId) return;
  const userId = await getCurrentUserId();
  if (!userId) return;
  const deletedAt = nowIso();
  await supabase
    .from(tables[kind])
    .update({
      updated_by: userId,
      updated_at: deletedAt,
      deleted_at: deletedAt,
      data: { id, homeId, deletedAt, updatedAt: deletedAt, syncStatus: "synced" },
    })
    .eq("home_id", homeId)
    .eq("id", id);
}
