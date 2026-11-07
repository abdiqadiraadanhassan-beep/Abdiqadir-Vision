import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Image, Linking, RefreshControl,
  SafeAreaView, ScrollView, Share, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Supabase project
const SUPABASE_URL = "https://zzrvmgserllvieuswncp.supabase.co";
const SUPABASE_KEY = "sb_publishable_uZ7EhY1iXJGlgC1W2xIXuQ_xTThCf0r";
const OWNER_ID = "00b7f429-6632-465a-9a6f-7003f7564703";
const BUCKET = "media";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const GOLD = "#D6AD48";
const BLUE = "#0755D9";

const CATEGORIES = [
  { id: "all", icon: "▦", so: "Dhammaan", en: "All", sw: "Zote", ar: "الكل" },
  { id: "video", icon: "▶", so: "Muuqaallo", en: "Videos", sw: "Video", ar: "فيديوهات" },
  { id: "photo", icon: "▧", so: "Sawirro", en: "Photos", sw: "Picha", ar: "صور" },
  { id: "program", icon: "▣", so: "Barnaamijyo", en: "Programs", sw: "Vipindi", ar: "برامج" },
  { id: "story", icon: "▤", so: "Qisooyin", en: "Stories", sw: "Hadithi", ar: "قصص" },
  { id: "awareness", icon: "✦", so: "Wacyigelin", en: "Awareness", sw: "Uhamasishaji", ar: "التوعية" },
  { id: "message", icon: "✉", so: "Fariimo", en: "Messages", sw: "Ujumbe", ar: "رسائل" },
];

const WORDS = {
  so: {
    home: "Hoyga", episodes: "Barnaamijyo", live: "Toos", account: "Akoon",
    latest: "Waxyaabihii ugu dambeeyay", upload: "Soo geli", watch: "Daawo",
    browse: "Eeg dhammaan", comments: "Faallooyinka", send: "Dir faallo",
    name: "Magacaaga", comment: "Qor faallo...", login: "Owner / Admin gelitaan",
    email: "Email", password: "Password", enter: "Soo gal", logout: "Ka bax",
    settings: "Dejinta", language: "Luqadda", appearance: "Muuqaalka",
    light: "Muuqaal cad", dark: "Muuqaal madow", appname: "Magaca app-ka",
    save: "Kaydi", search: "Raadi...", empty: "Weli waxba lama soo gelin.",
    private: "Qaybta gaarka ah", title: "Cinwaanka", body: "Qoraalkaaga halkan ku qor",
    category: "Qaybta", photo: "Sawir ama muuqaal", follow: "Raac Abdiqadir Vision",
    changeLogo: "Beddel logo-ga", publish: "Daabac", cancel: "Jooji",
    all: "Dhammaan", noComments: "Faallo weli ma jirto.", choose: "Dooro qaybta",
    open: "Fur", views: "Daawasho", likes: "Jeclaysi", delete: "Tirtir",
  },
  en: {
    home: "Home", episodes: "Programs", live: "Live", account: "Account",
    latest: "Latest updates", upload: "Upload", watch: "Watch",
    browse: "Browse all", comments: "Comments", send: "Send comment",
    name: "Your name", comment: "Write a comment...", login: "Owner / Admin login",
    email: "Email", password: "Password", enter: "Sign in", logout: "Sign out",
    settings: "Settings", language: "Language", appearance: "Appearance",
    light: "Light mode", dark: "Dark mode", appname: "App name",
    save: "Save", search: "Search...", empty: "Nothing has been uploaded yet.",
    private: "Private section", title: "Title", body: "Write your message here",
    category: "Category", photo: "Photo or video", follow: "Follow Abdiqadir Vision",
    changeLogo: "Change logo", publish: "Publish", cancel: "Cancel",
    all: "All", noComments: "No comments yet.", choose: "Choose category",
    open: "Open", views: "Views", likes: "Likes", delete: "Delete",
  },
  sw: {
    home: "Nyumbani", episodes: "Vipindi", live: "Moja kwa moja", account: "Akaunti",
    latest: "Vilivyowekwa hivi karibuni", upload: "Pakia", watch: "Tazama",
    browse: "Tazama vyote", comments: "Maoni", send: "Tuma maoni",
    name: "Jina lako", comment: "Andika maoni...", login: "Ingia Owner / Admin",
    email: "Barua pepe", password: "Nenosiri", enter: "Ingia", logout: "Toka",
    settings: "Mipangilio", language: "Lugha", appearance: "Muonekano",
    light: "Mwanga", dark: "Giza", appname: "Jina la app",
    save: "Hifadhi", search: "Tafuta...", empty: "Hakuna kilichowekwa bado.",
    private: "Sehemu ya siri", title: "Kichwa", body: "Andika ujumbe wako hapa",
    category: "Aina", photo: "Picha au video", follow: "Fuata Abdiqadir Vision",
    changeLogo: "Badilisha logo", publish: "Chapisha", cancel: "Ghairi",
    all: "Zote", noComments: "Hakuna maoni bado.", choose: "Chagua aina",
    open: "Fungua", views: "Mionekano", likes: "Likes", delete: "Futa",
  },
  ar: {
    home: "الرئيسية", episodes: "البرامج", live: "مباشر", account: "الحساب",
    latest: "أحدث المنشورات", upload: "رفع", watch: "شاهد",
    browse: "عرض الكل", comments: "التعليقات", send: "إرسال تعليق",
    name: "اسمك", comment: "اكتب تعليقاً...", login: "دخول المالك / المدير",
    email: "البريد الإلكتروني", password: "كلمة المرور", enter: "دخول", logout: "خروج",
    settings: "الإعدادات", language: "اللغة", appearance: "المظهر",
    light: "الوضع الفاتح", dark: "الوضع الداكن", appname: "اسم التطبيق",
    save: "حفظ", search: "بحث...", empty: "لم تتم إضافة أي منشورات بعد.",
    private: "القسم الخاص", title: "العنوان", body: "اكتب رسالتك هنا",
    category: "القسم", photo: "صورة أو فيديو", follow: "تابع Abdiqadir Vision",
    changeLogo: "تغيير الشعار", publish: "نشر", cancel: "إلغاء",
    all: "الكل", noComments: "لا توجد تعليقات بعد.", choose: "اختر القسم",
    open: "فتح", views: "مشاهدات", likes: "إعجابات", delete: "حذف",
  },
};

const encodeTitle = (category, title) => `[[${category}]]${title}`;

function decodePost(post) {
  const match = (post.title || "").match(/^\[\[(.*?)\]\](.*)$/);
  return {
    ...post,
    category: match ? match[1] :
      post.media_type === "video" ? "video" :
      post.media_type === "image" ? "photo" : "story",
    displayTitle: match ? match[2] : (post.title || "Abdiqadir Vision"),
  };
}

function makeStyles(c) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    page: { flex: 1, backgroundColor: c.bg },
    header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    brandRow: { flexDirection: "row", alignItems: "center", flex: 1 },
    logo: { width: 43, height: 43, borderRadius: 14, backgroundColor: c.card },
    logoFallback: { width: 43, height: 43, borderRadius: 14, backgroundColor: BLUE, alignItems: "center", justifyContent: "center" },
    logoText: { color: "#fff", fontWeight: "900", fontSize: 19 },
    brand: { color: c.text, fontWeight: "900", fontSize: 17, marginLeft: 10, flexShrink: 1 },
    headerButton: { padding: 10, borderRadius: 12, backgroundColor: c.card, marginLeft: 7 },
    headerButtonText: { color: c.text, fontWeight: "800", fontSize: 17 },
    hero: { marginHorizontal: 16, marginTop: 4, borderRadius: 22, padding: 20, backgroundColor: c.hero, minHeight: 150, justifyContent: "center" },
    heroSmall: { color: "#DCE7FF", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
    heroTitle: { color: "#fff", fontWeight: "900", fontSize: 25, marginTop: 7 },
    heroSub: { color: "#E2E9FF", fontSize: 13, marginTop: 7, lineHeight: 19 },
    goldLine: { width: 42, height: 4, backgroundColor: GOLD, borderRadius: 4, marginTop: 13 },
    sectionHead: { paddingHorizontal: 18, marginTop: 22, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { color: c.text, fontSize: 18, fontWeight: "900" },
    muted: { color: c.muted, fontSize: 12 },
    category: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, marginRight: 8 },
    categoryActive: { backgroundColor: BLUE, borderColor: BLUE },
    categoryText: { color: c.text, fontWeight: "700", fontSize: 12 },
    categoryTextActive: { color: "#fff" },
    card: { backgroundColor: c.card, borderRadius: 18, marginHorizontal: 16, marginBottom: 14, overflow: "hidden", borderWidth: 1, borderColor: c.border },
    media: { width: "100%", height: 195, backgroundColor: c.input },
    mediaFallback: { width: "100%", height: 150, backgroundColor: c.input, alignItems: "center", justifyContent: "center" },
    mediaFallbackText: { color: c.muted, fontSize: 35 },
    cardBody: { padding: 14 },
    cardTitle: { color: c.text, fontSize: 16, fontWeight: "800", lineHeight: 22 },
    metaRow: { flexDirection: "row", alignItems: "center", marginTop: 10, justifyContent: "space-between" },
    meta: { color: c.muted, fontSize: 11 },
    actions: { flexDirection: "row", alignItems: "center" },
    action: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: c.input, marginLeft: 7 },
    actionText: { color: c.text, fontSize: 12, fontWeight: "700" },
    button: { backgroundColor: BLUE, borderRadius: 13, paddingVertical: 13, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
    buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
    outlineButton: { borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
    outlineText: { color: c.text, fontWeight: "700" },
    input: { backgroundColor: c.input, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: c.text, marginTop: 8, fontSize: 14 },
    label: { color: c.text, fontWeight: "800", marginTop: 14, fontSize: 13 },
    panel: { backgroundColor: c.card, borderRadius: 18, margin: 16, padding: 16, borderWidth: 1, borderColor: c.border },
    nav: { flexDirection: "row", borderTopWidth: 1, borderColor: c.border, backgroundColor: c.card, paddingVertical: 9, paddingHorizontal: 5 },
    navItem: { flex: 1, alignItems: "center", paddingVertical: 5 },
    navText: { color: c.muted, fontSize: 10, fontWeight: "700", marginTop: 3 },
    navActive: { color: BLUE },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
    empty: { color: c.muted, textAlign: "center", marginTop: 12, lineHeight: 20 },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 13 },
    row: { flexDirection: "row", alignItems: "center" },
    modalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    modalTitle: { color: c.text, fontSize: 19, fontWeight: "900" },
    comment: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
    commentName: { color: c.text, fontWeight: "800", fontSize: 13 },
    commentBody: { color: c.muted, marginTop: 4, lineHeight: 19 },
    pill: { backgroundColor: c.input, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, marginRight: 7, marginTop: 7 },
    pillText: { color: c.text, fontSize: 12, fontWeight: "700" },
  });
}

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("visitor");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [category, setCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [language, setLanguage] = useState("so");
  const [dark, setDark] = useState(false);
  const [appName, setAppName] = useState("Abdiqadir Vision");
  const [nameDraft, setNameDraft] = useState("Abdiqadir Vision");
  const [appLogo, setAppLogo] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [displayName, setDisplayName] = useState("Marti");
  const [likes, setLikes] = useState({});
  const [myLikes, setMyLikes] = useState({});
  const [viewCounts, setViewCounts] = useState({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadBody, setUploadBody] = useState("");
  const [uploadCategory, setUploadCategory] = useState("photo");
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateText, setPrivateText] = useState("");
  const [privateContent, setPrivateContent] = useState([]);

  const userId = session?.user?.id;
  const isManager = role === "owner" || role === "admin";
  const t = WORDS[language] || WORDS.so;
  const colors = dark
    ? { bg: "#10131D", card: "#1D2230", text: "#FFFFFF", muted: "#A7AEC0", border: "#30394D", input: "#292F40", hero: "#102E70" }
    : { bg: "#F5F7FC", card: "#FFFFFF", text: "#171D32", muted: "#7B8295", border: "#E5E9F2", input: "#F0F2F8", hero: "#0645C5" };
  const styles = useMemo(() => makeStyles(colors), [dark]);

  const ensureSession = useCallback(async () => {
    const { data: { session: current }, error: getError } = await supabase.auth.getSession();
    if (getError) console.warn(getError.message);
    if (current) { setSession(current); return current; }
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) { console.warn(error.message); return null; }
    setSession(data.session);
    return data.session;
  }, []);

  const loadRole = useCallback(async (uid) => {
    if (!uid) { setRole("visitor"); return; }
    if (uid === OWNER_ID) { setRole("owner"); return; }
    const { data, error } = await supabase.from("app_roles").select("role").eq("user_id", uid).maybeSingle();
    setRole(!error && data?.role === "admin" ? "admin" : "visitor");
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const values = await AsyncStorage.multiGet(["av_language", "av_dark", "av_app_name"]);
      if (values[0]?.[1] && WORDS[values[0][1]]) setLanguage(values[0][1]);
      if (values[1]?.[1]) setDark(values[1][1] === "true");
      if (values[2]?.[1]) { setAppName(values[2][1]); setNameDraft(values[2][1]); }
    } catch (e) { console.warn(e); }
    const { data, error } = await supabase.from("app_settings").select("logo_url").eq("id", 1).maybeSingle();
    if (!error && data?.logo_url) setAppLogo(data.logo_url);
  }, []);

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase.from("posts")
      .select("id,title,media_url,media_type,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const decoded = (data || []).map(decodePost);
    setPosts(decoded);
    const ids = decoded.map(p => p.id);
    if (!ids.length) { setLikes({}); setMyLikes({}); setViewCounts({}); return; }
    const [lr, vr, mr] = await Promise.all([
      supabase.from("post_likes").select("post_id").in("post_id", ids),
      supabase.from("post_views").select("post_id").in("post_id", ids),
      userId ? supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", ids) : Promise.resolve({ data: [], error: null }),
    ]);
    if (!lr.error) {
      const counts = {};
      (lr.data || []).forEach(x => { counts[x.post_id] = (counts[x.post_id] || 0) + 1; });
      setLikes(counts);
    }
    if (!vr.error) {
      const counts = {};
      (vr.data || []).forEach(x => { counts[x.post_id] = (counts[x.post_id] || 0) + 1; });
      setViewCounts(counts);
    }
    if (!mr.error) {
      const mine = {};
      (mr.data || []).forEach(x => { mine[x.post_id] = true; });
      setMyLikes(mine);
    }
  }, [userId]);

  const loadPrivate = useCallback(async () => {
    if (role !== "owner") return;
    const { data, error } = await supabase.from("owner_private").select("id,content,created_at").order("created_at", { ascending: false });
    if (!error) setPrivateContent(data || []);
  }, [role]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { await loadPosts(); }
    catch (e) { Alert.alert("Khalad", e.message || "Xogta lama soo qaadi karin."); }
    finally { setLoading(false); }
  }, [loadPosts]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadSettings();
      const current = await ensureSession();
      if (current) await loadRole(current.user.id);
      if (mounted) await refresh();
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user?.id) loadRole(next.user.id);
      else setRole("visitor");
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [ensureSession, loadRole, loadSettings, refresh]);

  useEffect(() => { loadPrivate(); }, [loadPrivate]);

  async function saveSetting(key, value) {
    try { await AsyncStorage.setItem(key, String(value)); }
    catch (e) { Alert.alert("Kaydin", e.message); }
  }
  async function changeLanguage(value) { setLanguage(value); await saveSetting("av_language", value); }
  async function changeTheme(value) { setDark(value); await saveSetting("av_dark", value); }

  async function saveAppName() {
    const value = nameDraft.trim();
    if (!value) return Alert.alert("Magaca", "Geli magaca app-ka.");
    setAppName(value);
    await saveSetting("av_app_name", value);
    Alert.alert("Waa guul", "Magaca waa la kaydiyey.");
  }

  async function chooseLogo() {
    if (!isManager) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return Alert.alert("Oggolaansho", "Oggolow gelitaanka sawirrada telefoonka.");
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [1, 1] });
      if (result.canceled || !result.assets?.length) return;
      setBusy(true);
      const asset = result.assets[0];
      const blob = await (await fetch(asset.uri)).blob();
      const path = `logo/av-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: asset.mimeType || "image/jpeg", upsert: false });
      if (error) throw error;
      const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const { error: saveError } = await supabase.from("app_settings").upsert({ id: 1, logo_url: publicUrl }, { onConflict: "id" });
      if (saveError) throw saveError;
      setAppLogo(publicUrl);
      Alert.alert("Waa guul", "Logo-ga waa la beddelay.");
    } catch (e) { Alert.alert("Khalad", e.message); }
    finally { setBusy(false); }
  }

  async function uploadPost() {
    if (!isManager) return Alert.alert("Oggolaansho", "Kaliya Owner/Admin ayaa wax soo gelin kara.");
    if (!uploadTitle.trim() && !uploadBody.trim()) return Alert.alert("Xog", "Geli cinwaan ama qoraal.");
    try {
      setBusy(true);
      let mediaUrl = null;
      let mediaType = "text";
      if (uploadCategory === "photo" || uploadCategory === "video") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { Alert.alert("Oggolaansho", "Oggolow sawirrada telefoonka."); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: uploadCategory === "video" ? ["videos"] : ["images"],
          quality: 0.85, allowsEditing: false,
        });
        if (result.canceled || !result.assets?.length) return;
        const asset = result.assets[0];
        const isVideo = asset.type === "video" || uploadCategory === "video";
        const ext = asset.fileName?.split(".").pop() || (isVideo ? "mp4" : "jpg");
        const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const blob = await (await fetch(asset.uri)).blob();
        const contentType = asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg");
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType, upsert: false });
        if (error) throw error;
        mediaUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        mediaType = isVideo ? "video" : "image";
      }
      const fullText = [uploadTitle.trim(), uploadBody.trim()].filter(Boolean).join(" — ");
      const { error } = await supabase.from("posts").insert({
        title: encodeTitle(uploadCategory, fullText), media_url: mediaUrl, media_type: mediaType,
      });
      if (error) throw error;
      setUploadTitle(""); setUploadBody(""); setUploadOpen(false); setUploadCategory("photo");
      Alert.alert("Waa guul", "Waa la soo geliyey.");
      await refresh();
    } catch (e) { Alert.alert("Khalad", e.message); }
    finally { setBusy(false); }
  }

  async function openPost(post) {
    setSelectedPost(post);
    setComments([]);
    const { data, error } = await supabase.from("comments")
      .select("id,post_id,display_name,body,created_at,user_id")
      .eq("post_id", post.id).order("created_at", { ascending: true });
    if (!error) setComments(data || []);
    if (userId) {
      const { error: viewError } = await supabase.from("post_views").insert({ post_id: post.id });
      if (!viewError) setViewCounts(old => ({ ...old, [post.id]: (old[post.id] || 0) + 1 }));
    }
  }

  async function addComment() {
    if (!userId) return Alert.alert("Faallo", "Sug inta akoonka martida la diyaarinayo.");
    if (!commentText.trim() || !selectedPost) return;
    const { error } = await supabase.from("comments").insert({
      post_id: selectedPost.id, display_name: displayName.trim() || "Marti",
      body: commentText.trim(), user_id: userId,
    });
    if (error) return Alert.alert("Faallo", error.message);
    setCommentText("");
    const { data } = await supabase.from("comments").select("id,post_id,display_name,body,created_at,user_id")
      .eq("post_id", selectedPost.id).order("created_at", { ascending: true });
    setComments(data || []);
  }

  async function toggleLike(post) {
    if (!userId) return;
    const { data: existing, error } = await supabase.from("post_likes").select("post_id")
      .eq("post_id", post.id).eq("user_id", userId).maybeSingle();
    if (error) return Alert.alert("Like", error.message);
    if (existing) {
      const { error: delError } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
      if (delError) return Alert.alert("Like", delError.message);
    } else {
      const { error: addError } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
      if (addError) return Alert.alert("Like", addError.message);
    }
    await refresh();
  }

  async function followOwner() {
    if (!userId) return;
    const { error } = await supabase.from("follows").upsert({ follower_id: userId, following_id: OWNER_ID }, { onConflict: "follower_id,following_id" });
    if (error) Alert.alert("Follow", error.message);
    else Alert.alert("Waa guul", "Waad raacday Abdiqadir Vision.");
  }

  async function signInOwner() {
    if (!email.trim() || !password) return Alert.alert("Gelitaan", "Geli email-ka iyo password-ka.");
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setSession(data.session);
      await loadRole(data.user.id);
      setLoginOpen(false); setPassword("");
      Alert.alert("Waa guul", "Waad soo gashay.");
    } catch (e) { Alert.alert("Gelitaan", e.message); }
    finally { setBusy(false); }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return Alert.alert("Khalad", error.message);
    setSession(null); setRole("visitor");
    await ensureSession();
  }

  async function savePrivate() {
    if (role !== "owner" || !privateText.trim()) return;
    const { error } = await supabase.from("owner_private").insert({ content: privateText.trim() });
    if (error) return Alert.alert("Private", error.message);
    setPrivateText(""); await loadPrivate();
    Alert.alert("Waa guul", "Xogta waa la kaydiyey.");
  }

  async function sharePost(post) {
    try { await Share.share({ message: `${post.displayTitle}\n${post.media_url || ""}` }); }
    catch { Alert.alert("Wadaag", "Lama wadaagi karin."); }
  }

  const visiblePosts = useMemo(() => posts.filter(post => {
    const matchesCategory = category === "all" || post.category === category;
    const q = searchText.trim().toLowerCase();
    const matchesSearch = !q || post.displayTitle.toLowerCase().includes(q);
    const matchesTab = activeTab !== "episodes" || ["program", "video"].includes(post.category);
    return matchesCategory && matchesSearch && matchesTab;
  }), [posts, category, searchText, activeTab]);

  function categoryName(id) {
    const item = CATEGORIES.find(x => x.id === id);
    return item ? item[language] || item.so : id;
  }

  function renderPost({ item }) {
    return (
      <View style={styles.card}>
        {item.media_url ? (
          item.media_type === "image" ?
            <Image source={{ uri: item.media_url }} style={styles.media} resizeMode="cover" /> :
            <TouchableOpacity activeOpacity={0.85} onPress={() => Linking.openURL(item.media_url)}>
              <View style={styles.mediaFallback}>
                <Text style={styles.mediaFallbackText}>▶</Text>
                <Text style={styles.muted}>{t.watch}</Text>
              </View>
            </TouchableOpacity>
        ) : null}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.displayTitle}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{categoryName(item.category)}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.action} onPress={() => toggleLike(item)}>
                <Text style={[styles.actionText, myLikes[item.id] && { color: "#E34B68" }]}>
                  {myLikes[item.id] ? "♥" : "♡"} {likes[item.id] || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action} onPress={() => openPost(item)}>
                <Text style={styles.actionText}>▤ {t.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.action} onPress={() => sharePost(item)}>
                <Text style={styles.actionText}>↗</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.meta, { marginTop: 8 }]}>{t.views}: {viewCounts[item.id] || 0}</Text>
        </View>
      </View>
    );
  }

  function renderHome() {
    return (
      <ScrollView
        style={styles.page}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.heroSmall}>WELCOME TO</Text>
          <Text style={styles.heroTitle}>{appName}</Text>
          <Text style={styles.heroSub}>Warar, barnaamijyo, muuqaallo iyo fariimo xiiso leh.</Text>
          <View style={styles.goldLine} />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t.latest}</Text>
          <Text style={styles.muted}>{posts.length} posts</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}>
          {CATEGORIES.map(item => (
            <TouchableOpacity key={item.id} style={[styles.category, category === item.id && styles.categoryActive]} onPress={() => setCategory(item.id)}>
              <Text style={[styles.categoryText, category === item.id && styles.categoryTextActive]}>
                {item.icon}  {item[language] || item.so}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && posts.length === 0 ? (
          <View style={styles.center}><ActivityIndicator size="large" color={BLUE} /><Text style={styles.empty}>Xogta ayaa la soo gelinayaa...</Text></View>
        ) : visiblePosts.length ? (
          <FlatList data={visiblePosts} keyExtractor={item => String(item.id)} renderItem={renderPost} scrollEnabled={false} contentContainerStyle={{ paddingTop: 15, paddingBottom: 20 }} />
        ) : (
          <View style={styles.center}><Text style={{ fontSize: 35 }}>▤</Text><Text style={styles.empty}>{t.empty}</Text></View>
        )}
      </ScrollView>
    );
  }

  function renderEpisodes() {
    return (
      <ScrollView style={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{t.episodes}</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {["all", "program", "video"].map(id => (
            <TouchableOpacity key={id} style={[styles.category, category === id && styles.categoryActive]} onPress={() => setCategory(id)}>
              <Text style={[styles.categoryText, category === id && styles.categoryTextActive]}>{categoryName(id)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {visiblePosts.length ? <FlatList data={visiblePosts} keyExtractor={x => String(x.id)} renderItem={renderPost} scrollEnabled={false} contentContainerStyle={{ paddingTop: 15 }} /> :
          <View style={styles.center}><Text style={styles.empty}>{t.empty}</Text></View>}
      </ScrollView>
    );
  }

  function renderAccount() {
    return (
      <ScrollView style={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t.account}</Text>
          <Text style={[styles.muted, { marginTop: 8 }]}>Abdiqadir Vision · {role.toUpperCase()}</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 18 }]} onPress={() => setLoginOpen(true)}>
            <Text style={styles.buttonText}>{t.login}</Text>
          </TouchableOpacity>
          {isManager && (
            <>
              <TouchableOpacity style={[styles.outlineButton, { marginTop: 10 }]} onPress={() => setUploadOpen(true)}>
                <Text style={styles.outlineText}>＋ {t.upload}</Text>
              </TouchableOpacity>
              {role === "owner" && <TouchableOpacity style={[styles.outlineButton, { marginTop: 10 }]} onPress={() => setPrivateOpen(true)}>
                <Text style={styles.outlineText}>▣ {t.private}</Text>
              </TouchableOpacity>}
            </>
          )}
          {session && <TouchableOpacity style={[styles.outlineButton, { marginTop: 10 }]} onPress={signOut}>
            <Text style={styles.outlineText}>{t.logout}</Text>
          </TouchableOpacity>}
        </View>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t.settings}</Text>
          <Text style={styles.label}>{t.language}</Text>
          <View style={styles.row}>
            {[["so", "Soomaali"], ["en", "English"], ["sw", "Kiswahili"], ["ar", "العربية"]].map(([id, label]) => (
              <TouchableOpacity key={id} style={[styles.pill, language === id && { backgroundColor: BLUE }]} onPress={() => changeLanguage(id)}>
                <Text style={[styles.pillText, language === id && { color: "#fff" }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>{t.appearance}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.pill, !dark && { backgroundColor: BLUE }]} onPress={() => changeTheme(false)}>
              <Text style={[styles.pillText, !dark && { color: "#fff" }]}>{t.light}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, dark && { backgroundColor: BLUE }]} onPress={() => changeTheme(true)}>
              <Text style={[styles.pillText, dark && { color: "#fff" }]}>{t.dark}</Text>
            </TouchableOpacity>
          </View>
          {isManager && <>
            <Text style={styles.label}>{t.appname}</Text>
            <TextInput style={styles.input} value={nameDraft} onChangeText={setNameDraft} placeholder={t.appname} placeholderTextColor={colors.muted} />
            <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={saveAppName}><Text style={styles.buttonText}>{t.save}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.outlineButton, { marginTop: 10 }]} onPress={chooseLogo}><Text style={styles.outlineText}>{t.changeLogo}</Text></TouchableOpacity>
          </>}
        </View>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t.follow}</Text>
          <Text style={[styles.muted, { marginTop: 6 }]}>La soco wararka iyo waxyaabaha cusub.</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 14 }]} onPress={followOwner}><Text style={styles.buttonText}>＋ {t.follow}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderLive() {
    return (
      <View style={styles.page}>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{t.live}</Text>
          <Text style={styles.empty}>Qaybta Live-ka waxaa lagu xiriirin karaa baahinta tooska ah marka link-ga stream-ka la diyaariyo.</Text>
        </View>
      </View>
    );
  }

  function renderModalPanel(title, content, close) {
    return (
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 16, zIndex: 20 }]}>
        <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 18, maxHeight: "90%" }}>
          <View style={styles.modalTop}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={close}><Text style={{ color: colors.text, fontSize: 24 }}>×</Text></TouchableOpacity>
          </View>
          {content}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          {appLogo ? <Image source={{ uri: appLogo }} style={styles.logo} /> :
            <View style={styles.logoFallback}><Text style={styles.logoText}>AV</Text></View>}
          <Text style={styles.brand} numberOfLines={1}>{appName}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => setSearchOpen(v => !v)}><Text style={styles.headerButtonText}>⌕</Text></TouchableOpacity>
        {isManager && <TouchableOpacity style={styles.headerButton} onPress={() => setUploadOpen(true)}><Text style={styles.headerButtonText}>＋</Text></TouchableOpacity>}
      </View>

      {searchOpen && <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <TextInput style={styles.input} value={searchText} onChangeText={setSearchText} placeholder={t.search} placeholderTextColor={colors.muted} autoFocus />
      </View>}

      {activeTab === "home" ? renderHome() :
        activeTab === "episodes" ? renderEpisodes() :
        activeTab === "live" ? renderLive() : renderAccount()}

      <View style={styles.nav}>
        {[
          ["home", "⌂", t.home],
          ["episodes", "▣", t.episodes],
          ["live", "◉", t.live],
          ["account", "♙", t.account],
        ].map(([id, icon, label]) => (
          <TouchableOpacity key={id} style={styles.navItem} onPress={() => setActiveTab(id)}>
            <Text style={{ color: activeTab === id ? BLUE : colors.muted, fontSize: 20, fontWeight: "900" }}>{icon}</Text>
            <Text style={[styles.navText, activeTab === id && styles.navActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {uploadOpen && renderModalPanel(t.upload, <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>{t.category}</Text>
        <View style={styles.row}>
          {CATEGORIES.filter(x => x.id !== "all").map(item => (
            <TouchableOpacity key={item.id} style={[styles.pill, uploadCategory === item.id && { backgroundColor: BLUE }]} onPress={() => setUploadCategory(item.id)}>
              <Text style={[styles.pillText, uploadCategory === item.id && { color: "#fff" }]}>{item[language] || item.so}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>{t.title}</Text>
        <TextInput style={styles.input} value={uploadTitle} onChangeText={setUploadTitle} placeholder={t.title} placeholderTextColor={colors.muted} />
        <Text style={styles.label}>{t.body}</Text>
        <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]} multiline value={uploadBody} onChangeText={setUploadBody} placeholder={t.body} placeholderTextColor={colors.muted} />
        <Text style={[styles.muted, { marginTop: 9 }]}>{["photo", "video"].includes(uploadCategory) ? "Marka aad daabacdo waxaa lagaa codsan doonaa inaad ka doorato telefoonkaaga." : "Qoraalkan si toos ah ayaa loo daabici doonaa."}</Text>
        <TouchableOpacity style={[styles.button, { marginTop: 16 }]} disabled={busy} onPress={uploadPost}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.publish}</Text>}
        </TouchableOpacity>
      </ScrollView>, () => !busy && setUploadOpen(false))}

      {loginOpen && renderModalPanel(t.login, <View>
        <Text style={styles.label}>{t.email}</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder={t.email} placeholderTextColor={colors.muted} />
        <Text style={styles.label}>{t.password}</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder={t.password} placeholderTextColor={colors.muted} />
        <TouchableOpacity style={[styles.button, { marginTop: 17 }]} disabled={busy} onPress={signInOwner}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t.enter}</Text>}
        </TouchableOpacity>
      </View>, () => !busy && setLoginOpen(false))}

      {selectedPost && renderModalPanel(t.comments, <View style={{ maxHeight: 500 }}>
        <Text style={styles.cardTitle}>{selectedPost.displayTitle}</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder={t.name} placeholderTextColor={colors.muted} />
        <TextInput style={styles.input} value={commentText} onChangeText={setCommentText} placeholder={t.comment} placeholderTextColor={colors.muted} />
        <TouchableOpacity style={[styles.button, { marginTop: 9 }]} onPress={addComment}><Text style={styles.buttonText}>{t.send}</Text></TouchableOpacity>
        <ScrollView style={{ marginTop: 10 }}>
          {comments.length ? comments.map(item => (
            <View key={item.id} style={styles.comment}>
              <Text style={styles.commentName}>{item.display_name || "Marti"}</Text>
              <Text style={styles.commentBody}>{item.body}</Text>
            </View>
          )) : <Text style={styles.empty}>{t.noComments}</Text>}
        </ScrollView>
      </View>, () => setSelectedPost(null))}

      {privateOpen && renderModalPanel(t.private, <View>
        <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]} multiline value={privateText} onChangeText={setPrivateText} placeholder="Xogta gaarka ah..." placeholderTextColor={colors.muted} />
        <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={savePrivate}><Text style={styles.buttonText}>{t.save}</Text></TouchableOpacity>
        <ScrollView style={{ maxHeight: 180, marginTop: 12 }}>
          {privateContent.map(item => <View key={item.id} style={styles.comment}><Text style={styles.commentBody}>{item.content}</Text></View>)}
        </ScrollView>
      </View>, () => setPrivateOpen(false))}
    </SafeAreaView>
  );
                }
