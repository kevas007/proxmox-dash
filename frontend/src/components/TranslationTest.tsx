import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import TranslationDebug from './TranslationDebug';

const TranslationTest: React.FC = () => {
  const { t, language, changeLanguage, availableLanguages } = useTranslation();

  return (
    <div className="space-y-6">
      <TranslationDebug />

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test de Traduction / Translation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Navigation</h3>
            <ul className="space-y-1 text-sm">
              <li>Dashboard: {t('navigation.dashboard')}</li>
              <li>Nodes: {t('navigation.nodes')}</li>
              <li>VMs: {t('navigation.vms')}</li>
              <li>LXC: {t('navigation.lxc')}</li>
              <li>Settings: {t('navigation.settings')}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Common</h3>
            <ul className="space-y-1 text-sm">
              <li>Save: {t('common.save')}</li>
              <li>Cancel: {t('common.cancel')}</li>
              <li>Loading: {t('common.loading')}</li>
              <li>Error: {t('common.error')}</li>
              <li>Success: {t('common.success')}</li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Language Selector</h3>
          <div className="flex space-x-2 items-center">
            <Select
              value={language}
              onChange={(e) => changeLanguage(e.target.value as any)}
              options={[
                { value: 'fr', label: '🇫🇷 Français' },
                { value: 'en', label: '🇺🇸 English' }
              ]}
              className="w-40"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current language: {language}
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationTest;
