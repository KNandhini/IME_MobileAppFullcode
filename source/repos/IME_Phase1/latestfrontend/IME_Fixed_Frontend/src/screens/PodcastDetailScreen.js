import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Card, Chip, IconButton, List } from 'react-native-paper';
import { podcastService } from '../services/podcastService';
import { fileService } from '../services/fileService';

const PodcastDetailScreen = ({ route }) => {
  const { podcastId } = route.params;
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPodcast();
  }, [podcastId]);

  const loadPodcast = async () => {
    setLoading(true);
    try {
      const response = await podcastService.getById(podcastId);
      if (response.success) {
        setPodcast(response.data);
      }
    } catch (error) {
      console.error('Failed to load podcast:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handlePlayAudio = async () => {
    try {
      let audioUrl = podcast.externalLink;

      // If there's an audio file attachment, use that
      const audioAttachment = podcast.attachments?.find(
        (att) =>
          att.fileType?.includes('audio') ||
          att.fileName?.match(/\.(mp3|wav|m4a|aac)$/i)
      );

      if (audioAttachment) {
        audioUrl = fileService.getFileUrl(audioAttachment.filePath);
      }

      if (audioUrl) {
        const supported = await Linking.canOpenURL(audioUrl);
        if (supported) {
          await Linking.openURL(audioUrl);
        }
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const handleAttachmentPress = async (attachment) => {
    try {
      const url = fileService.getFileUrl(attachment.filePath);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open attachment:', error);
    }
  };

  const getDocumentAttachments = () => {
    if (!podcast?.attachments) return [];
    return podcast.attachments.filter(
      (att) =>
        !att.fileType?.includes('audio') &&
        !att.fileType?.includes('image') &&
        !att.fileName?.match(/\.(mp3|wav|m4a|aac|jpg|jpeg|png|gif)$/i)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Podcast not found</Text>
      </View>
    );
  }

  const documentAttachments = getDocumentAttachments();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {podcast.coverImage ? (
          <Image
            source={{ uri: podcast.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <IconButton icon="podcast" iconColor="#fff" size={80} />
          </View>
        )}

        <TouchableOpacity style={styles.playButton} onPress={handlePlayAudio}>
          <IconButton icon="play-circle" iconColor="#2196F3" size={80} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{podcast.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatDate(podcast.publishDate)}</Text>
            {podcast.duration && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.duration}>
                  {formatDuration(podcast.duration)}
                </Text>
              </>
            )}
          </View>
        </View>

        {podcast.speaker && (
          <Card style={styles.speakerCard}>
            <Card.Content>
              <View style={styles.speakerRow}>
                <IconButton icon="account-voice" size={24} iconColor="#2196F3" />
                <View style={styles.speakerInfo}>
                  <Text style={styles.speakerLabel}>Speaker</Text>
                  <Text style={styles.speakerName}>{podcast.speaker}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About this Episode</Text>
            <Text style={styles.description}>{podcast.description}</Text>
          </Card.Content>
        </Card>

        {podcast.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <Chip
              icon="tag"
              style={styles.categoryChip}
              textStyle={styles.categoryText}
            >
              {podcast.category}
            </Chip>
          </View>
        )}

        {podcast.tags && podcast.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Topics:</Text>
            <View style={styles.tags}>
              {podcast.tags.map((tag, index) => (
                <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {documentAttachments.length > 0 && (
          <Card style={styles.attachmentsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Show Notes & Resources ({documentAttachments.length})
              </Text>
              {documentAttachments.map((attachment) => (
                <TouchableOpacity
                  key={attachment.attachmentId}
                  onPress={() => handleAttachmentPress(attachment)}
                  style={styles.attachmentItem}
                >
                  <List.Item
                    title={attachment.fileName}
                    description={attachment.fileType}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          attachment.fileType?.includes('pdf')
                            ? 'file-pdf-box'
                            : 'file-document'
                        }
                        color="#2196F3"
                      />
                    )}
                    right={(props) => (
                      <List.Icon {...props} icon="download" color="#666" />
                    )}
                  />
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        {podcast.externalLink && (
          <TouchableOpacity
            onPress={() => Linking.openURL(podcast.externalLink)}
            style={styles.externalLink}
          >
            <IconButton icon="spotify" size={24} iconColor="#1DB954" />
            <Text style={styles.externalLinkText}>Listen on Spotify/YouTube</Text>
            <IconButton icon="open-in-new" size={20} iconColor="#666" />
          </TouchableOpacity>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <IconButton icon="share-variant" size={24} iconColor="#2196F3" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconButton icon="download" size={24} iconColor="#2196F3" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <IconButton icon="playlist-plus" size={24} iconColor="#2196F3" />
            <Text style={styles.actionText}>Add to Playlist</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 30,
  },
  coverImage: {
    width: 250,
    height: 250,
    borderRadius: 16,
  },
  coverPlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    right: '50%',
    transform: [{ translateX: 40 }],
    backgroundColor: '#fff',
    borderRadius: 50,
    elevation: 4,
  },
  content: {
    padding: 15,
  },
  titleSection: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  separator: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 8,
  },
  duration: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  speakerCard: {
    marginBottom: 15,
    elevation: 2,
    backgroundColor: '#E3F2FD',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerLabel: {
    fontSize: 12,
    color: '#666',
  },
  speakerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  descriptionCard: {
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  categoryChip: {
    backgroundColor: '#FFF3E0',
  },
  categoryText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  tagsContainer: {
    marginBottom: 15,
  },
  tagsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  tagText: {
    fontSize: 12,
    color: '#2196F3',
  },
  attachmentsCard: {
    marginBottom: 15,
    elevation: 2,
  },
  attachmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  externalLinkText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default PodcastDetailScreen;
