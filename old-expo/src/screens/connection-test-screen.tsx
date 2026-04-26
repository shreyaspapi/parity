/**
 * Connection Test Screen
 * Use this to test Unraid server connection directly from your mobile device
 * 
 * To use: Temporarily add this screen to your navigation stack
 */

import { useTheme } from '@/src/providers/theme-provider';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SERVER_URLS = [
  'http://192.168.21.1:3001/graphql',  // Default port
  'http://192.168.21.1/graphql',       // No port
];

const API_KEY = '89a7ae67e300c9c05441cec0951930de654058ac61bde7f23a3625cec8568781';

const HEALTH_CHECK_QUERY = `
  query HealthCheck {
    info {
      os {
        platform
        __typename
      }
      __typename
    }
  }
`;

interface TestResult {
  url: string;
  success: boolean;
  error?: string;
  elapsed: number;
  data?: any;
}

export function ConnectionTestScreen() {
  const { isDark } = useTheme();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const testSingleConnection = async (serverUrl: string): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      console.log('Testing URL:', serverUrl);
      console.log('Using API Key:', API_KEY.substring(0, 10) + '...');
      
      const fetchPromise = fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          operationName: 'HealthCheck',
          query: HEALTH_CHECK_QUERY,
          variables: {},
        }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      const elapsed = Date.now() - startTime;

      if (!response.ok) {
        return {
          url: serverUrl,
          success: false,
          error: `HTTP ${response.status}`,
          elapsed,
        };
      }

      const data = await response.json();

      if (data.errors) {
        return {
          url: serverUrl,
          success: false,
          error: `GraphQL: ${data.errors[0]?.message || 'Unknown error'}`,
          elapsed,
        };
      }

      if (data.data && data.data.info) {
        return {
          url: serverUrl,
          success: true,
          elapsed,
          data,
        };
      }

      return {
        url: serverUrl,
        success: false,
        error: 'Invalid response',
        elapsed,
      };
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      return {
        url: serverUrl,
        success: false,
        error: error.message || 'Network error',
        elapsed,
      };
    }
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    setSuccessUrl(null);

    const testResults: TestResult[] = [];

    for (const url of SERVER_URLS) {
      const result = await testSingleConnection(url);
      testResults.push(result);
      setResults([...testResults]);

      if (result.success) {
        setSuccessUrl(url);
        Alert.alert(
          '✅ Connection Successful!',
          `Use this URL in your app:\n\n${url}\n\nPlatform: ${result.data.info.os.platform}`,
          [{ text: 'OK' }]
        );
        setTesting(false);
        return;
      }
    }

    Alert.alert(
      '❌ All Connections Failed',
      'Check the results below for details. Make sure:\n\n• Device is on same network\n• Unraid API is running\n• Port is correct (usually 3001)',
      [{ text: 'OK' }]
    );
    setTesting(false);
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.success) return '✅';
    if (result.error?.includes('Timeout')) return '⏱️';
    if (result.error?.includes('HTTP')) return '🔌';
    return '❌';
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#f2f2f7' },
      ]}
    >
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            Connection Test
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
            Test your Unraid server connection
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Server Details
          </Text>
          <View style={styles.detail}>
            <Text style={[styles.detailLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              API Key:
            </Text>
            <Text style={[styles.detailValue, { color: isDark ? '#ffffff' : '#000000' }]}>
              {API_KEY.substring(0, 10)}...{API_KEY.substring(API_KEY.length - 10)}
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
            Testing URLs:
          </Text>
          {SERVER_URLS.map((url, index) => (
            <Text
              key={index}
              style={[styles.urlText, { color: isDark ? '#0a84ff' : '#007aff' }]}
            >
              • {url}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: testing ? '#48484a' : '#007aff',
            },
          ]}
          onPress={runTests}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Run Connection Test</Text>
          )}
        </TouchableOpacity>

        {results.length > 0 && (
          <View style={styles.results}>
            <Text style={[styles.resultsTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Test Results
            </Text>
            {results.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                    borderColor: result.success
                      ? '#34c759'
                      : isDark
                      ? '#38383a'
                      : '#c7c7cc',
                  },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultIcon}>{getStatusIcon(result)}</Text>
                  <Text style={[styles.resultUrl, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {result.url}
                  </Text>
                </View>
                <View style={styles.resultDetails}>
                  <Text style={[styles.resultLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                    Status:
                  </Text>
                  <Text
                    style={[
                      styles.resultValue,
                      {
                        color: result.success
                          ? '#34c759'
                          : isDark
                          ? '#ff453a'
                          : '#ff3b30',
                      },
                    ]}
                  >
                    {result.success ? 'Success' : result.error}
                  </Text>
                </View>
                <View style={styles.resultDetails}>
                  <Text style={[styles.resultLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                    Response Time:
                  </Text>
                  <Text style={[styles.resultValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {result.elapsed}ms
                  </Text>
                </View>
                {result.data && (
                  <View style={styles.resultDetails}>
                    <Text style={[styles.resultLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                      Platform:
                    </Text>
                    <Text style={[styles.resultValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                      {result.data.info.os.platform}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {successUrl && (
          <View
            style={[
              styles.successCard,
              { backgroundColor: isDark ? '#1a3a1f' : '#d1f2e0' },
            ]}
          >
            <Text style={[styles.successTitle, { color: '#34c759' }]}>
              ✅ Use This URL
            </Text>
            <Text style={[styles.successUrl, { color: isDark ? '#ffffff' : '#000000' }]}>
              {successUrl}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  detail: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  urlText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  results: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  resultUrl: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  successCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successUrl: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});

