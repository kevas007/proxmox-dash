import React, { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const TranslationDebug: React.FC = () => {
  const { t, language, isLoading } = useTranslation();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Vérifier si les traductions se chargent
    const checkTranslations = () => {
      const testKeys = [
        'common.loading',
        'navigation.dashboard',
        'nodes.title',
        'settings.title'
      ];

      const results = testKeys.map(key => ({
        key,
        translation: t(key),
        isLoaded: t(key) !== key
      }));

      setDebugInfo({
        language,
        isLoading,
        testResults: results,
        timestamp: new Date().toISOString()
      });
    };

    checkTranslations();
  }, [t, language, isLoading]);

  if (isLoading) {
    return <div className="p-4 bg-yellow-100 rounded">Loading translations...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Translation Debug</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Language:</strong> {language}</div>
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Timestamp:</strong> {debugInfo?.timestamp}</div>

        <div className="mt-4">
          <strong>Test Results:</strong>
          <ul className="ml-4 space-y-1">
            {debugInfo?.testResults?.map((result: any, index: number) => (
              <li key={index} className={result.isLoaded ? 'text-green-600' : 'text-red-600'}>
                {result.key}: "{result.translation}" {result.isLoaded ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TranslationDebug;
