import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB, IconButton } from 'react-native-paper';
import { circularService } from '../services/circularService';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
const CircularScreen = ({ navigation }) => {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCirculars();
  }, []);
  useFocusEffect(
    useCallback(() => {
      loadCirculars();
    }, [])
  );
  const loadCirculars = async () => {
    setLoading(true);
    try {
      const response = await circularService.getAll();
      if (response.success) {
        setCirculars(response.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCirculars();
  };

  const deleteCircular = (id) => {
    Alert.alert(
      "Delete Circular",
      "Are you sure you want to delete this circular?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await circularService.delete(id);
            loadCirculars();
          }
        }
      ]
    );
  };

  const renderCircular = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>

        {item.circularNumber && (
          <Chip style={styles.chip}>
            {item.circularNumber}
          </Chip>
        )}

        <Title>{item.title}</Title>
        <Paragraph numberOfLines={3}>
          {item.description}
        </Paragraph>

        <View style={styles.footer}>
          <Text style={styles.date}>
            {item.publishDate
              ? new Date(item.publishDate).toLocaleDateString()
              : ''}
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionRow}>
          <IconButton
            icon="pencil"
            iconColor="blue"
            onPress={() => navigation.navigate('AddCircular', { item })}
          />

          <IconButton
            icon="delete"
            iconColor="red"
            onPress={() => deleteCircular(item.circularId)}
          />
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

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddCircular')}
      />

    </View>
  );
};

export default CircularScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  list: {
    padding: 15
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 10
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#E3F2FD'
  },
  footer: {
    marginTop: 10
  },
  date: {
    fontSize: 12,
    color: '#888'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#999'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2196F3'
  }
});