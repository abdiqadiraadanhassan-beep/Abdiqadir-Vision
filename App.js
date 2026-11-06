import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const SUPABASE_URL = "https://zzrvmgserllvieuswncp.supabase.co";
const SUPABASE_KEY = "sb_publishable_uZ7EhY1iXJGlgC1W2xIXuQ_xTThCf0r";
const BUCKET = "media";

function encodeStoragePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function getPublicUrl(fileName) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeStoragePath(fileName)}`;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const headers = {
    apikey: SUPABASE_KEY,
  };

  const loadFiles = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prefix: "",
            limit: 100,
            offset: 0,
            sortBy: {
              column: "created_at",
              order: "desc",
            },
          }),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Kaydka lama soo akhrin karin.");
      }

      const data = await response.json();

      const safeFiles = Array.isArray(data)
        ? data
            .filter((item) => item && item.name && !item.id)
            .map((item) => ({
              ...item,
              url: getPublicUrl(item.name),
            }))
        : [];

      setFiles(safeFiles);
    } catch (error) {
      Alert.alert("Khalad", error?.message || "Kaydka lama soo akhrin karin.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function uploadMedia() {
    try {
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
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setUploading(true);

      const asset = result.assets[0];

      const originalExtension = asset.fileName?.split(".").pop();

      const extension =
        originalExtension ||
        (asset.type === "video" ? "mp4" : "jpg");

      const fileName = `${Date.now()}.${extension}`;

      const fileBlob = await fetch(asset.uri).then((res) =>
        res.blob()
      );

      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(fileName)}`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type":
              asset.mimeType ||
              (asset.type === "video" ? "video/mp4" : "image/jpeg"),
            "x-upsert": "false",
          },
          body: fileBlob,
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Faylka lama soo gelin karin.");
      }

      Alert.alert("Waa guul!", "Faylkaaga waa la kaydiyey.");

      await loadFiles();
    } catch (error) {
      Alert.alert(
        "Soo gelintu way fashilantay",
        error?.message || "Fadlan mar kale isku day."
      );
    } finally {
      setUploading(false);
    }
  }

  async function shareFile(url) {
    try {
      await Share.share({ message: url });
    } catch (error) {
      Alert.alert("Khalad", "Faylka lama wadaagi karin.");
    }
  }

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>AV</Text>

        <Text style={styles.title}>Abdiqadir Vision</Text>

        <Text style={styles.subtitle}>
          Your memories, safely stored.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.disabledButton]}
        onPress={uploadMedia}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.uploadText}>
            ＋ Soo geli sawir ama muuqaal
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Kaydkayga</Text>

      {loading && files.length === 0 ? (
        <ActivityIndicator color="#D6AD48" size="large" />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.name}
          numColumns={2}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadFiles}
              tintColor="#D6AD48"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              Weli wax faylal ah lama soo gelin.
            </Text>
          }
          renderItem={({ item }) => {
            const isVideo = /\.(mp4|mov|m4v|webm)$/i.test(item.name);

            return (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(item.url).catch(() =>
                      Alert.alert("Khalad", "Faylka lama furi karin.")
                    )
                  }
                  activeOpacity={0.85}
                >
                  {isVideo ? (
                    <View style={styles.videoBox}>
                      <Text style={styles.videoIcon}>▶</Text>
                      <Text style={styles.videoText}>Muuqaal</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>

                <Text style={styles.fileName} numberOfLines={1}>
                  {item.name}
                </Text>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => shareFile(item.url)}
                >
                  <Text style={styles.shareText}>Wadaag</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
    paddingHorizontal: 16,
  },
  header: {
    alignItems: "center",
    paddingVertical: 28,
  },
  logo: {
    color: "#D6AD48",
    fontSize: 48,
    fontWeight: "bold",
    borderWidth: 2,
    borderColor: "#D6AD48",
    borderRadius: 50,
    width: 85,
    height: 85,
    textAlign: "center",
    textAlignVertical: "center",
  },
  title: {
    color: "#D6AD48",
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 12,
  },
  subtitle: {
    color: "#aaa",
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: "#D6AD48",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
  },
  disabledButton: {
    opacity: 0.7,
  },
  uploadText: {
    color: "#080808",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    color: "#D6AD48",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  empty: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 35,
  },
  card: {
    flex: 1,
    backgroundColor: "#181818",
    margin: 5,
    padding: 8,
    borderRadius: 12,
  },
  image: {
    width: "100%",
    height: 125,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  videoBox: {
    height: 125,
    backgroundColor: "#292929",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  videoIcon: {
    color: "#D6AD48",
    fontSize: 35,
  },
  videoText: {
    color: "#fff",
  },
  fileName: {
    color: "#fff",
    marginTop: 8,
    fontSize: 12,
  },
  shareButton: {
    backgroundColor: "#D6AD48",
    padding: 8,
    borderRadius: 7,
    marginTop: 8,
    alignItems: "center",
  },
  shareText: {
    color: "#000",
    fontWeight: "bold",
  },
});
