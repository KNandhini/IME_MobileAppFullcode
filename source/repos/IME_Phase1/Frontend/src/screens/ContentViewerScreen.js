import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { contentService } from '../services/contentService';
import { ContentViewerScreenStyles as styles } from './screenStyles';

const ContentViewerScreen = ({ route }) => {
  const { pageKey, title } = route.params;
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => { loadContent(); }, [pageKey]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await contentService.getByKey(pageKey);
      if (response.success) setContent(response.data);
    } catch (error) {
      // 404 = content not yet in DB
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🚧</Text>
        <Text style={styles.emptyTitle}>Content Coming Soon</Text>
        <Text style={styles.emptySubtitle}>This section is being prepared.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{content.pageTitle}</Text>
        </View>
        <View style={styles.body}>
          <RenderHtml
            contentWidth={width - 40}
            source={{ html: content.content }}
            tagsStyles={{
              h1: { color: '#1E3A5F', fontSize: 22, fontWeight: '800', marginBottom: 10 },
              h2: { color: '#1E3A5F', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
              p: { color: '#444', fontSize: 15, lineHeight: 24 },
              li: { color: '#444', fontSize: 15, lineHeight: 24 },
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};



export default ContentViewerScreen;