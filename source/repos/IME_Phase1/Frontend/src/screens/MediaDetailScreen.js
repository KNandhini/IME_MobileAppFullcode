import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Card, IconButton, Chip } from 'react-native-paper';
import { mediaService } from '../services/mediaService';
import { fileService } from '../services/fileService';
import { MediaDetailScreenStyles as styles } from './screenStyles';

const { width } = Dimensions.get('window');

const MediaDetailScreen = ({ route }) => {
  const { mediaId } = route.params;
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadMedia();
  }, [mediaId]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await mediaService.getById(mediaId);
      if (response.success) {
        setMedia(response.data);
      }
    } catch (error) {
      console.error('Failed to load media:', error);
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

  const handleVideoPlay = async (videoUrl) => {
    try {
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      }
    } catch (error) {
      console.error('Failed to open video:', error);
    }
  };

  const getMediaFiles = () => {
    if (!media?.attachments) return [];
    return media.attachments.filter(
      (att) =>
        att.fileType?.includes('image') ||
        att.fileType?.includes('video') ||
        att.fileName?.match(/\.(jpg|jpeg|png|gif|bmp|mp4|mov|avi)$/i)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!media) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Media not found</Text>
      </View>
    );
  }

  const mediaFiles = getMediaFiles();
  const isVideo = media.mediaType === 'Video';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mediaViewer}>
        {isVideo ? (
          <View style={styles.videoContainer}>
            <Image
              source={{
                uri:
                  mediaFiles[selectedImage]?.filePath
                    ? fileService.getFileUrl(mediaFiles[selectedImage].filePath)
                    : 'https://via.placeholder.com/400x300/2196F3/FFFFFF?text=Video',
              }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.playButton}
              onPress={() =>
                handleVideoPlay(
                  fileService.getFileUrl(mediaFiles[selectedImage]?.filePath)
                )
              }
            >
              <IconButton icon="play-circle" iconColor={COLORS.white} size={80} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {mediaFiles.length > 0 && (
              <Image
                source={{
                  uri: fileService.getFileUrl(mediaFiles[selectedImage]?.filePath),
                }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            )}
          </>
        )}

        {mediaFiles.length > 1 && (
          <View style={styles.controls}>
            <IconButton
              icon="chevron-left"
              iconColor={COLORS.white}
              size={30}
              onPress={() =>
                setSelectedImage((prev) =>
                  prev > 0 ? prev - 1 : mediaFiles.length - 1
                )
              }
              style={styles.controlButton}
            />
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {selectedImage + 1} / {mediaFiles.length}
              </Text>
            </View>
            <IconButton
              icon="chevron-right"
              iconColor={COLORS.white}
              size={30}
              onPress={() =>
                setSelectedImage((prev) =>
                  prev < mediaFiles.length - 1 ? prev + 1 : 0
                )
              }
              style={styles.controlButton}
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <GradientHeader style={styles.header}>
          <Chip
            icon={isVideo ? 'video' : 'image'}
            style={[
              styles.typeChip,
              { backgroundColor: isVideo ? '#FF5722' : '#4CAF50' },
            ]}
            textStyle={styles.typeText}
          >
            {media.mediaType}
          </Chip>
          <Text style={styles.date}>{formatDate(media.uploadDate)}</Text>
        </GradientHeader>

        <Text style={styles.title}>{media.title}</Text>

        {media.description && (
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <Text style={styles.description}>{media.description}</Text>
            </Card.Content>
          </Card>
        )}

        {media.albumName && (
          <View style={styles.albumContainer}>
            <Text style={styles.albumLabel}>Album:</Text>
            <Text style={styles.albumName}>{media.albumName}</Text>
          </View>
        )}

        {media.tags && media.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Tags:</Text>
            <View style={styles.tags}>
              {media.tags.map((tag, index) => (
                <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {mediaFiles.length > 1 && (
          <View style={styles.thumbnailsContainer}>
            <Text style={styles.sectionTitle}>
              {isVideo ? 'Videos' : 'Gallery'} ({mediaFiles.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mediaFiles.map((file, index) => (
                <TouchableOpacity
                  key={file.attachmentId}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.thumbnailSelected,
                  ]}
                >
                  <Image
                    source={{ uri: fileService.getFileUrl(file.filePath) }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                  {isVideo && (
                    <View style={styles.thumbnailOverlay}>
                      <IconButton icon="play" iconColor={COLORS.white} size={24} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {media.externalLink && (
          <TouchableOpacity
            onPress={() => Linking.openURL(media.externalLink)}
            style={styles.externalLink}
          >
            <Text style={styles.externalLinkText}>
              {isVideo ? 'Watch on YouTube' : 'View Original'}
            </Text>
            <IconButton icon="open-in-new" size={20} iconColor={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};



export default MediaDetailScreen;
