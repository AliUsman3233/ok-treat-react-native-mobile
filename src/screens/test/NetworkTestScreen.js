import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { CLOUDINARY_UPLOAD_URL } from '../../config/cloudinary';

export default function NetworkTestScreen({ navigation }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testNetworkConnectivity = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Google (basic internet)
    addResult('🌐 Testing basic internet connectivity...', 'info');
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      addResult(`✅ Google: ${response.status}`, 'success');
    } catch (error) {
      addResult(`❌ Google: ${error.message}`, 'error');
    }

    // Test 2: Cloudinary API
    addResult('☁️ Testing Cloudinary API access...', 'info');
    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL.replace('/upload', ''), { method: 'HEAD' });
      addResult(`✅ Cloudinary API: ${response.status}`, 'success');
    } catch (error) {
      addResult(`❌ Cloudinary API: ${error.message}`, 'error');
    }

    // Test 3: Backend API
    addResult('🔧 Testing backend API...', 'info');
    try {
      const response = await fetch('http://localhost:3000/api/status');
      addResult(`✅ Backend: ${response.status}`, 'success');
    } catch (error) {
      addResult(`❌ Backend: ${error.message}`, 'error');
    }

    // Test 4: HTTPS test
    addResult('🔒 Testing HTTPS connection...', 'info');
    try {
      const response = await fetch('https://httpbin.org/get');
      addResult(`✅ HTTPS: ${response.status}`, 'success');
    } catch (error) {
      addResult(`❌ HTTPS: ${error.message}`, 'error');
    }

    setTesting(false);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#666';
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Network Diagnostics</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Testing Network Connectivity</Text>
          <Text style={styles.infoText}>
            This will test connections to various services to diagnose network issues.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          onPress={testNetworkConnectivity}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.testButtonText}>Testing...</Text>
            </>
          ) : (
            <Text style={styles.testButtonText}>Run Network Tests</Text>
          )}
        </TouchableOpacity>

        <ScrollView style={styles.resultsContainer}>
          {results.length === 0 ? (
            <Text style={styles.noResults}>
              Press "Run Network Tests" to check connectivity
            </Text>
          ) : (
            results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
                <Text style={[styles.resultText, { color: getResultColor(result.type) }]}>
                  {result.message}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>Common Issues:</Text>
          <Text style={styles.helpText}>• No internet connection</Text>
          <Text style={styles.helpText}>• Firewall blocking external APIs</Text>
          <Text style={styles.helpText}>• Corporate network restrictions</Text>
          <Text style={styles.helpText}>• VPN interfering with connections</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: '#32A6D8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#191919',
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  testButton: {
    backgroundColor: '#32A6D8',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  testButtonDisabled: {
    backgroundColor: '#999',
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  noResults: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    marginBottom: 10,
  },
  resultTime: {
    color: '#666',
    fontSize: 10,
    marginBottom: 2,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  helpBox: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
});
