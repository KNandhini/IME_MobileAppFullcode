import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Linking } from 'react-native';
import { Card, Chip, IconButton, List } from 'react-native-paper';
import { podcastService } from '../services/podcastService';
import { fileService } from '../services/fileService';
import { PodcastDetailScreenStyles as styles } from './screenStyles';

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



export default PodcastDetailScreen;
