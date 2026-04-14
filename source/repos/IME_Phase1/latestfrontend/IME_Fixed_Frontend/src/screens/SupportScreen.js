import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Card, Title, Paragraph } from 'react-native-paper';
import { supportService } from '../services/supportService';

const Tab = createMaterialTopTabNavigator();

const SupportTabContent = ({ categoryId }) => {
  const [supportList, setSupportList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (categoryId) {
      loadSupport();
    }
  }, [categoryId]);

  const loadSupport = async () => {
    setLoading(true);
    try {
      const response = await supportService.getByCategory(categoryId);
      if (response.success) {
        setSupportList(response.data);
      }
    } catch (error) {
      console.error('Failed to load support:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSupport();
  };

  const renderSupport = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {item.photoPath && (
          <Image source={{ uri: item.photoPath }} style={styles.photo} />
        )}
        <View style={styles.textContainer}>
          <Title style={styles.title} numberOfLines={1}>
            {item.title}
          </Title>
          <Text style={styles.personName}>{item.personName}</Text>
          <Paragraph numberOfLines={2}>{item.description}</Paragraph>
          <Text style={styles.company}>{item.companyOrIndividual}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {supportList.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No support entries available</Text>
        </View>
      ) : (
        <FlatList
          data={supportList}
          renderItem={renderSupport}
          keyExtractor={(item) => item.supportId.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const SupportScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarIndicatorStyle: { backgroundColor: '#2196F3' },
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 120 },
      }}
    >
      <Tab.Screen name="Technical">
        {() => <SupportTabContent categoryId={1} />}
      </Tab.Screen>
      <Tab.Screen name="Legal">
        {() => <SupportTabContent categoryId={2} />}
      </Tab.Screen>
      <Tab.Screen name="Health">
        {() => <SupportTabContent categoryId={3} />}
      </Tab.Screen>
      <Tab.Screen name="Financial">
        {() => <SupportTabContent categoryId={4} />}
      </Tab.Screen>
      <Tab.Screen name="Education">
        {() => <SupportTabContent categoryId={5} />}
      </Tab.Screen>
    </Tab.Navigator>
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
  cardContent: {
    flexDirection: 'row',
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  personName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  company: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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

export default SupportScreen;
