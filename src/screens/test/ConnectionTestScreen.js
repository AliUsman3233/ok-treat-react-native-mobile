import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';

export default function ConnectionTestScreen({ navigation }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { message, type, timestamp }]);
  };

  const testConnection = async () => {
    setTesting(true);
    setResults([]);

    addResult('🔍 Starting connection test...', 'info');
    addResult(`Target: ${API_ENDPOINTS.STATUS}`, 'info');
    addResult(`Timeout: ${API_CONFIG.TIMEOUT}ms`, 'info');

    try {
      addResult('📡 Sending request...', 'info');
      
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(API_ENDPOINTS.STATUS, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      addResult(`⏱️ Response time: ${duration}ms`, 'info');
      addResult(`📊 Status code: ${response.status}`, response.ok ? 'success' : 'error');

      if (response.ok) {
        const data = await response.json();
        addResult('✅ Connection successful!', 'success');
        addResult(`Server message: ${data.message}`, 'success');
        addResult(`Database: ${data.database}`, data.database === 'connected' ? 'success' : 'warning');
        addResult(`Uptime: ${Math.floor(data.uptime)}s`, 'info');
      } else {
        addResult(`❌ Server returned error: ${response.status}`, 'error');
        const text = await response.text();
        addResult(`Response: ${text}`, 'error');
      }
    } catch (error) {
      addResult(`❌ Connection failed!`, 'error');
      addResult(`Error: ${error.name}`, 'error');
      addResult(`Message: ${error.message}`, 'error');

      if (error.name === 'AbortError') {
        addResult('⏰ Request timed out', 'error');
        addResult('Possible causes:', 'warning');
        addResult('- Backend not running', 'warning');
        addResult('- ADB reverse not configured', 'warning');
        addResult('- Wrong IP/port', 'warning');
      } else if (error.message.includes('Network request failed')) {
        addResult('🔌 Network error', 'error');
        addResult('Possible causes:', 'warning');
        addResult('- ADB reverse not set up', 'warning');
        addResult('- Not on same network (WiFi)', 'warning');
        addResult('- Firewall blocking connection', 'warning');
      }
    } finally {
      setTesting(false);
    }
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
          <Text style={styles.title}>Connection Test</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Testing Connection To:</Text>
          <Text style={styles.infoUrl}>{API_ENDPOINTS.STATUS}</Text>
        </View>

        <TouchableOpacity
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.testButtonText}>Testing...</Text>
            </>
          ) : (
            <Text style={styles.testButtonText}>Run Connection Test</Text>
          )}
        </TouchableOpacity>

        <ScrollView style={styles.resultsContainer}>
          {results.length === 0 ? (
            <Text style={styles.noResults}>
              Press "Run Connection Test" to check server connectivity
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
          <Text style={styles.helpTitle}>Quick Fixes:</Text>
          <Text style={styles.helpText}>1. Run: adb reverse tcp:3000 tcp:3000</Text>
          <Text style={styles.helpText}>2. Restart backend: npm run dev</Text>
          <Text style={styles.helpText}>3. Close and reopen this app</Text>
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
    color: '#666',
    marginBottom: 5,
  },
  infoUrl: {
    fontSize: 12,
    color: '#32A6D8',
    fontFamily: 'monospace',
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
