
import React, { useCallback, useEffect, useState } from "react";
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

const GOLD = "#D6AD48";
const BG = "#F8F8FC";
const PURPLE = "#6250E8";
const DARK = "#29283A";

const countries = ["SOMALIA", "KENYA", "DJIBOUTI", "ETHIOPIA", "ERITREA"];

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("visitor");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [country, setCountry] = useState("SOMALIA");

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

  const [privateContent, setPrivateContent] = useState([]);
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateText, setPrivateText] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");

  const [appLogo, setAppLogo] = useState(null);

  const userId = session?.user?.id;
  const isManager = role === "owner" || role === "admin";

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

    setRole(!error && data?.role === "admin" ? "admin" : "visitor");
  }, []);

  const loadLogo = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("logo_url")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data?.logo_url) {
      setAppLogo(data.logo_url);
    }
  }, []);

  const changeLogo = async () => {
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
      const path = `logo/abdiqadir-vision-${Date.now()}.jpg`;
      const blob = await (await fetch(asset.uri)).blob();

      const { error: uploadError } =
        await supabase.storage.from(BUCKET).upload(path, blob, {
          contentType: asset.mimeType || "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } =
        supabase.storage.from(BUCKET).getPublicUrl(path);

      const { error: saveError } = await supabase
        .from("app_settings")
        .upsert({
          id: 1,
          logo_url: urlData.publicUrl,
        }, { onConflict: "id" });

      if (saveError) throw saveError;

      setAppLogo(urlData.publicUrl);
      Alert.alert("Waa guul", "Sawirka app-ka waa la beddelay.");
    } catch (e) {
      Alert.alert("Khalad", e.message);
    } finally {
      setBusy(false);
    }
  };

  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id,title,media_url,media_type,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    setPosts(data || []);

    const ids = (data || []).map(p => p.id);

    if (!ids.length) {
      setLikes({});
      setMyLikes({});
      setViewCounts({});
      return;
    }

    const [likeResult, viewResult, mineResult] = await Promise.all([
      supabase.from("post_likes")
        .select("post_id").in("post_id", ids),
      supabase.from("post_views")
        .select("post_id").in("post_id", ids),
      userId
        ? supabase.from("post_likes")
            .select("post_id")
            .eq("user_id", userId)
            .in("post_id", ids)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (!likeResult.error) {
      const counts = {};
      (likeResult.data || []).forEach(r => {
        counts[r.post_id] = (counts[r.post_id] || 0) + 1;
      });
      setLikes(counts);
    }

    if (!viewResult.error) {
      const counts = {};
      (viewResult.data || []).forEach(r => {
        counts[r.post_id] = (counts[r.post_id] || 0) + 1;
      });
      setViewCounts(counts);
    }

    if (!mineResult.error) {
      const mine = {};
      (mineResult.data || []).forEach(r => {
        mine[r.post_id] = true;
      });
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
      const { data: { session: current } } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (current) {
        setSession(current);
        await loadRole(current.user.id);
      } else {
        const anonymous = await ensureAnonymousSession();
        if (anonymous) await loadRole(anonymous.user.id);
      }

      if (mounted) {
        await loadLogo();
        await refresh();
      }
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
  }, [ensureAnonymousSession, loadRole, refresh, loadLogo]);

  useEffect(() => {
    loadPrivate();
  }, [loadPrivate]);

  async function signInOwner() {
    if (!email.trim() || !password) {
      Alert.alert("Gelitaan", "Geli email-ka iyo password-ka.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
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

    if (error) {
      Alert.alert("Khalad", error.message);
      return;
    }

    setSession(null);
    setRole("visitor");
    await ensureAnonymousSession();
  }

  async function uploadPost() {
    if (!isManager) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Oggolaansho", "Oggolow sawirrada telefoonka.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.85,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setBusy(true);

      const ext = asset.fileName?.split(".").pop() ||
        (asset.type === "video" ? "mp4" : "jpg");

      const path = `posts/${Date.now()}-${Math.random()
        .toString(36).slice(2, 8)}.${ext}`;

      const blob = await (await fetch(asset.uri)).blob();

      const contentType = asset.mimeType ||
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
          title: uploadTitle.trim() ||
            asset.fileName || "Abdiqadir Vision",
          media_url: urlData.publicUrl,
          media_type: asset.type === "video" ? "video" : "image",
        });

      if (insertError) throw insertError;

      setUploadTitle("");
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
          ...old,
          [post.id]: (old[post.id] || 0) + 1,
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

    const { data: existing, error: findError } =
      await supabase.from("post_likes")
        .select("post_id")
        .eq("post_id", post.id)
        .eq("user_id", userId)
        .maybeSingle();

    if (findError) {
      Alert.alert("Like", findError.message);
      return;
    }

    if (existing) {
      const { error } = await supabase.from("post_likes")
        .delete()
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
    if (!userId) return;

    const { error } = await supabase.from("follows").upsert({
      follower_id: userId,
      following_id: OWNER_ID,
    }, { onConflict: "follower_id,following_id" });

    if (error) Alert.alert("Follow", error.message);
    else Alert.alert("Waa guul", "Waad raacday Abdiqadir Vision.");
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
    Alert.alert("Waa guul", "Xogta waa la kaydiyey.");
  }

  async function sharePost(post) {
    try {
      await Share.share({ message: post.media_url });
    } catch {
      Alert.alert("Wadaag", "Lama wadaagi karin.");
    }
  }

  function Logo({ size = 43 }) {
    return (
      <View style={[
        styles.logoBox,
        { width: size, height: size, borderRadius: size * 0.3 }
      ]}>
        {appLogo ? (
          <Image
            source={{ uri: appLogo }}
            style={styles.logoImage}
          />
        ) : (
          <Text style={[styles.logoText, { fontSize: size * 0.42 }]}>
            AV
          </Text>
        )}
      </View>
    );
  }

  function PostCard({ item }) {
    return (
      <View style={styles.postCard}>
        <TouchableOpacity onPress={() => openPost(item)}>
          {item.media_type === "video" ? (
            <View style={styles.videoBox}>
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.videoText}>Daawo muuqaalka</Text>
            </View>
          ) : (
            <Image
              source={{ uri: item.media_url }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title || "Abdiqadir Vision"}
          </Text>
        </TouchableOpacity>

        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => toggleLike(item)}>
            <Text style={[
              styles.actionText,
              myLikes[item.id] && styles.likedText,
            ]}>
              {myLikes[item.id] ? "♥" : "♡"} {likes[item.id] || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openPost(item)}>
            <Text style={styles.actionText}>Faallo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => sharePost(item)}>
            <Text style={styles.actionText}>Wadaag</Text>
          </TouchableOpacity>
        </View>

        {role === "owner" && (
          <Text style={styles.views}>
            Daawasho: {viewCounts[item.id] || 0}
          </Text>
        )}
      </View>
    );
  }

  function HomeHeader() {
    return (
      <View>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Logo size={42} />
            <Text style={styles.brandName}>Abdiqadir Vision</Text>
          </View>

          <TouchableOpacity onPress={() => setActiveTab("Account")}>
            <Text style={styles.topIcon}>♙</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
        >
          {countries.map(item => (
            <TouchableOpacity
              key={item}
              onPress={() => setCountry(item)}
              style={[
                styles.countryButton,
                country === item && styles.countryActive,
              ]}
            >
              <Text style={[
                styles.countryText,
                country === item && styles.countryTextActive,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.hero}>
          <Text style={styles.heroTag}>ABDIQADIR VISION</Text>
          <Text style={styles.heroTitle}>
            Stories that connect East Africa.
          </Text>
          <Text style={styles.heroDescription}>
            Warar, sheekooyin, muuqaallo iyo barnaamijyo.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => setActiveTab("Episodes")}
          >
            <Text style={styles.heroButtonText}>
              ▶ Daawo barnaamijyada
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => setActiveTab("Episodes")}
          >
            <Text style={styles.catalogText}>
              Eeg muuqaallada →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Latest episodes</Text>
          {isManager && (
            <TouchableOpacity onPress={uploadPost}>
              <Text style={styles.uploadText}>＋ Soo geli</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  function AccountScreen() {
    return (
      <ScrollView contentContainerStyle={styles.accountScreen}>
        <TouchableOpacity
          onPress={isManager ? changeLogo : undefined}
          activeOpacity={isManager ? 0.7 : 1}
          style={styles.logoChangeArea}
        >
          <Logo size={108} />
          {isManager && (
            <Text style={styles.changeLogoText}>
              📷 Beddel sawirka app-ka
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.accountTitle}>Abdiqadir Vision</Text>
        <Text style={styles.muted}>
          Your memories, safely stored.
        </Text>

        <View style={styles.accountPanel}>
          <Text style={styles.sectionTitle}>Akoonkaaga</Text>

          <Text style={styles.whiteText}>
            Xaaladda: {isManager ? role : "Visitor"}
          </Text>

          {isManager ? (
            <>
              <TouchableOpacity
                style={styles.goldButton}
                onPress={changeLogo}
                disabled={busy}
              >
                <Text style={styles.goldButtonText}>
                  📷 Beddel sawirka app-ka
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Cinwaanka wararka..."
                placeholderTextColor="#888"
                value={uploadTitle}
                onChangeText={setUploadTitle}
              />

              <TouchableOpacity
                style={styles.goldButton}
                onPress={uploadPost}
                disabled={busy}
              >
                <Text style={styles.goldButtonText}>
                  ＋ Soo geli warar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.darkButton}
                onPress={() => setPrivateOpen(!privateOpen)}
              >
                <Text style={styles.whiteText}>
                  Qaybta gaarka ah
                </Text>
              </TouchableOpacity>

              {privateOpen && role === "owner" && (
                <>
                  <TextInput
                    style={styles.input}
                    multiline
                    placeholder="Xogtaada gaarka ah..."
                    placeholderTextColor="#888"
                    value={privateText}
                    onChangeText={setPrivateText}
                  />

                  <TouchableOpacity
                    style={styles.goldButton}
                    onPress={savePrivate}
                  >
                    <Text style={styles.goldButtonText}>
                      Kaydi xogta
                    </Text>
                  </TouchableOpacity>

                  {privateContent.map(item => (
                    <Text key={item.id} style={styles.privateItem}>
                      {item.content}
                    </Text>
                  ))}
                </>
              )}

              <TouchableOpacity
                style={styles.darkButton}
                onPress={signOut}
              >
                <Text style={styles.whiteText}>Ka bax</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.goldButton}
                onPress={() => setLoginOpen(!loginOpen)}
              >
                <Text style={styles.goldButtonText}>
                  Owner / Admin gelitaan
                </Text>
              </TouchableOpacity>

              {loginOpen && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    style={styles.goldButton}
                    onPress={signInOwner}
                    disabled={busy}
                  >
                    <Text style={styles.goldButtonText}>
                      {busy ? "Sug..." : "Soo gal"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.followButton}
            onPress={followOwner}
          >
            <Text style={styles.followText}>
              ＋ Raac Abdiqadir Vision
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const displayedPosts = activeTab === "Episodes"
    ? posts.filter(p => p.media_type === "video")
    : posts;

  if (selectedPost) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.detailScreen}>
          <TouchableOpacity onPress={() => setSelectedPost(null)}>
            <Text style={styles.back}>‹ Ku noqo</Text>
          </TouchableOpacity>

          <Text style={styles.detailTitle}>
            {selectedPost.title}
          </Text>

          {selectedPost.media_type === "video" ? (
            <TouchableOpacity
              style={styles.videoDetail}
              onPress={() => Linking.openURL(selectedPost.media_url)}
            >
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.whiteText}>Fur muuqaalka</Text>
            </TouchableOpacity>
          ) : (
            <Image
              source={{ uri: selectedPost.media_url }}
              style={styles.detailImage}
              resizeMode="contain"
            />
          )}

          <Text style={styles.sectionTitle}>Faallooyinka</Text>

          {comments.map(c => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentName}>
                {c.display_name}
              </Text>
              <Text style={styles.whiteText}>{c.body}</Text>
            </View>
          ))}

          <TextInput
            style={styles.input}
            placeholder="Magacaaga"
            placeholderTextColor="#888"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TextInput
            style={styles.input}
            placeholder="Qor faallo..."
            placeholderTextColor="#888"
            value={commentText}
            onChangeText={setCommentText}
          />

          <TouchableOpacity
            style={styles.goldButton}
            onPress={addComment}
          >
            <Text style={styles.goldButtonText}>Dir faallo</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (activeTab === "Live") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Logo size={40} />
            <Text style={styles.brandName}>Abdiqadir Vision</Text>
          </View>
        </View>

        <View style={styles.liveScreen}>
          <Text style={styles.liveIcon}>◉</Text>
          <Text style={styles.liveTitle}>Live Broadcast</Text>
          <Text style={styles.muted}>
            Baahinta tooska ah ee Abdiqadir Vision.
          </Text>
          <View style={styles.livePanel}>
            <Text style={styles.whiteText}>
              Baahinta Live-ka weli lama xirin.
            </Text>
          </View>
        </View>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {busy && (
        <View style={styles.busy}>
          <ActivityIndicator color={PURPLE} size="large" />
        </View>
      )}

      {activeTab === "Account" ? (
        <AccountScreen />
      ) : (
        <FlatList
          data={displayedPosts}
          keyExtractor={item => String(item.id)}
          ListHeaderComponent={
            activeTab === "Home"
              ? <HomeHeader />
              : <Text style={styles.sectionTitle}>Episodes</Text>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={PURPLE}
            />
          }
          ListEmptyComponent={
            loading
              ? <ActivityIndicator color={PURPLE} />
              : <Text style={styles.empty}>
                  Weli waxba lama soo gelin.
                </Text>
          }
          renderItem={({ item }) => <PostCard item={item} />}
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </SafeAreaView>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  return (
    <View style={styles.bottomNav}>
      {[
        ["Home", "⌂"],
        ["Episodes", "▷"],
        ["Live", "◉"],
        ["Account", "♙"],
      ].map(([name, symbol]) => (
        <TouchableOpacity
          key={name}
          style={styles.navItem}
          onPress={() => setActiveTab(name)}
        >
          <Text style={[
            styles.navIcon,
            activeTab === name && styles.navActive,
          ]}>
            {symbol}
          </Text>
          <Text style={[
            styles.navLabel,
            activeTab === name && styles.navActive,
          ]}>
            {name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  topBar: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logoText: {
    color: "#111111",
    fontWeight: "900",
  },
  brandName: {
    color: "#171725",
    fontSize: 19,
    fontWeight: "900",
  },
  topIcon: {
    fontSize: 27,
    color: PURPLE,
  },
  countryScroll: {
    backgroundColor: "#FFFFFF",
    maxHeight: 55,
    paddingHorizontal: 8,
  },
  countryButton: {
    paddingHorizontal: 13,
    paddingVertical: 14,
    marginHorizontal: 3,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  countryActive: {
    borderBottomColor: PURPLE,
  },
  countryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#777787",
  },
  countryTextActive: {
    color: "#29283A",
  },
  hero: {
    backgroundColor: "#49347E",
    borderRadius: 20,
    padding: 21,
    marginTop: 14,
    marginBottom: 17,
    minHeight: 255,
    justifyContent: "center",
  },
  heroTag: {
    color: "#E6D7FF",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 34,
  },
  heroDescription: {
    color: "#E6DFF3",
    fontSize: 14,
    marginTop: 12,
    lineHeight: 22,
  },
  heroButton: {
    backgroundColor: PURPLE,
    borderRadius: 30,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  catalogButton: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 30,
    padding: 12,
    alignItems: "center",
    marginTop: 9,
  },
  catalogText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#6250B0",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 17,
    marginBottom: 13,
  },
  uploadText: {
    color: PURPLE,
    fontWeight: "800",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 10,
    marginBottom: 15,
    elevation: 2,
  },
  postImage: {
    width: "100%",
    height: 210,
    borderRadius: 12,
    backgroundColor: "#E5E5EF",
  },
  postTitle: {
    color: "#20202D",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  videoBox: {
    height: 205,
    backgroundColor: DARK,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    fontSize: 39,
    color: "#FFFFFF",
  },
  videoText: {
    color: "#FFFFFF",
    fontWeight: "800",
    marginTop: 8,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
    paddingHorizontal: 5,
  },
  actionText: {
    color: PURPLE,
    fontWeight: "800",
  },
  likedText: {
    color: "#D52A4B",
  },
  views: {
    color: "#888888",
    marginTop: 8,
    fontSize: 11,
  },
  bottomNav: {
    height: 67,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEF3",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    color: "#8A8999",
  },
  navLabel: {
    color: "#777787",
    fontSize: 11,
    marginTop: 2,
  },
  navActive: {
    color: PURPLE,
    fontWeight: "900",
  },
  empty: {
    textAlign: "center",
    color: "#888888",
    marginTop: 35,
  },
  busy: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
  },
  accountScreen: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 35,
  },
  logoChangeArea: {
    alignItems: "center",
    marginTop: 22,
  },
  changeLogoText: {
    color: PURPLE,
    fontWeight: "800",
    marginTop: 10,
  },
  accountTitle: {
    color: "#222233",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 18,
  },
  muted: {
    color: "#9999A6",
    marginTop: 9,
    textAlign: "center",
  },
  accountPanel: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginTop: 30,
  },
  goldButton: {
    backgroundColor: GOLD,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 11,
  },
  goldButtonText: {
    color: "#111111",
    fontWeight: "900",
  },
  darkButton: {
    backgroundColor: DARK,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 11,
  },
  whiteText: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#F0F0F6",
    color: "#222222",
    padding: 13,
    borderRadius: 10,
    marginTop: 10,
  },
  privateItem: {
    color: "#333333",
    backgroundColor: "#F0F0F6",
    padding: 12,
    marginTop: 8,
    borderRadius: 9,
  },
  followButton: {
    borderWidth: 1,
    borderColor: GOLD,
    padding: 13,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 15,
  },
  followText: {
    color: "#6250B0",
    fontWeight: "800",
  },
  liveScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  liveIcon: {
    fontSize: 65,
    color: "#D52A4B",
  },
  liveTitle: {
    color: "#222233",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 15,
  },
  livePanel: {
    backgroundColor: DARK,
    padding: 25,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },
  detailScreen: {
    padding: 16,
    paddingBottom: 35,
  },
  back: {
    color: PURPLE,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 18,
  },
  detailTitle: {
    color: "#222233",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 15,
  },
  detailImage: {
    width: "100%",
    height: 350,
    backgroundColor: "#EEEEF3",
    borderRadius: 13,
  },
  videoDetail: {
    height: 230,
    backgroundColor: DARK,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  comment: {
    backgroundColor: DARK,
    padding: 13,
    borderRadius: 10,
    marginVertical: 5,
  },
  commentName: {
    color: GOLD,
    fontWeight: "900",
    marginBottom: 5,
  },
});
