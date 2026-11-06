import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Image, Linking,
  RefreshControl, SafeAreaView, ScrollView, Share,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

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

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("visitor");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [displayName, setDisplayName] = useState("Marti");
  const [likes, setLikes] = useState({});
  const [viewCounts, setViewCounts] = useState({});
  const [privateContent, setPrivateContent] = useState([]);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateText, setPrivateText] = useState("");

  const isManager = role === "owner" || role === "admin";
  const userId = session?.user?.id;

  const ensureAnonymousSession = useCallback(async () => {
    const { data: { session: current } } =
      await supabase.auth.getSession();

    if (current) {
      setSession(current);
      return current;
    }

    const { data, error } =
      await supabase.auth.signInAnonymously();

    if (error) {
      console.warn(error.message);
      return null;
    }

    setSession(data.session);
    return data.session;
  }, []);

  const loadRole = useCallback(async (uid) => {
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

    if (error) {
      setRole("visitor");
      return;
    }

    setRole(data?.role === "admin" ? "admin" : "visitor");
  }, []);

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id,title,media_url,media_type,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    setPosts(data || []);

    const ids = (data || []).map((p) => p.id);

    if (ids.length) {
      const [likeResult, viewResult] = await Promise.all([
        supabase.from("post_likes")
          .select("post_id").in("post_id", ids),
        supabase.from("post_views")
          .select("post_id").in("post_id", ids),
      ]);

      if (!likeResult.error) {
        const counts = {};
        (likeResult.data || []).forEach((r) => {
          counts[r.post_id] = (counts[r.post_id] || 0) + 1;
        });
        setLikes(counts);
      }

      if (!viewResult.error) {
        const counts = {};
        (viewResult.data || []).forEach((r) => {
          counts[r.post_id] = (counts[r.post_id] || 0) + 1;
        });
        setViewCounts(counts);
      }
    }
  }, []);

  const loadPrivate = useCallback(async () => {
    if (role !== "owner") return;

    const { data, error } = await supabase
      .from("owner_private")
      .select("id,content,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Qaybta gaarka ah", error.message);
      return;
    }

    setPrivateContent(data || []);
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
