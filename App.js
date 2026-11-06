
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

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session: current } } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (current) {
        setSession(current);
        await loadRole(current.user.id);
      } else {
        const anonymous = await ensureAnonymousSession();

        if (anonymous) {
          await loadRole(anonymous.user.id);
        }
      }

      await refresh();
    })();

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);

        if (nextSession?.user?.id) {
          loadRole(nextSession.user.id);
        } else {
          setRole("visitor");
        }
      });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [ensureAnonymousSession, loadRole, refresh]);

  useEffect(() => {
    loadPrivate();
  }, [loadPrivate]);

  async function signInOwner() {
    if (!email.trim() || !password) {
      Alert.alert("Gelitaan", "Geli email-ka iyo password-kaaga.");
      return;
    }

    setBusy(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setBusy(false);

    if (error) {
      Alert.alert("Gelitaanku wuu fashilmay", error.message);
      return;
    }

    setSession(data.session);
    await loadRole(data.user.id);
    setLoginOpen(false);
    setPassword("");
  }

  async function signOut() {
    await supabase.auth.signOut();

    setSession(null);
    setRole("visitor");

    await ensureAnonymousSession();
  }

  async function uploadPost() {
    if (!isManager) {
      Alert.alert(
        "Oggolaansho ma lihid",
        "Kaliya Owner ama Admin ayaa wax soo gelin kara."
      );
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Oggolaansho",
        "Fadlan oggolow gelitaanka sawirrada iyo muuqaalada."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    setBusy(true);

    try {
      const ext =
        asset.fileName?.split(".").pop() ||
        (asset.type === "video" ? "mp4" : "jpg");

      const path =
        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const blob = await (await fetch(asset.uri)).blob();

      const contentType =
        asset.mimeType ||
        (asset.type === "video" ? "video/mp4" : "image/jpeg");

      const { error: uploadError } =
        await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } =
        supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: insertError } =
        await supabase.from("posts").insert({
          title: asset.fileName || "Abdiqadir Vision",
          media_url: urlData.publicUrl,
          media_type: asset.type === "video" ? "video" : "image",
        });

      if (insertError) throw insertError;

      Alert.alert("Waa guul", "Faylka waa la soo geliyey.");

      await refresh();
    } catch (e) {
      Alert.alert(
        "Soo gelintu way fashilantay",
        e.message || "Mar kale isku day."
      );
    } finally {
      setBusy(false);
    }
  }

  async function openPost(post) {
    setSelectedPost(post);

    const { data, error } = await supabase.from("comments")
      .select("id,post_id,display_name,body,created_at,user_id")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });

    if (!error) setComments(data || []);

    if (userId) {
      const { error: viewError } = await supabase
        .from("post_views")
        .insert({ post_id: post.id });

      if (!viewError && role === "owner") {
        setViewCounts((old) => ({
          ...old,
          [post.id]: (old[post.id] || 0) + 1,
        }));
      }
    }
  }

  async function addComment() {
    if (!userId) {
      Alert.alert("Sug", "Fadlan sug inta booqde ahaan laguu gelinayo.");
      return;
    }

    if (!commentText.trim() || !selectedPost) return;

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
    if (!userId) {
      return Alert.alert("Sug", "Booqde ahaan ayaa laguu gelinayaa.");
    }

    const { data: existing } = await supabase.from("post_likes")
      .select("post_id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("post_likes").delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);

      if (error) return Alert.alert("Like", error.message);
    } else {
      const { error } = await supabase.from("post_likes").insert({
        post_id: post.id,
        user_id: userId,
      });

      if (error) return Alert.alert("Like", error.message);
    }

    await refresh();
  }

  async function followOwner() {
    if (!userId) {
      return Alert.alert("Sug", "Booqde ahaan ayaa laguu gelinayaa.");
    }

    const { error } = await supabase.from("follows").upsert({
      follower_id: userId,
      following_id: OWNER_ID,
    }, { onConflict: "follower_id,following_id" });

    if (error) {
      Alert.alert("Follow", error.message);
    } else {
      Alert.alert("Waa guul", "Waad raacday Abdiqadir Vision.");
    }
  }

  async function savePrivate() {
    if (role !== "owner" || !privateText.trim()) return;

    const { error } = await supabase.from("owner_private").insert({
      content: privateText.trim(),
    });

    if (error) {
      Alert.alert("Private", error.message);
      return;
    }

    setPrivateText("");
    await loadPrivate();
  }

  async function sharePost(post) {
    try {
      await Share.share({ message: post.media_url });
    } catch {
      Alert.alert("Wadaag", "Lama wadaagi karin.");
    }
  }

  const header = useMemo(() => (
    <View>
      <View style={styles.brand}>
        <Text style={styles.logo}>AV</Text>
        <Text style={styles.title}>Abdiqadir Vision</Text>
        <Text style={styles.subtitle}>Your memories, safely stored.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.goldButton} onPress={followOwner}>
          <Text style={styles.goldText}>＋ Follow</Text>
        </TouchableOpacity>

        {isManager && (
          <TouchableOpacity style={styles.goldButton} onPress={uploadPost} disabled={busy}>
            <Text style={styles.goldText}>＋ Soo geli</Text>
          </TouchableOpacity>
        )}

        {role === "owner" && (
          <TouchableOpacity style={styles.darkButton} onPress={() => setPrivateOpen(!privateOpen)}>
            <Text style={styles.whiteText}>Qaybta gaarka ah</Text>
          </TouchableOpacity>
        )}

        {role === "visitor" && (
          <TouchableOpacity style={styles.darkButton} onPress={() => setLoginOpen(!loginOpen)}>
            <Text style={styles.whiteText}>Owner/Admin gelitaan</Text>
          </TouchableOpacity>
        )}

        {isManager && (
          <TouchableOpacity style={styles.darkButton} onPress={signOut}>
            <Text style={styles.whiteText}>Ka bax</Text>
          </TouchableOpacity>
        )}
      </View>

      {loginOpen && (
        <View style={styles.panel}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
          <TouchableOpacity style={styles.goldButton} onPress={signInOwner} disabled={busy}>
            <Text style={styles.goldText}>{busy ? "Sug..." : "Soo gal"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {privateOpen && role === "owner" && (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Xogta gaarka ah</Text>
          <TextInput style={[styles.input, { minHeight: 70 }]} multiline placeholder="Ku qor xogtaada gaarka ah..." placeholderTextColor="#888" value={privateText} onChangeText={setPrivateText} />
          <TouchableOpacity style={styles.goldButton} onPress={savePrivate}>
            <Text style={styles.goldText}>Kaydi xogta</Text>
          </TouchableOpacity>
          {privateContent.map((item) => (
            <Text key={item.id} style={styles.privateItem}>{item.content}</Text>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Qoraallada iyo xusuusaha</Text>
    </View>
  ), [followOwner, isManager, busy, role, loginOpen, email, password, privateOpen, privateText, privateContent]);

  return (
    <SafeAreaView style={styles.container}>
      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator color="#D6AD48" />
        </View>
      )}

      {selectedPost ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <TouchableOpacity onPress={() => setSelectedPost(null)}>
            <Text style={styles.back}>‹ Ku noqo</Text>
          </TouchableOpacity>

          <Text style={styles.postTitle}>{selectedPost.title}</Text>

          {selectedPost.media_type === "video" ? (
            <TouchableOpacity style={styles.videoBox} onPress={() => Linking.openURL(selectedPost.media_url)}>
              <Text style={styles.videoText}>▶ Fur muuqaalka</Text>
            </TouchableOpacity>
          ) : (
            <Image source={{ uri: selectedPost.media_url }} style={styles.detailImage} resizeMode="contain" />
          )}

          <Text style={styles.sectionTitle}>Faallooyinka</Text>

          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentName}>{c.display_name}</Text>
              <Text style={styles.whiteText}>{c.body}</Text>
            </View>
          ))}

          <TextInput style={styles.input} placeholder="Magacaaga" placeholderTextColor="#888" value={displayName} onChangeText={setDisplayName} />
          <TextInput style={styles.input} placeholder="Qor faallo..." placeholderTextColor="#888" value={commentText} onChangeText={setCommentText} />

          <TouchableOpacity style={styles.goldButton} onPress={addComment}>
            <Text style={styles.goldText}>Dir faallo</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#D6AD48" />}
          ListEmptyComponent={loading ? <ActivityIndicator color="#D6AD48" /> : <Text style={styles.empty}>Weli waxba lama soo gelin.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => openPost(item)}>
                {item.media_type === "video" ? (
                  <View style={styles.videoBox}>
                    <Text style={styles.videoText}>▶ Muuqaal</Text>
                  </View>
                ) : (
                  <Image source={{ uri: item.media_url }} style={styles.thumb} resizeMode="cover" />
                )}
                <Text style={styles.fileTitle} numberOfLines={2}>{item.title || "Abdiqadir Vision"}</Text>
              </TouchableOpacity>

              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => toggleLike(item)}>
                  <Text style={styles.actionText}>♡ {likes[item.id] || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => sharePost(item)}>
                  <Text style={styles.actionText}>Wadaag</Text>
                </TouchableOpacity>
              </View>

              {role === "owner" && (
                <Text style={styles.views}>Daawasho: {viewCounts[item.id] || 0}</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080B12",
  },
  list: {
    padding: 12,
    paddingBottom: 40,
  },
  brand: {
    alignItems: "center",
    paddingVertical: 28,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
    backgroundColor: "#D6AD48",
    color: "#080B12",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    color: "#A8A8A8",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 9,
    marginBottom: 20,
  },
  goldButton: {
    backgroundColor: "#D6AD48",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  goldText: {
    color: "#080B12",
    fontWeight: "800",
  },
  darkButton: {
    backgroundColor: "#202633",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginVertical: 5,
  },
  whiteText: {
    color: "#FFFFFF",
  },
  panel: {
    backgroundColor: "#151B27",
    padding: 15,
    borderRadius: 14,
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#202633",
    color: "#FFFFFF",
    padding: 13,
    borderRadius: 9,
    marginVertical: 6,
  },
  sectionTitle: {
    color: "#D6AD48",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 12,
  },
  privateItem: {
    color: "#FFFFFF",
    backgroundColor: "#202633",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "#151B27",
    margin: 6,
    padding: 9,
    borderRadius: 13,
    maxWidth: "48%",
  },
  thumb: {
    width: "100%",
    height: 145,
    borderRadius: 9,
    backgroundColor: "#202633",
  },
  fileTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginTop: 9,
    minHeight: 35,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionText: {
    color: "#D6AD48",
    fontWeight: "700",
  },
  views: {
    color: "#999999",
    fontSize: 11,
    marginTop: 8,
  },
  videoBox: {
    height: 145,
    backgroundColor: "#202633",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
  },
  videoText: {
    color: "#D6AD48",
    fontWeight: "800",
    fontSize: 17,
  },
  empty: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 35,
  },
  busy: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  back: {
    color: "#D6AD48",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 15,
  },
  postTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 15,
  },
  detailImage: {
    width: "100%",
    height: 350,
    backgroundColor: "#151B27",
    borderRadius: 12,
  },
  comment: {
    backgroundColor: "#151B27",
    padding: 12,
    borderRadius: 9,
    marginVertical: 5,
  },
  commentName: {
    color: "#D6AD48",
    fontWeight: "800",
    marginBottom: 5,
  },
});
