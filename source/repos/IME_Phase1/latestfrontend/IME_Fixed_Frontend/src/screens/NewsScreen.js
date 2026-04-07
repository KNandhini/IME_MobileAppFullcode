import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useNavigation } from '@react-navigation/native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { newsService } from '../services/newsService';
import { mediaService } from '../services/mediaService';
import { podcastService } from '../services/podcastService';

const Tab = createMaterialTopTabNavigator();

const NewsTab = () => {
  const navigation = useNavigation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getAll();
      if (response.success) {
        setNews(response.data);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNews();
  };

  const renderNews = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('NewsDetail', { newsId: item.newsId })}>
      <Card style={styles.card}>
        {item.coverImagePath && (
          <Card.Cover source={{ uri: item.coverImagePath }} />
        )}
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph numberOfLines={3}>{item.shortDescription}</Paragraph>
          <Text style={styles.date}>
            {new Date(item.publishDate).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabContent}>
      {news.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No news available</Text>
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={renderNews}
          keyExtractor={(item) => item.newsId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const MediaTab = () => {
  const navigation = useNavigation();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await mediaService.getAll();
      if (response.success) {
        setMedia(response.data);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  const renderMedia = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('MediaDetail', { mediaId: item.mediaId })}>
      <Card style={styles.card}>
        {item.thumbnailPath && (
          <Card.Cover source={{ uri: item.thumbnailPath }} />
        )}
        <Card.Content>
          <Title>{item.title || 'Untitled'}</Title>
          <Paragraph numberOfLines={2}>{item.description}</Paragraph>
          <Text style={styles.mediaType}>{item.mediaType}</Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabContent}>
      {media.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No media available</Text>
        </View>
      ) : (
        <FlatList
          data={media}
          renderItem={renderMedia}
          keyExtractor={(item) => item.mediaId.toString()}
          contentContainerStyle={styles.list}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const PodcastsTab = () => {
  const navigation = useNavigation();
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      const response = await podcastService.getAll();
      if (response.success) {
        setPodcasts(response.data);
      }
    } catch (error) {
      console.error('Failed to load podcasts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPodcasts();
  };

  const renderPodcast = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PodcastDetail', { podcastId: item.podcastId })}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph>{item.speaker}</Paragraph>
          <Paragraph numberOfLines={2}>{item.description}</Paragraph>
          <View style={styles.podcastInfo}>
            <Text style={styles.duration}>{item.duration}</Text>
            <Text style={styles.date}>
              {new Date(item.publishDate).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.tabContent}>
      {podcasts.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No podcasts available</Text>
        </View>
      ) : (
        <FlatList
          data={podcasts}
          renderItem={renderPodcast}
          keyExtractor={(item) => item.podcastId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const NewsScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarIndicatorStyle: { backgroundColor: '#2196F3' },
      }}
    >
      <Tab.Screen name="News" component={NewsTab} />
      <Tab.Screen name="Media" component={MediaTab} />
      <Tab.Screen name="Podcasts" component={PodcastsTab} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 15,
  },
  card: {
    marginBottom: 15,
    elevation: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  mediaType: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 8,
    fontWeight: '500',
  },
  podcastInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default NewsScreen;
