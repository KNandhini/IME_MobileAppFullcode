import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { circularService } from '../services/circularService';

const CircularScreen = () => {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCirculars();
  }, []);

  const loadCirculars = async () => {
    setLoading(true);
    try {
      const response = await circularService.getAll();
      if (response.success) {
        setCirculars(response.data);
      }
    } catch (error) {
      console.error('Failed to load circulars:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCirculars();
  };

  const renderCircular = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        {item.circularNumber && (
          <Chip style={styles.chip} textStyle={styles.chipText}>
            {item.circularNumber}
          </Chip>
        )}
        <Title>{item.title}</Title>
        <Paragraph numberOfLines={3}>{item.description}</Paragraph>
        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.publishDate).toLocaleDateString()}
          </Text>
          {item.attachmentCount > 0 && (
            <Chip icon="attachment" compact>
              {item.attachmentCount}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {circulars.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No circulars available</Text>
        </View>
      ) : (
        <FlatList
          data={circulars}
          renderItem={renderCircular}
          keyExtractor={(item) => item.circularId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 12,
    color: '#2196F3',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  date: {
    fontSize: 12,
    color: '#999',
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

export default CircularScreen;
