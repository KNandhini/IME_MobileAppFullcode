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
  Alert,
} from 'react-native';
import { Card, Chip, Divider, List, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activityService } from '../services/activityService';
import { fileService } from '../services/fileService';
import { registrationService } from '../services/registrationService';

const ActivityDetailScreen = ({ route }) => {
  const { activityId } = route.params;
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [memberId, setMemberId] = useState(null);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      // Get member ID
      const userStr = await AsyncStorage.getItem('userData');
      let currentMemberId = null;
      if (userStr) {
        const user = JSON.parse(userStr);
        currentMemberId = user.memberId;
        setMemberId(currentMemberId);
      }

      // Load activity details
      const response = await activityService.getById(activityId);
      if (response.success) {
        setActivity(response.data);

        // Check if already registered
        if (currentMemberId) {
          const regResponse = await registrationService.checkRegistration(
            activityId,
            currentMemberId
          );
          if (regResponse.success) {
            setIsRegistered(regResponse.data.isRegistered);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!memberId) {
      Alert.alert('Error', 'Please login to register');
      return;
    }

    // Check deadline
    if (activity.registrationDeadline) {
      const deadline = new Date(activity.registrationDeadline);
      if (new Date() > deadline) {
        Alert.alert('Error', 'Registration deadline has passed');
        return;
      }
    }

    Alert.alert(
      'Confirm Registration',
      `Do you want to register for "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Register',
          onPress: async () => {
            setRegistering(true);
            try {
              const response = await registrationService.register(activityId, memberId);
              if (response.success) {
                setIsRegistered(true);
                Alert.alert('Success', 'Successfully registered for the activity');
                loadActivity(); // Refresh to show updated participant count
              } else {
                Alert.alert('Error', response.message || 'Failed to register');
              }
            } catch (error) {
              console.error('Registration error:', error);
              Alert.alert('Error', 'Failed to register for activity');
            } finally {
              setRegistering(false);
            }
          },
        },
      ]
    );
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

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return '#2196F3';
      case 'ongoing':
        return '#4CAF50';
      case 'completed':
        return '#666';
      case 'cancelled':
        return '#F44336';
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Activity not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {activity.bannerImage && (
        <Image
          source={{ uri: activity.bannerImage }}
          style={styles.banner}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{activity.title}</Text>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(activity.status) },
            ]}
            textStyle={styles.statusText}
          >
            {activity.status}
          </Chip>
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>
                  {formatDate(activity.activityDate)}
                </Text>
                <Text style={styles.infoTime}>
                  {formatTime(activity.activityDate)}
                </Text>
              </View>
            </View>

            {activity.venue && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Venue</Text>
                    <Text style={styles.infoValue}>{activity.venue}</Text>
                  </View>
                </View>
              </>
            )}

            {activity.coordinator && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Coordinator</Text>
                    <Text style={styles.infoValue}>{activity.coordinator}</Text>
                  </View>
                </View>
              </>
            )}

            {activity.registrationDeadline && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>⏰</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Registration Deadline</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(activity.registrationDeadline)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.descriptionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>About Activity</Text>
            <Text style={styles.description}>{activity.description}</Text>
          </Card.Content>
        </Card>

        {activity.participants && activity.participants.length > 0 && (
          <Card style={styles.participantsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Participants ({activity.participants.length})
              </Text>
              {activity.participants.map((participant, index) => (
                <List.Item
                  key={index}
                  title={participant.memberName}
                  description={participant.registrationDate ?
                    `Registered on ${formatDate(participant.registrationDate)}` : ''}
                  left={(props) => (
                    <List.Icon {...props} icon="account-circle" color="#2196F3" />
                  )}
                  style={styles.participantItem}
                />
              ))}
            </Card.Content>
          </Card>
        )}

        {activity.attachments && activity.attachments.length > 0 && (
          <Card style={styles.attachmentsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                Attachments ({activity.attachments.length})
              </Text>
              {activity.attachments.map((attachment) => (
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
                          attachment.fileType?.includes('image')
                            ? 'file-image'
                            : attachment.fileType?.includes('pdf')
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
      </View>

      {activity.status === 'Upcoming' && !isRegistered && (
        <View style={styles.fabContainer}>
          <Button mode="contained" onPress={handleRegister} loading={registering} disabled={registering}
            style={styles.registerBtn}>
            Register for Activity
          </Button>
        </View>
      )}

      {isRegistered && (
        <View style={styles.registeredBanner}>
          <Text style={styles.registeredText}>✓ You are registered for this activity</Text>
        </View>
      )}
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
  banner: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 15,
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoCard: {
    marginBottom: 15,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
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
  participantsCard: {
    marginBottom: 15,
    elevation: 2,
  },
  participantItem: {
    paddingHorizontal: 0,
  },
  attachmentsCard: {
    marginBottom: 15,
    elevation: 2,
  },
  attachmentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fabContainer: {
    padding: 16,
  },
  registerBtn: {
    backgroundColor: '#4CAF50',
  },
  registeredBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 15,
    alignItems: 'center',
  },
  registeredText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivityDetailScreen;
