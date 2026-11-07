Writing
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Image, Linking,
  RefreshControl, SafeAreaView, ScrollView, Share,
  StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// SUPABASE
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
const PURPLE = "#0755D9";

const CATEGORIES = [
  { id: "all", icon: "▦", so: "Dhammaan", en: "All", sw: "Zote", ar: "الكل" },
  { id: "video", icon: "▶", so: "Muuqaallo", en: "Videos", sw: "Video", ar: "فيديوهات" },
  { id: "photo", icon: "▧", so: "Sawirro", en: "Photos", sw: "Picha", ar: "صور" },
  { id: "program", icon: "▣", so: "Barnaamijyo", en: "Programs", sw: "Vipindi", ar: "برامج" },
  { id: "story", icon: "▤", so: "Qisooyin", en: "Stories", sw: "Hadithi", ar: "قصص" },
  { id: "awareness", icon: "✦", so: "Wacyigelin", en: "Awareness", sw: "Uhamasishaji", ar: "توعية" },
  { id: "message", icon: "✉", so: "Fariimo", en: "Messages", sw: "Ujumbe", ar: "رسائل" },
];

const WORDS = {
  so: {
    home: "Home", episodes: "Barnaamijyo", live: "Live",
    account: "Akoon", latest: "Waxyaabihii ugu dambeeyay",
    upload: "Soo geli", watch: "Daawo", browse: "Eeg dhammaan",
    comments: "Faallooyinka", send: "Dir faallo",
    name: "Magacaaga", comment: "Qor faallo...",
    login: "Owner / Admin gelitaan", email: "Email",
    password: "Password", enter: "Soo gal", logout: "Ka bax",
    settings: "Dejinta", language: "Luqadda",
    appearance: "Muuqaalka", light: "Iftiin cad",
    dark: "Iftiin madow", appname: "Magaca app-ka",
    save: "Kaydi", search: "Raadi...",
    empty: "Weli waxba lama soo gelin.",
    private: "Qaybta gaarka ah", title: "Cinwaanka",
    body: "Qoraalkaaga halkan ku qor",
    category: "Qaybta", photo: "Sawir ama muuqaal",
    follow: "Raac Abdiqadir Vision",
    changeLogo: "Beddel logo-ga",
    publish: "Daabac", cancel: "Jooji",
  },
  en: {
    home: "Home", episodes: "Programs", live: "Live",
    account: "Account", latest: "Latest updates",
    upload: "Upload", watch: "Watch", browse: "Browse all",
    comments: "Comments", send: "Send comment",
    name: "Your name", comment: "Write a comment...",
    login: "Owner / Admin login", email: "Email",
    password: "Password", enter: "Sign in", logout: "Sign out",
    settings: "Settings", language: "Language",
    appearance: "Appearance", light: "Light mode",
    dark: "Dark mode", appname: "App name",
    save: "Save", search: "Search...",
    empty: "Nothing has been uploaded yet.",
    private: "Private section", title: "Title",
    body: "Write your message here",
    category: "Category", photo: "Photo or video",
    follow: "Follow Abdiqadir Vision",
    changeLogo: "Change logo",
    publish: "Publish", cancel: "Cancel",
  },
  sw: {
    home: "Nyumbani", episodes: "Vipindi", live: "Moja kwa moja",
    account: "Akaunti", latest: "Vilivyowekwa hivi karibuni",
    upload: "Pakia", watch: "Tazama", browse: "Tazama vyote",
    comments: "Maoni", send: "Tuma maoni",
    name: "Jina lako", comment: "Andika maoni...",
    login: "Ingia Owner / Admin", email: "Barua pepe",
    password: "Nenosiri", enter: "Ingia", logout: "Toka",
    settings: "Mipangilio", language: "Lugha",
    appearance: "Muonekano", light: "Mwanga",
    dark: "Giza", appname: "Jina la app",
    save: "Hifadhi", search: "Tafuta...",
    empty: "Hakuna kilichowekwa bado.",
    private: "Sehemu ya siri", title: "Kichwa",
    body: "Andika ujumbe wako hapa",
    category: "Aina", photo: "Picha au video",
    follow: "Fuata Abdiqadir Vision",
    changeLogo: "Badilisha logo",
    publish: "Chapisha", cancel: "Ghairi",
  },
  ar: {
    home: "الرئيسية", episodes: "البرامج", live: "مباشر",
    account: "الحساب", latest: "أحدث المنشورات",
    upload: "رفع", watch: "شاهد", browse: "عرض الكل",
    comments: "التعليقات", send: "إرسال تعليق",
    name: "اسمك", comment: "اكتب تعليقاً...",
    login: "دخول المالك / المدير", email: "البريد الإلكتروني",
    password: "كلمة المرور", enter: "دخول", logout: "خروج",
    settings: "الإعدادات", language: "اللغة",
    appearance: "المظهر", light: "الوضع الفاتح",
    dark: "الوضع الداكن", appname: "اسم التطبيق",
    save: "حفظ", search: "بحث...",
    empty: "لم تتم إضافة أي منشورات بعد.",
    private: "القسم الخاص", title: "العنوان",
    body: "اكتب رسالتك هنا",
    category: "القسم", photo: "صورة أو فيديو",
    follow: "تابع Abdiqadir Vision",
    changeLogo: "تغيير الشعار",
    publish: "نشر", cancel: "إلغاء",
  },
};

// Category information is stored inside the existing posts.title
// field to avoid requiring a new database column.
function encodeTitle(category, title) {
  return `[[${category}]]${title}`;
}

function decodePost(post) {
  const match = (post.title || "").match(/^\[(.*?)\](.*)$/);
  return {
    ...post,
    category: match ? match[1] : (
      post.media_type === "video" ? "video" :
      post.media_type === "image" ? "photo" : "story"
    ),
    displayTitle: match ? match[2] : (post.title || "Abdiqadir Vision"),
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("visitor");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [activeTab, setActiveTab] = useState("Home");
  const [category, setCategory] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const colors = dark ? {
    bg: "#10131D", card: "#1D2230", text: "#FFFFFF",
    muted: "#A7AEC0", border: "#30394D", input: "#292F40",
    hero: "#102E70",
  } : {
    bg: "#F5F7FC", card: "#FFFFFF", text: "#171D32",
    muted: "#7B8295", border: "#E5E9F2", input: "#F0F2F8",
    hero: "#0645C5",
  };

  const styles = makeStyles(colors);

  const ensureSession = useCallback(async () => {
    const { data: { session: current } } =
      await supabase.auth.getSession();

    if (current) {
      setSession(current);
      return current;
    }

    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.warn(error.message);
      return null;
    }

    setSession(data.session);
    return data.session;
  }, []);

  const loadRole = useCallback(async uid => {
    if (!uid) {
      setRole("visitor");
      return;
    }

    if (uid === OWNER_ID) {
      setRole("owner");
      return;
    }

    const { data, error } = await supabase
      .from("app_roles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();

    setRole(!error && data?.role === "admin" ? "admin" : "visitor");
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const values = await AsyncStorage.multiGet([
        "av_language", "av_dark", "av_app_name",
      ]);

      if (values[0][1]) setLanguage(values[0][1]);
      if (values[1][1]) setDark(values[1][1] === "true");
      if (values[2][1]) {
        setAppName(values[2][1]);
        setNameDraft(values[2][1]);
      }
    } catch (e) {
      console.warn(e);
    }

    const { data } = await supabase
      .from("app_settings")
      .select("logo_url")
      .eq("id", 1)
      .maybeSingle();

    if (data?.logo_url) setAppLogo(data.logo_url);
  }, []);

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id,title,media_url,media_type,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const decoded = (data || []).map(decodePost);
    setPosts(decoded);

    const ids = decoded.map(p => p.id);

    if (!ids.length) {
      setLikes({});
      setMyLikes({});
      setViewCounts({});
      return;
    }

    const [lr, vr, mr] = await Promise.all([
      supabase.from("post_likes").select("post_id").in("post_id", ids),
      supabase.from("post_views").select("post_id").in("post_id", ids),
      userId
        ? supabase.from("post_likes").select("post_id")
            .eq("user_id", userId).in("post_id", ids)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (!lr.error) {
      const counts = {};
      (lr.data || []).forEach(x => {
        counts[x.post_id] = (counts[x.post_id] || 0) + 1;
      });
      setLikes(counts);
    }

    if (!vr.error) {
      const counts = {};
      (vr.data || []).forEach(x => {
        counts[x.post_id] = (counts[x.post_id] || 0) + 1;
      });
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

    const { data, error } = await supabase
      .from("owner_private")
      .select("id,content,created_at")
      .order("created_at", { ascending: false });

    if (!error) setPrivateContent(data || []);
  }, [role]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await loadPosts();
    } catch (e) {
      Alert.alert("Khalad", e.message);
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      await loadSettings();

      const current = await ensureSession();
      if (current) await loadRole(current.user.id);

      if (mounted) await refresh();
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
        if (next?.user?.id) loadRole(next.user.id);
        else setRole("visitor");
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [ensureSession, loadRole, loadSettings, refresh]);

  useEffect(() => {
    loadPrivate();
  }, [loadPrivate]);

  async function saveSetting(key, value) {
    await AsyncStorage.setItem(key, String(value));
  }

  async function changeLanguage(value) {
    setLanguage(value);
    await saveSetting("av_language", value);
  }

  async function changeTheme(value) {
    setDark(value);
    await saveSetting("av_dark", value);
  }

  async function saveAppName() {
    const value = nameDraft.trim();
    if (!value) return;

    setAppName(value);
    await saveSetting("av_app_name", value);
    Alert.alert("Waa guul", "Magaca waa la kaydiyey.");
  }

  async function changeLogo() {
    if (!isManager) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Oggolaansho", "Oggolow sawirrada telefoonka.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets?.length) return;

      setBusy(true);
      const asset = result.assets[0];
      const path = `logo/av-${Date.now()}.jpg`;
      const blob = await (await fetch(asset.uri)).blob();

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: asset.mimeType || "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: saveError } = await supabase
        .from("app_settings")
        .upsert({ id: 1, logo_url: data.publicUrl }, { onConflict: "id" });

      if (saveError) throw saveError;

      setAppLogo(data.publicUrl);
      Alert.alert("Waa guul", "Logo-ga waa la beddelay.");
    } catch (e) {
      Alert.alert("Khalad", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadPost() {
    if (!isManager) return;

    if (!uploadTitle.trim() && !uploadBody.trim()) {
      Alert.alert("Xog", "Geli cinwaan ama qoraal.");
      return;
    }

    try {
      setBusy(true);
      let mediaUrl = "";
      let mediaType = "text";

      if (["photo", "video"].includes(uploadCategory)) {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert("Oggolaansho", "Oggolow sawirrada telefoonka.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: uploadCategory === "video"
            ? ["videos"] : ["images"],
          quality: 0.85,
          allowsEditing: false,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        const isVideo = asset.type === "video";
        const ext = asset.fileName?.split(".").pop() ||
          (isVideo ? "mp4" : "jpg");

        const path = `posts/${Date.now()}-${Math.random()
          .toString(36).slice(2, 8)}.${ext}`;

        const blob = await (await fetch(asset.uri)).blob();
        const contentType = asset.mimeType ||
          (isVideo ? "video/mp4" : "image/jpeg");

        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType, upsert: false });

        if (error) throw error;

        mediaUrl = supabase.storage.from(BUCKET).getPublicUrl(path)
          .data.publicUrl;

        mediaType = isVideo ? "video" : "image";
      }

      const fullText = [
        uploadTitle.trim() || uploadBody.trim().slice(0, 70),
        uploadBody.trim(),
      ].filter(Boolean).join(" — ");

      const { error } = await supabase.from("posts").insert({
        title: encodeTitle(uploadCategory, fullText),
        media_url: mediaUrl || null,
        media_type: mediaType,
      });

      if (error) throw error;

      setUploadTitle("");
      setUploadBody("");
      setUploadOpen(false);
      Alert.alert("Waa guul", "Waa la soo geliyey.");
      await refresh();
    } catch (e) {
      Alert.alert("Khalad", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function openPost(post) {
    setSelectedPost(post);
    setComments([]);

    const { data, error } = await supabase.from("comments")
      .select("id,post_id,display_name,body,created_at,user_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (!error) setComments(data || []);

    if (userId) {
      const { error: viewError } = await supabase
        .from("post_views").insert({ post_id: post.id });

      if (!viewError) {
        setViewCounts(old => ({
          ...old, [post.id]: (old[post.id] || 0) + 1,
        }));
      }
    }
  }

  async function addComment() {
    if (!userId || !commentText.trim() || !selectedPost) return;

    const { error } = await supabase.from("comments").insert({
      post_id: selectedPost.id,
      display_name: displayName.trim() || "Marti",
      body: commentText.trim(),
      user_id: userId,
    });

    if (error) {
      Alert.alert("Faallo", error.message);
      return;
    }

    setCommentText("");

    const { data } = await supabase.from("comments")
      .select("id,post_id,display_name,body,created_at,user_id")
      .eq("post_id", selectedPost.id)
      .order("created_at", { ascending: true });

    setComments(data || []);
  }

  async function toggleLike(post) {
    if (!userId) return;

    const { data: existing, error } = await supabase
      .from("post_likes").select("post_id")
      .eq("post_id", post.id).eq("user_id", userId).maybeSingle();

    if (error) return Alert.alert("Like", error.message);

    if (existing) {
      const result = await supabase.from("post_likes").delete()
        .eq("post_id", post.id).eq("user_id", userId);
      if (result.error) return Alert.alert("Like", result.error.message);
    } else {
      const result = await supabase.from("post_likes").insert({
        post_id: post.id, user_id: userId,
      });
      if (result.error) return Alert.alert("Like", result.error.message);
    }

    await refresh();
  }

  async function followOwner() {
    if (!userId) return;

    const { error } = await supabase.from("follows").upsert({
      follower_id: userId,
      following_id: OWNER_ID,
    }, { onConflict: "follower_id,following_id" });

    if (error) Alert.alert("Follow", error.message);
    else Alert.alert("Waa guul", "Waad raacday Abdiqadir Vision.");
  }

  async function signInOwner() {
    if (!email.trim() || !password) {
      Alert.alert("Gelitaan", "Geli email-ka iyo password-ka.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });

      if (error) throw error;

      setSession(data.session);
      await loadRole(data.user.id);
      setLoginOpen(false);
      setPassword("");
      Alert.alert("Waa guul", "Waad soo gashay.");
    } catch (e) {
      Alert.alert("Gelitaan", e.message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) return Alert.alert("Khalad", error.message);

    setSession(null);
    setRole("visitor");
    await ensureSession();
  }

  async function savePrivate() {
    if (role !== "owner" || !privateText.trim()) return;

    const { error } = await supabase.from("owner_private").insert({
      content: privateText.trim(),
    });

    if (error) return Alert.alert("Private", error.message);

    setPrivateText("");
    await loadPrivate();
    Alert.alert("Waa guul", "Xogta waa la kaydiyey.");
  }

  async function sharePost(post) {
    try {
      await Share.share({
        message: `${post.displayTitle}\n${post.media_url || ""}`,
      });
    } catch {
      Alert.alert("Wadaag", "Lama wadaagi karin.");
    }
   }
