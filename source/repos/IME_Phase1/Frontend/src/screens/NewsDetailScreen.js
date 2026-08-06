import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Card, Chip, IconButton, List } from 'react-native-paper';
import { newsService } from '../services/newsService';
import { fileService } from '../services/fileService';
import { NewsDetailScreenStyles as styles } from './screenStyles';

const { width } = Dimensions.get('window');

const NewsDetailScreen = ({ route }) => {
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadNews();
  }, [newsId]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const response = await newsService.getById(newsId);
      if (response.success) {
        setNews(response.data);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
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

  const getImageAttachments = () => {
    if (!news?.attachments) return [];
    return news.attachments.filter(
      (att) =>
        att.fileType?.includes('image') ||
        att.fileName?.match(/\.(jpg|jpeg|png|gif|bmp)$/i)
    );
  };

  const getDocumentAttachments = () => {
    if (!news?.attachments) return [];
    return news.attachments.filter(
      (att) =>
        !att.fileType?.includes('image') &&
        !att.fileName?.match(/\.(jpg|jpeg|png|gif|bmp)$/i)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>News not found</Text>
      </View>
    );
  }

  const imageAttachments = getImageAttachments();
  const documentAttachments = getDocumentAttachments();

  return (
    <ScrollView style={styles.container}>
      {imageAttachments.length > 0 && (
        <View style={styles.imageGallery}>
          <Image
            source={{ uri: fileService.getFileUrl(imageAttachments[selectedImage].filePath) }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {imageAttachments.length > 1 && (
            <View style={styles.imageControls}>
              <IconButton
                icon="chevron-left"
                iconColor={COLORS.white}
                size={30}
                onPress={() =>
                  setSelectedImage((prev) =>
                    prev > 0 ? prev - 1 : imageAttachments.length - 1
                  )
                }
                style={styles.imageButton}
              />
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {selectedImage + 1} / {imageAttachments.length}
                </Text>
              </View>
              <IconButton
                icon="chevron-right"
                iconColor={COLORS.white}
                size={30}
                onPress={() =>
                  setSelectedImage((prev) =>
                    prev < imageAttachments.length - 1 ? prev + 1 : 0
                  )
                }
                style={styles.imageButton}
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        <GradientHeader style={styles.header}>
          <Text style={styles.category}>{news.category}</Text>
          <Text style={styles.date}>{formatDate(news.publishDate)}</Text>
        </GradientHeader>

        <Text style={styles.title}>{news.title}</Text>

        {news.author && (
          <View style={styles.authorContainer}>
            <Text style={styles.authorLabel}>By </Text>
            <Text style={styles.author}>{news.author}</Text>
          </View>
        )}

        <Card style={styles.contentCard}>
          <Card.Content>
            <Text style={styles.description}>{news.content}</Text>
          </Card.Content>
        </Card>

        {news.tags && news.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Tags:</Text>
            <View style={styles.tags}>
              {news.tags.map((tag, index) => (
                <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {imageAttachments.length > 1 && (
          <View style={styles.thumbnailsContainer}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {imageAttachments.map((img, index) => (
                <TouchableOpacity
                  key={img.attachmentId}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.thumbnailSelected,
                  ]}
                >
                  <Image
                    source={{ uri: fileService.getFileUrl(img.filePath) }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {documentAttachments.length > 0 && (
          <Card style={styles.attachmentsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Documents ({documentAttachments.length})
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
                            : attachment.fileType?.includes('word') ||
                              attachment.fileName?.includes('.doc')
                            ? 'file-word'
                            : attachment.fileType?.includes('excel') ||
                              attachment.fileName?.match(/\.xlsx?$/i)
                            ? 'file-excel'
                            : 'file-document'
                        }
                        color={COLORS.primary}
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

        {news.externalLink && (
          <TouchableOpacity
            onPress={() => Linking.openURL(news.externalLink)}
            style={styles.externalLink}
          >
            <Text style={styles.externalLinkText}>View Source</Text>
            <IconButton icon="open-in-new" size={20} iconColor={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};



export default NewsDetailScreen;
